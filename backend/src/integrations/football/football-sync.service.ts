import type { SupabaseClient } from '@supabase/supabase-js';

import { env } from '../../config/env.js';
import { supabaseServiceRoleClient } from '../../lib/supabase.js';
import { HttpError } from '../../utils/http-error.js';
import { mapSupabaseError } from '../../utils/supabase-error.js';
import { normalizeClubName, buildManchesterUnitedLineup } from './api-football.mapper.js';
import { ApiFootballClient } from './api-football.client.js';
import type { FootballProvider } from './football-provider.js';
import type {
  FootballIntegrationStatus,
  FootballSyncDifference,
  FootballSyncSummary,
  SyncedFixture,
  SyncedLineupPlayer,
  SyncedPlayer,
  SyncedTeam,
} from './football-sync.types.js';

type FootballSyncMode = 'fixtures' | 'live' | 'fixture' | 'test';

interface SeasonRow {
  id: string;
  name: string;
}

interface ClubRow {
  id: string;
  name: string;
  short_name: string | null;
  country: string | null;
  logo_url: string | null;
  active: boolean;
  external_provider: string | null;
  external_id: string | null;
  last_synced_at: string | null;
}

interface MatchSyncRow {
  id: string;
  season_id: string;
  opponent_name: string;
  opponent_logo_url: string | null;
  opponent_club_id: string | null;
  competition: string;
  match_date: string;
  venue: string | null;
  is_home: boolean;
  manchester_united_score: number | null;
  opponent_score: number | null;
  status: 'scheduled' | 'finished' | 'cancelled';
  voting_status: 'closed' | 'open' | 'completed';
  results_published: boolean;
  external_provider: string | null;
  external_fixture_id: string | null;
  external_status: string | null;
  last_synced_at: string | null;
  sync_locked: boolean;
  manually_corrected: boolean;
}

interface PlayerSyncRow {
  id: string;
  first_name: string;
  last_name: string;
  shirt_number: number | null;
  position: string;
  photo_url: string | null;
  active: boolean;
  external_provider: string | null;
  external_player_id: string | null;
  last_synced_at: string | null;
}

interface SyncRunRow {
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'error';
  message: string | null;
}

const providerName = 'api-football' as const;
const seasonFields = 'id, name';
const clubFields =
  'id, name, short_name, country, logo_url, active, external_provider, external_id, last_synced_at';
const matchFields =
  'id, season_id, opponent_name, opponent_logo_url, opponent_club_id, competition, match_date, venue, is_home, manchester_united_score, opponent_score, status, voting_status, results_published, external_provider, external_fixture_id, external_status, last_synced_at, sync_locked, manually_corrected';
const playerFields =
  'id, first_name, last_name, shirt_number, position, photo_url, active, external_provider, external_player_id, last_synced_at';

const createSummary = (): FootballSyncSummary => ({
  created: 0,
  updated: 0,
  unchanged: 0,
  errors: 0,
  differences: [],
  lastSyncedAt: new Date().toISOString(),
});

const mergeSummary = (target: FootballSyncSummary, source: FootballSyncSummary) => {
  target.created += source.created;
  target.updated += source.updated;
  target.unchanged += source.unchanged;
  target.errors += source.errors;
  target.differences.push(...source.differences);
  target.lastSyncedAt = source.lastSyncedAt;
};

const getServiceClient = () => {
  if (!supabaseServiceRoleClient) {
    throw new HttpError(
      500,
      'SUPABASE_SERVICE_ROLE_NOT_CONFIGURED',
      'Supabase service-role key is required for football synchronization',
    );
  }

  return supabaseServiceRoleClient;
};

const getProvider = (): FootballProvider => {
  if (env.FOOTBALL_PROVIDER !== 'api-football') {
    throw new HttpError(
      500,
      'FOOTBALL_PROVIDER_NOT_SUPPORTED',
      'Football provider is not supported',
    );
  }

  return new ApiFootballClient();
};

