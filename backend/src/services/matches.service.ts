import type { SupabaseClient } from '@supabase/supabase-js';

import { supabasePublicClient } from '../lib/supabase.js';
import type {
  CreateMatchInput,
  FinishMatchInput,
  MatchQueryInput,
  MatchStatus,
  ParticipationStatus,
  ReplaceLineupInput,
  UpdateMatchInput,
  VotingStatus,
} from '../schemas/matches.schema.js';
import type { SeasonStatus } from '../schemas/seasons.schema.js';
import { HttpError } from '../utils/http-error.js';
import { createNotFoundError, mapSupabaseError } from '../utils/supabase-error.js';

interface MatchRow {
  id: string;
  season_id: string;
  opponent_name: string;
  opponent_logo_url: string | null;
  opponent_logo_path: string | null;
  competition: string;
  match_date: string;
  venue: string | null;
  is_home: boolean;
  manchester_united_score: number | null;
  opponent_score: number | null;
  status: MatchStatus;
  voting_status: VotingStatus;
  results_published: boolean;
  created_at: string;
  updated_at: string;
}

interface SeasonRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: SeasonStatus;
  created_at: string;
  updated_at: string;
}

interface MatchPlayerRow {
  id: string;
  match_id: string;
  player_id: string;
  participation_status: ParticipationStatus;
  entered_minute: number | null;
  exited_minute: number | null;
  minutes_played: number;
  eligible_for_rating: boolean;
  created_at: string;
  updated_at: string;
}