const getConfiguredTeamId = () => {
  if (!env.MANCHESTER_UNITED_EXTERNAL_ID) {
    throw new HttpError(
      500,
      'FOOTBALL_TEAM_NOT_CONFIGURED',
      'Manchester United external identifier is not configured',
    );
  }

  return env.MANCHESTER_UNITED_EXTERNAL_ID;
};

const getConfiguredSeason = () => {
  if (!/^\d{4}$/.test(env.FOOTBALL_CURRENT_SEASON)) {
    throw new HttpError(
      500,
      'FOOTBALL_SEASON_NOT_CONFIGURED',
      'Football current season must be configured as a four-digit year',
    );
  }

  return env.FOOTBALL_CURRENT_SEASON;
};

const getAllowedCompetitions = () =>
  env.FOOTBALL_ALLOWED_COMPETITIONS.split(',')
    .map((competition) => competition.trim())
    .filter(Boolean);

const isFriendlyCompetition = (competition: string) =>
  /friendly|friendlies/i.test(competition.trim());

const isCompetitionEnabled = (competition: string) => {
  if (isFriendlyCompetition(competition)) {
    return env.FOOTBALL_INCLUDE_FRIENDLIES;
  }

  const allowedCompetitions = getAllowedCompetitions();

  if (allowedCompetitions.length === 0) {
    return true;
  }

  return allowedCompetitions.some(
    (allowedCompetition) => allowedCompetition.toLowerCase() === competition.toLowerCase(),
  );
};

const getSeasonName = (season: string) => `${season}/${Number(season) + 1}`;

const getSeasonDates = (season: string) => ({
  start_date: `${season}-07-01`,
  end_date: `${Number(season) + 1}-06-30`,
});

const toComparableValue = (value: string | number | boolean | null) => {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  return value;
};

const addDifference = (
  differences: FootballSyncDifference[],
  fixtureId: string,
  field: string,
  current: string | number | boolean | null,
  incoming: string | number | boolean | null,
) => {
  if (toComparableValue(current) === toComparableValue(incoming)) {
    return;
  }

  differences.push({
    fixtureId,
    field,
    current,
    incoming,
  });
};

const normalizePlayerName = (player: Pick<SyncedPlayer, 'firstName' | 'lastName'>) =>
  normalizeClubName(`${player.firstName} ${player.lastName}`);

const ensureSeason = async (client: SupabaseClient, season: string) => {
  const seasonName = getSeasonName(season);
  const { data: existingSeason, error: findError } = await client
    .from('seasons')
    .select(seasonFields)
    .eq('name', seasonName)
    .maybeSingle<SeasonRow>();

  if (findError) {
    throw mapSupabaseError(findError, 'Unable to fetch synchronized season');
  }

  if (existingSeason) {
    return existingSeason;
  }

  const { data: createdSeason, error: createError } = await client
    .from('seasons')
    .insert({
      name: seasonName,
      ...getSeasonDates(season),
      status: 'draft',
    })
    .select(seasonFields)
    .maybeSingle<SeasonRow>();

  if (createError) {
    throw mapSupabaseError(createError, 'Unable to create synchronized season');
  }

  if (!createdSeason) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Synchronized season was not returned');
  }

  return createdSeason;
};

const findClubByNormalizedName = async (client: SupabaseClient, team: SyncedTeam) => {
  const { data, error } = await client.from('clubs').select(clubFields);

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch clubs');
  }

  const normalizedIncomingName = normalizeClubName(team.name);

  return ((data ?? []) as ClubRow[]).find(
    (club) => normalizeClubName(club.name) === normalizedIncomingName,
  );
};

const ensureClub = async (client: SupabaseClient, team: SyncedTeam, syncedAt: string) => {
  const { data: existingByExternalId, error: externalError } = await client
    .from('clubs')
    .select(clubFields)
    .eq('external_provider', providerName)
    .eq('external_id', team.externalId)
    .maybeSingle<ClubRow>();

  if (externalError) {
    throw mapSupabaseError(externalError, 'Unable to fetch synchronized club');
  }

  const existingClub = existingByExternalId ?? (await findClubByNormalizedName(client, team));
  const payload = {
    name: team.name,
    short_name: team.shortName,
    country: team.country,
    logo_url: team.logoUrl,
    active: true,
    external_provider: providerName,
    external_id: team.externalId,
    last_synced_at: syncedAt,
  };

  if (existingClub) {
    const { data: updatedClub, error: updateError } = await client
      .from('clubs')
      .update(payload)
      .eq('id', existingClub.id)
      .select(clubFields)
      .maybeSingle<ClubRow>();

    if (updateError) {
      throw mapSupabaseError(updateError, 'Unable to update synchronized club');
    }

    if (!updatedClub) {
      throw new HttpError(500, 'INTERNAL_ERROR', 'Synchronized club was not returned');
    }

    return updatedClub;
  }

  const { data: createdClub, error: createError } = await client
    .from('clubs')
    .insert(payload)
    .select(clubFields)
    .maybeSingle<ClubRow>();

  if (createError) {
    throw mapSupabaseError(createError, 'Unable to create synchronized club');
  }

  if (!createdClub) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Synchronized club was not returned');
  }

  return createdClub;
};

const findMatchByExternalFixtureId = async (client: SupabaseClient, externalFixtureId: string) => {
  const { data, error } = await client
    .from('matches')
    .select(matchFields)
    .eq('external_provider', providerName)
    .eq('external_fixture_id', externalFixtureId)
    .maybeSingle<MatchSyncRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch synchronized match');
  }

  return data;
};

const getMatchById = async (client: SupabaseClient, matchId: string) => {
  const { data, error } = await client
    .from('matches')
    .select(matchFields)
    .eq('id', matchId)
    .maybeSingle<MatchSyncRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch synchronized match');
  }

  if (!data) {
    throw new HttpError(404, 'MATCH_NOT_FOUND', 'Match was not found');
  }

  return data;
};

const getSyncableFixtureStatus = (fixture: SyncedFixture) => {
  if (
    fixture.status === 'finished' &&
    (fixture.manchesterUnitedScore === null || fixture.opponentScore === null)
  ) {
    return 'scheduled' as const;
  }

  return fixture.status;
};

const getVotingStatusForFixture = (fixture: SyncedFixture, existingMatch?: MatchSyncRow | null) => {
  if (existingMatch?.voting_status === 'completed') {
    return 'completed' as const;
  }

  if (existingMatch?.voting_status === 'open') {
    return 'open' as const;
  }

  if (fixture.status === 'cancelled' || fixture.status === 'scheduled') {
    return 'closed' as const;
  }

  return 'closed' as const;
};

const buildMatchPayload = (
  seasonId: string,
  fixture: SyncedFixture,
  club: ClubRow,
  syncedAt: string,
  existingMatch?: MatchSyncRow | null,
) => ({
  season_id: seasonId,
  opponent_name: fixture.opponent.name,
  opponent_logo_url: fixture.opponent.logoUrl,
  opponent_club_id: club.id,
  competition: fixture.competition,
  match_date: fixture.matchDate,
  venue: fixture.venue,
  is_home: fixture.isHome,
  manchester_united_score: fixture.manchesterUnitedScore,
  opponent_score: fixture.opponentScore,
  status: getSyncableFixtureStatus(fixture),
  voting_status: getVotingStatusForFixture(fixture, existingMatch),
  external_provider: providerName,
  external_fixture_id: fixture.externalFixtureId,
  external_status: fixture.externalStatus,
  last_synced_at: syncedAt,
});