interface PlayerRow {
  id: string;
  first_name: string;
  last_name: string;
  shirt_number: number | null;
  position: string;
  photo_url: string | null;
  active: boolean;
  joined_at: string | null;
  left_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchDto {
  id: string;
  seasonId: string;
  opponentName: string;
  opponentLogoUrl: string | null;
  opponentLogoPath: string | null;
  competition: string;
  matchDate: string;
  venue: string | null;
  isHome: boolean;
  manchesterUnitedScore: number | null;
  opponentScore: number | null;
  status: MatchStatus;
  votingStatus: VotingStatus;
  resultsPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SeasonDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LineupPlayerDto {
  id: string;
  matchId: string;
  playerId: string;
  participationStatus: ParticipationStatus;
  enteredMinute: number | null;
  exitedMinute: number | null;
  minutesPlayed: number;
  eligibleForRating: boolean;
  createdAt: string;
  updatedAt: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    shirtNumber: number | null;
    position: string;
    photoUrl: string | null;
    active: boolean;
  };
}

const matchFields =
  'id, season_id, opponent_name, opponent_logo_url, opponent_logo_path, competition, match_date, venue, is_home, manchester_united_score, opponent_score, status, voting_status, results_published, created_at, updated_at';
const seasonFields = 'id, name, start_date, end_date, status, created_at, updated_at';
const matchPlayerFields =
  'id, match_id, player_id, participation_status, entered_minute, exited_minute, minutes_played, eligible_for_rating, created_at, updated_at';
const playerFields =
  'id, first_name, last_name, shirt_number, position, photo_url, active, joined_at, left_at, created_at, updated_at';

const mapMatchRow = (match: MatchRow): MatchDto => ({
  id: match.id,
  seasonId: match.season_id,
  opponentName: match.opponent_name,
  opponentLogoUrl: match.opponent_logo_url,
  opponentLogoPath: match.opponent_logo_path,
  competition: match.competition,
  matchDate: match.match_date,
  venue: match.venue,
  isHome: match.is_home,
  manchesterUnitedScore: match.manchester_united_score,
  opponentScore: match.opponent_score,
  status: match.status,
  votingStatus: match.voting_status,
  resultsPublished: match.results_published,
  createdAt: match.created_at,
  updatedAt: match.updated_at,
});

const mapSeasonRow = (season: SeasonRow): SeasonDto => ({
  id: season.id,
  name: season.name,
  startDate: season.start_date,
  endDate: season.end_date,
  status: season.status,
  createdAt: season.created_at,
  updatedAt: season.updated_at,
});

const mapLineupPlayerRow = (matchPlayer: MatchPlayerRow, player: PlayerRow): LineupPlayerDto => ({
  id: matchPlayer.id,
  matchId: matchPlayer.match_id,
  playerId: matchPlayer.player_id,
  participationStatus: matchPlayer.participation_status,
  enteredMinute: matchPlayer.entered_minute,
  exitedMinute: matchPlayer.exited_minute,
  minutesPlayed: matchPlayer.minutes_played,
  eligibleForRating: matchPlayer.eligible_for_rating,
  createdAt: matchPlayer.created_at,
  updatedAt: matchPlayer.updated_at,
  player: {
    id: player.id,
    firstName: player.first_name,
    lastName: player.last_name,
    displayName: `${player.first_name} ${player.last_name}`,
    shirtNumber: player.shirt_number,
    position: player.position,
    photoUrl: player.photo_url,
    active: player.active,
  },
});

const mapCreateMatchInput = (input: CreateMatchInput) => ({
  season_id: input.seasonId,
  opponent_name: input.opponentName,
  opponent_logo_url: input.opponentLogoUrl,
  opponent_logo_path: input.opponentLogoPath,
  competition: input.competition,
  match_date: input.matchDate,
  venue: input.venue,
  is_home: input.isHome,
  manchester_united_score: null,
  opponent_score: null,
  status: 'scheduled' satisfies MatchStatus,
  voting_status: 'closed' satisfies VotingStatus,
  results_published: false,
});

const mapUpdateMatchInput = (input: UpdateMatchInput) => ({
  ...(input.seasonId === undefined ? {} : { season_id: input.seasonId }),
  ...(input.opponentName === undefined ? {} : { opponent_name: input.opponentName }),
  ...(input.opponentLogoUrl === undefined ? {} : { opponent_logo_url: input.opponentLogoUrl }),
  ...(input.opponentLogoPath === undefined ? {} : { opponent_logo_path: input.opponentLogoPath }),
  ...(input.competition === undefined ? {} : { competition: input.competition }),
  ...(input.matchDate === undefined ? {} : { match_date: input.matchDate }),
  ...(input.venue === undefined ? {} : { venue: input.venue }),
  ...(input.isHome === undefined ? {} : { is_home: input.isHome }),
});

const mapLineupInput = (input: ReplaceLineupInput) =>
  input.players.map((player) => ({
    player_id: player.playerId,
    participation_status: player.participationStatus,
    entered_minute: player.enteredMinute,
    exited_minute: player.exitedMinute,
    minutes_played: player.minutesPlayed,
    eligible_for_rating: player.eligibleForRating,
  }));

const getMatchRowById = async (client: SupabaseClient, matchId: string) => {
  const { data, error } = await client
    .from('matches')
    .select(matchFields)
    .eq('id', matchId)
    .maybeSingle<MatchRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch match');
  }

  if (!data) {
    throw createNotFoundError('Match');
  }

  return data;
};

const getSeasonRowById = async (client: SupabaseClient, seasonId: string) => {
  const { data, error } = await client
    .from('seasons')
    .select(seasonFields)
    .eq('id', seasonId)
    .maybeSingle<SeasonRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch season');
  }

  if (!data) {
    throw createNotFoundError('Season');
  }

  return data;
};

const getLineupRows = async (client: SupabaseClient, matchId: string) => {
  const { data: matchPlayers, error: matchPlayersError } = await client
    .from('match_players')
    .select(matchPlayerFields)
    .eq('match_id', matchId)
    .order('participation_status', { ascending: true })
    .order('minutes_played', { ascending: false });

  if (matchPlayersError) {
    throw mapSupabaseError(matchPlayersError, 'Unable to fetch lineup');
  }

  const rows = (matchPlayers ?? []) as MatchPlayerRow[];
  const playerIds = rows.map((row) => row.player_id);

  if (playerIds.length === 0) {
    return [];
  }

  const { data: players, error: playersError } = await client
    .from('players')
    .select(playerFields)
    .in('id', playerIds);

  if (playersError) {
    throw mapSupabaseError(playersError, 'Unable to fetch lineup players');
  }

  const playersById = new Map(
    (players ?? []).map((player) => [(player as PlayerRow).id, player as PlayerRow]),
  );

  return rows
    .map((row) => {
      const player = playersById.get(row.player_id);

      return player ? mapLineupPlayerRow(row, player) : null;
    })
    .filter((row): row is LineupPlayerDto => Boolean(row))
    .sort((first, second) => {
      const order: Record<ParticipationStatus, number> = {
        starter: 1,
        substitute_entered: 2,
        substitute_unused: 3,
      };

      return order[first.participationStatus] - order[second.participationStatus];
    });
};