const collectLockedMatchDifferences = (
  match: MatchSyncRow,
  fixture: SyncedFixture,
  club: ClubRow,
) => {
  const differences: FootballSyncDifference[] = [];

  addDifference(
    differences,
    fixture.externalFixtureId,
    'opponent_name',
    match.opponent_name,
    fixture.opponent.name,
  );
  addDifference(
    differences,
    fixture.externalFixtureId,
    'opponent_logo_url',
    match.opponent_logo_url,
    fixture.opponent.logoUrl,
  );
  addDifference(
    differences,
    fixture.externalFixtureId,
    'opponent_club_id',
    match.opponent_club_id,
    club.id,
  );
  addDifference(
    differences,
    fixture.externalFixtureId,
    'competition',
    match.competition,
    fixture.competition,
  );
  addDifference(
    differences,
    fixture.externalFixtureId,
    'match_date',
    match.match_date,
    fixture.matchDate,
  );
  addDifference(differences, fixture.externalFixtureId, 'venue', match.venue, fixture.venue);
  addDifference(differences, fixture.externalFixtureId, 'is_home', match.is_home, fixture.isHome);
  addDifference(
    differences,
    fixture.externalFixtureId,
    'manchester_united_score',
    match.manchester_united_score,
    fixture.manchesterUnitedScore,
  );
  addDifference(
    differences,
    fixture.externalFixtureId,
    'opponent_score',
    match.opponent_score,
    fixture.opponentScore,
  );
  addDifference(
    differences,
    fixture.externalFixtureId,
    'status',
    match.status,
    getSyncableFixtureStatus(fixture),
  );

  return differences;
};

const persistFixtureSummary = async (
  client: SupabaseClient,
  fixture: SyncedFixture,
  seasonId: string,
  summary: FootballSyncSummary,
) => {
  const syncedAt = new Date().toISOString();
  const club = await ensureClub(client, fixture.opponent, syncedAt);
  const existingMatch = await findMatchByExternalFixtureId(client, fixture.externalFixtureId);

  if (existingMatch?.sync_locked || existingMatch?.manually_corrected) {
    const differences = collectLockedMatchDifferences(existingMatch, fixture, club);
    summary.differences.push(...differences);

    const { error: updateMetadataError } = await client
      .from('matches')
      .update({
        external_status: fixture.externalStatus,
        last_synced_at: syncedAt,
      })
      .eq('id', existingMatch.id);

    if (updateMetadataError) {
      throw mapSupabaseError(updateMetadataError, 'Unable to update synchronized match metadata');
    }

    summary.unchanged += 1;
    return existingMatch;
  }

  const payload = buildMatchPayload(seasonId, fixture, club, syncedAt, existingMatch);

  if (!existingMatch) {
    const { data: createdMatch, error: createError } = await client
      .from('matches')
      .insert({
        ...payload,
        results_published: false,
      })
      .select(matchFields)
      .maybeSingle<MatchSyncRow>();

    if (createError) {
      throw mapSupabaseError(createError, 'Unable to create synchronized match');
    }

    if (!createdMatch) {
      throw new HttpError(500, 'INTERNAL_ERROR', 'Synchronized match was not returned');
    }

    summary.created += 1;
    return createdMatch;
  }

  const comparisonFields = Object.entries(payload) as Array<
    [keyof typeof payload, string | number | boolean | null]
  >;
  const hasChanges = comparisonFields.some(([field, incomingValue]) => {
    if (field === 'last_synced_at') {
      return false;
    }

    const currentValue = existingMatch[field as keyof MatchSyncRow] as
      string | number | boolean | null;

    return toComparableValue(currentValue) !== toComparableValue(incomingValue);
  });

  const { data: updatedMatch, error: updateError } = await client
    .from('matches')
    .update(payload)
    .eq('id', existingMatch.id)
    .select(matchFields)
    .maybeSingle<MatchSyncRow>();

  if (updateError) {
    throw mapSupabaseError(updateError, 'Unable to update synchronized match');
  }

  if (!updatedMatch) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Synchronized match was not returned');
  }

  if (hasChanges) {
    summary.updated += 1;
  } else {
    summary.unchanged += 1;
  }

  return updatedMatch;
};