const getEligibleLineupRows = async (client: SupabaseClient, matchId: string) => {
  const lineup = await getLineupRows(client, matchId);

  return lineup.filter(
    (row) =>
      row.eligibleForRating &&
      (row.participationStatus === 'starter' || row.participationStatus === 'substitute_entered'),
  );
};

const countVotesForMatch = async (client: SupabaseClient, matchId: string) => {
  const { count: ratingVotes, error: ratingVotesError } = await client
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('match_id', matchId);

  if (ratingVotesError) {
    throw mapSupabaseError(ratingVotesError, 'Unable to count rating votes');
  }

  const { count: motmVotes, error: motmVotesError } = await client
    .from('man_of_the_match_votes')
    .select('id', { count: 'exact', head: true })
    .eq('match_id', matchId);

  if (motmVotesError) {
    throw mapSupabaseError(motmVotesError, 'Unable to count man of the match votes');
  }

  return (ratingVotes ?? 0) + (motmVotes ?? 0);
};

const ensureScopedOpponentLogoPath = (
  matchId: string,
  opponentLogoPath: string | null | undefined,
) => {
  if (opponentLogoPath && !opponentLogoPath.startsWith(`${matchId}/`)) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'opponentLogoPath must belong to the target match',
    );
  }
};

const removeOpponentLogo = async (client: SupabaseClient, opponentLogoPath: string | null) => {
  if (!opponentLogoPath) {
    return null;
  }

  const { error } = await client.storage.from('opponent-logos').remove([opponentLogoPath]);

  return error ? 'OPPONENT_LOGO_CLEANUP_FAILED' : null;
};

export const listMatches = async (filters: MatchQueryInput) => {
  let query = supabasePublicClient.from('matches').select(matchFields, {
    count: 'exact',
  });

  if (filters.seasonId) {
    query = query.eq('season_id', filters.seasonId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.votingStatus) {
    query = query.eq('voting_status', filters.votingStatus);
  }

  if (filters.competition) {
    query = query.eq('competition', filters.competition);
  }

  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;
  const { data, error, count } = await query
    .order('match_date', { ascending: false })
    .range(from, to);

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch matches');
  }

  const total = count ?? 0;

  return {
    data: ((data ?? []) as MatchRow[]).map(mapMatchRow),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
};

export const getMatchDetails = async (
  matchId: string,
  client: SupabaseClient = supabasePublicClient,
) => {
  const match = await getMatchRowById(client, matchId);
  const [season, lineup] = await Promise.all([
    getSeasonRowById(client, match.season_id),
    getLineupRows(client, matchId),
  ]);

  return {
    ...mapMatchRow(match),
    season: mapSeasonRow(season),
    lineup,
  };
};

export const getMatchLineup = async (
  matchId: string,
  client: SupabaseClient = supabasePublicClient,
) => {
  const match = await getMatchRowById(client, matchId);
  const lineup = await getLineupRows(client, matchId);

  return {
    match: mapMatchRow(match),
    players: lineup,
  };
};

export const createMatch = async (client: SupabaseClient, input: CreateMatchInput) => {
  const { data, error } = await client
    .from('matches')
    .insert(mapCreateMatchInput(input))
    .select(matchFields)
    .maybeSingle<MatchRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to create match');
  }

  if (!data) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Match was not returned after creation');
  }

  return mapMatchRow(data);
};

export const updateMatch = async (
  client: SupabaseClient,
  matchId: string,
  input: UpdateMatchInput,
) => {
  const existingMatch = await getMatchRowById(client, matchId);

  if (existingMatch.status !== 'scheduled') {
    throw new HttpError(409, 'CONFLICT', 'Only scheduled matches can be edited');
  }

  ensureScopedOpponentLogoPath(matchId, input.opponentLogoPath);

  const { data, error } = await client
    .from('matches')
    .update(mapUpdateMatchInput(input))
    .eq('id', matchId)
    .select(matchFields)
    .maybeSingle<MatchRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to update match');
  }

  if (!data) {
    throw createNotFoundError('Match');
  }

  return mapMatchRow(data);
};

export const deleteMatch = async (client: SupabaseClient, matchId: string) => {
  const match = await getMatchRowById(client, matchId);

  if (match.status !== 'scheduled') {
    throw new HttpError(409, 'CONFLICT', 'Only scheduled matches can be deleted');
  }

  const voteCount = await countVotesForMatch(client, matchId);

  if (voteCount > 0) {
    throw new HttpError(
      409,
      'RESOURCE_IN_USE',
      'This match already has votes and cannot be deleted',
    );
  }

  const { error } = await client.from('matches').delete().eq('id', matchId);

  if (error) {
    throw mapSupabaseError(error, 'Unable to delete match');
  }

  const cleanupWarning = await removeOpponentLogo(client, match.opponent_logo_path);

  return {
    warnings: cleanupWarning ? [cleanupWarning] : [],
  };
};

export const replaceMatchLineup = async (
  client: SupabaseClient,
  matchId: string,
  input: ReplaceLineupInput,
) => {
  const { error } = await client.rpc('replace_match_lineup', {
    p_match_id: matchId,
    p_players: mapLineupInput(input),
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to replace match lineup');
  }

  return getMatchLineup(matchId, client);
};

export const finishMatchAndOpenVoting = async (
  client: SupabaseClient,
  matchId: string,
  input: FinishMatchInput,
) => {
  const { data, error } = await client.rpc('finish_match_and_open_voting', {
    p_match_id: matchId,
    p_manchester_united_score: input.manchesterUnitedScore,
    p_opponent_score: input.opponentScore,
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to finish match');
  }

  const row = Array.isArray(data) ? (data[0] as MatchRow | undefined) : (data as MatchRow | null);

  if (!row) {
    throw createNotFoundError('Match');
  }

  const eligiblePlayers = await getEligibleLineupRows(client, matchId);

  return {
    match: mapMatchRow(row),
    eligiblePlayers,
  };
};

export const closeMatchVoting = async (client: SupabaseClient, matchId: string) => {
  const { data, error } = await client.rpc('close_match_voting', {
    p_match_id: matchId,
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to close voting');
  }

  const row = Array.isArray(data) ? (data[0] as MatchRow | undefined) : (data as MatchRow | null);

  if (!row) {
    throw createNotFoundError('Match');
  }

  return mapMatchRow(row);
};

export const setMatchResultsPublication = async (
  client: SupabaseClient,
  matchId: string,
  published: boolean,
) => {
  const { data, error } = await client.rpc('set_match_results_publication', {
    p_match_id: matchId,
    p_published: published,
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to update results publication');
  }

  const row = Array.isArray(data) ? (data[0] as MatchRow | undefined) : (data as MatchRow | null);

  if (!row) {
    throw createNotFoundError('Match');
  }

  return mapMatchRow(row);
};

export const listOpenVotingMatches = async (client: SupabaseClient) => {
  const { data, error } = await client
    .from('matches')
    .select(matchFields)
    .eq('status', 'finished')
    .eq('voting_status', 'open')
    .order('match_date', { ascending: false });

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch voting matches');
  }

  return ((data ?? []) as MatchRow[]).map(mapMatchRow);
};

export const getOpenVotingMatchDetails = async (client: SupabaseClient, matchId: string) => {
  const match = await getMatchRowById(client, matchId);

  if (match.status !== 'finished' || match.voting_status !== 'open') {
    throw createNotFoundError('Voting match');
  }

  const eligiblePlayers = await getEligibleLineupRows(client, matchId);

  return {
    match: mapMatchRow(match),
    eligiblePlayers,
  };
};