const findPlayerByExternalId = async (client: SupabaseClient, externalPlayerId: string) => {
  const { data, error } = await client
    .from('players')
    .select(playerFields)
    .eq('external_provider', providerName)
    .eq('external_player_id', externalPlayerId)
    .maybeSingle<PlayerSyncRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch synchronized player');
  }

  return data;
};

const findPlayerByName = async (client: SupabaseClient, player: SyncedPlayer) => {
  const { data, error } = await client.from('players').select(playerFields);

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch players');
  }

  const normalizedIncomingName = normalizePlayerName(player);

  return ((data ?? []) as PlayerSyncRow[]).find(
    (existingPlayer) =>
      normalizeClubName(`${existingPlayer.first_name} ${existingPlayer.last_name}`) ===
      normalizedIncomingName,
  );
};

const ensurePlayer = async (client: SupabaseClient, player: SyncedPlayer, syncedAt: string) => {
  const existingPlayer =
    (await findPlayerByExternalId(client, player.externalPlayerId)) ??
    (await findPlayerByName(client, player));

  const payload = {
    first_name: player.firstName,
    last_name: player.lastName,
    shirt_number: player.shirtNumber,
    position: player.position,
    ...(player.photoUrl ? { photo_url: player.photoUrl } : {}),
    active: true,
    external_provider: providerName,
    external_player_id: player.externalPlayerId,
    last_synced_at: syncedAt,
  };

  if (existingPlayer) {
    const { data: updatedPlayer, error: updateError } = await client
      .from('players')
      .update(payload)
      .eq('id', existingPlayer.id)
      .select(playerFields)
      .maybeSingle<PlayerSyncRow>();

    if (updateError) {
      throw mapSupabaseError(updateError, 'Unable to update synchronized player');
    }

    if (!updatedPlayer) {
      throw new HttpError(500, 'INTERNAL_ERROR', 'Synchronized player was not returned');
    }

    return updatedPlayer;
  }

  const { data: createdPlayer, error: createError } = await client
    .from('players')
    .insert(payload)
    .select(playerFields)
    .maybeSingle<PlayerSyncRow>();

  if (createError) {
    throw mapSupabaseError(createError, 'Unable to create synchronized player');
  }

  if (!createdPlayer) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Synchronized player was not returned');
  }

  return createdPlayer;
};

const countVotesForMatch = async (client: SupabaseClient, matchId: string) => {
  const { count: ratingVotes, error: ratingError } = await client
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('match_id', matchId);

  if (ratingError) {
    throw mapSupabaseError(ratingError, 'Unable to count match votes');
  }

  const { count: manOfTheMatchVotes, error: motmError } = await client
    .from('man_of_the_match_votes')
    .select('id', { count: 'exact', head: true })
    .eq('match_id', matchId);

  if (motmError) {
    throw mapSupabaseError(motmError, 'Unable to count man of the match votes');
  }

  return (ratingVotes ?? 0) + (manOfTheMatchVotes ?? 0);
};

const replaceSyncedLineup = async (
  client: SupabaseClient,
  match: MatchSyncRow,
  lineup: SyncedLineupPlayer[],
  summary: FootballSyncSummary,
) => {
  if (lineup.length === 0 || match.sync_locked || match.manually_corrected) {
    return;
  }

  const voteCount = await countVotesForMatch(client, match.id);

  if (voteCount > 0 || match.voting_status === 'completed') {
    summary.differences.push({
      fixtureId: match.external_fixture_id ?? match.id,
      field: 'lineup',
      current: 'preserved',
      incoming: 'provider_lineup_available',
    });
    return;
  }

  const syncedAt = new Date().toISOString();
  const playerRows = await Promise.all(
    lineup.map((lineupPlayer) => ensurePlayer(client, lineupPlayer.player, syncedAt)),
  );

  const rows = lineup.map((lineupPlayer, index) => ({
    match_id: match.id,
    player_id: playerRows[index]?.id,
    participation_status: lineupPlayer.participationStatus,
    entered_minute: lineupPlayer.enteredMinute,
    exited_minute: lineupPlayer.exitedMinute,
    minutes_played: lineupPlayer.minutesPlayed,
    eligible_for_rating: lineupPlayer.eligibleForRating,
  }));

  const { error: deleteError } = await client
    .from('match_players')
    .delete()
    .eq('match_id', match.id);

  if (deleteError) {
    throw mapSupabaseError(deleteError, 'Unable to replace synchronized lineup');
  }

  const { error: insertError } = await client.from('match_players').insert(rows);

  if (insertError) {
    throw mapSupabaseError(insertError, 'Unable to insert synchronized lineup');
  }
};

const openVotingForFinishedFixture = async (
  client: SupabaseClient,
  match: MatchSyncRow,
  fixture: SyncedFixture,
  summary: FootballSyncSummary,
) => {
  if (
    fixture.status !== 'finished' ||
    fixture.manchesterUnitedScore === null ||
    fixture.opponentScore === null ||
    match.voting_status === 'completed'
  ) {
    return;
  }

  const { count, error: eligibleError } = await client
    .from('match_players')
    .select('id', { count: 'exact', head: true })
    .eq('match_id', match.id)
    .eq('eligible_for_rating', true)
    .in('participation_status', ['starter', 'substitute_entered']);

  if (eligibleError) {
    throw mapSupabaseError(eligibleError, 'Unable to count eligible lineup players');
  }

  if ((count ?? 0) === 0) {
    return;
  }

  const { data, error } = await client.rpc('sync_finish_match_and_open_voting', {
    p_match_id: match.id,
    p_manchester_united_score: fixture.manchesterUnitedScore,
    p_opponent_score: fixture.opponentScore,
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to open synchronized match voting');
  }

  const updatedMatch = Array.isArray(data)
    ? ((data[0] as MatchSyncRow | undefined) ?? null)
    : (data as MatchSyncRow | null);

  if (updatedMatch?.voting_status === 'open' && match.voting_status !== 'open') {
    summary.updated += 1;
  }
};

const createSyncRun = async (client: SupabaseClient, mode: FootballSyncMode) => {
  const { data, error } = await client
    .from('football_sync_runs')
    .insert({
      provider: providerName,
      mode,
      status: 'running',
    })
    .select('id')
    .maybeSingle<{ id: string }>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to create football sync run');
  }

  return data?.id ?? null;
};

const finishSyncRun = async (
  client: SupabaseClient,
  runId: string | null,
  mode: FootballSyncMode,
  summary: FootballSyncSummary,
  error?: unknown,
) => {
  if (!runId) {
    return;
  }

  const failed = Boolean(error);
  const fallbackMessage =
    error instanceof Error ? error.message : failed ? 'Football synchronization failed' : null;

  const { error: updateError } = await client
    .from('football_sync_runs')
    .update({
      mode,
      status: failed ? 'error' : 'success',
      finished_at: new Date().toISOString(),
      created_count: summary.created,
      updated_count: summary.updated,
      unchanged_count: summary.unchanged,
      error_count: summary.errors + (failed ? 1 : 0),
      message: fallbackMessage,
    })
    .eq('id', runId);

  if (updateError) {
    throw mapSupabaseError(updateError, 'Unable to update football sync run');
  }
};

const withSyncRun = async (
  mode: FootballSyncMode,
  operation: (client: SupabaseClient, provider: FootballProvider) => Promise<FootballSyncSummary>,
) => {
  const client = getServiceClient();
  const provider = getProvider();
  const runId = await createSyncRun(client, mode);
  const summary = createSummary();

  try {
    const result = await operation(client, provider);
    await finishSyncRun(client, runId, mode, result);
    return result;
  } catch (error) {
    summary.errors += 1;
    await finishSyncRun(client, runId, mode, summary, error);
    throw error;
  }
};

export const syncFixtureDetails = async (externalFixtureId: string) =>
  withSyncRun('fixture', async (client, provider) => {
    const summary = createSummary();
    const configuredSeason = getConfiguredSeason();
    const teamId = getConfiguredTeamId();
    const [season, fixture, lineups, events] = await Promise.all([
      ensureSeason(client, configuredSeason),
      provider.getFixtureById(externalFixtureId),
      provider.getFixtureLineups(externalFixtureId),
      provider.getFixtureEvents(externalFixtureId),
    ]);

    if (!isCompetitionEnabled(fixture.competition)) {
      summary.unchanged += 1;
      return summary;
    }

    const match = await persistFixtureSummary(client, fixture, season.id, summary);
    const syncedLineup = buildManchesterUnitedLineup(lineups, events, teamId);
    await replaceSyncedLineup(client, match, syncedLineup, summary);
    const refreshedMatch = await getMatchById(client, match.id);
    await openVotingForFinishedFixture(client, refreshedMatch, fixture, summary);

    return summary;
  });

export const syncManchesterUnitedFixtures = async () =>
  withSyncRun('fixtures', async (client, provider) => {
    const summary = createSummary();
    const season = getConfiguredSeason();
    const teamId = getConfiguredTeamId();
    const seasonRow = await ensureSeason(client, season);
    const fixtures = await provider.getTeamFixtures(teamId, season);

    for (const fixture of fixtures.filter((item) => isCompetitionEnabled(item.competition))) {
      try {
        const match = await persistFixtureSummary(client, fixture, seasonRow.id, summary);

        if (fixture.status === 'finished' && match.voting_status !== 'completed') {
          const detailSummary = await syncFixtureDetails(fixture.externalFixtureId);
          mergeSummary(summary, detailSummary);
        }
      } catch {
        summary.errors += 1;
      }
    }

    return summary;
  });

export const syncLiveFixtures = async () =>
  withSyncRun('live', async (client) => {
    const summary = createSummary();
    const from = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const { data, error } = await client
      .from('matches')
      .select('external_fixture_id')
      .not('external_fixture_id', 'is', null)
      .gte('match_date', from)
      .lte('match_date', to);

    if (error) {
      throw mapSupabaseError(error, 'Unable to fetch live synchronized matches');
    }

    const fixtureIds = Array.from(
      new Set(
        ((data ?? []) as Array<{ external_fixture_id: string | null }>)
          .map((row) => row.external_fixture_id)
          .filter((fixtureId): fixtureId is string => Boolean(fixtureId)),
      ),
    );

    for (const fixtureId of fixtureIds) {
      try {
        const detailSummary = await syncFixtureDetails(fixtureId);
        mergeSummary(summary, detailSummary);
      } catch {
        summary.errors += 1;
      }
    }

    return summary;
  });

export const testFootballConnection = async () =>
  withSyncRun('test', async (_client, provider) => {
    const summary = createSummary();
    await provider.getTeamById(getConfiguredTeamId());
    summary.unchanged = 1;
    return summary;
  });

export const getFootballIntegrationStatus = async (): Promise<FootballIntegrationStatus> => {
  const client = getServiceClient();
  const { data: runs, error } = await client
    .from('football_sync_runs')
    .select('started_at, finished_at, status, message')
    .eq('provider', providerName)
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch football integration status');
  }

  const syncRuns = (runs ?? []) as SyncRunRow[];
  const lastRun = syncRuns[0] ?? null;
  const lastSuccess = syncRuns.find((run) => run.status === 'success') ?? null;
  const lastError = syncRuns.find((run) => run.status === 'error') ?? null;

  return {
    provider: providerName,
    manchesterUnitedExternalId: env.MANCHESTER_UNITED_EXTERNAL_ID || null,
    currentSeason: env.FOOTBALL_CURRENT_SEASON || null,
    lastSynchronization: lastRun?.finished_at ?? lastRun?.started_at ?? null,
    lastSuccess: lastSuccess?.finished_at ?? null,
    lastError: lastError?.message ?? null,
  };
};
