import type { SupabaseClient } from '@supabase/supabase-js';

import type { MatchStatus, ParticipationStatus, VotingStatus } from '../schemas/matches.schema.js';
import type { SubmitBallotInput } from '../schemas/voting.schema.js';
import { HttpError } from '../utils/http-error.js';
import { createNotFoundError, mapSupabaseError } from '../utils/supabase-error.js';

interface MatchRow {
  id: string;
  opponent_name: string;
  opponent_logo_url: string | null;
  competition: string;
  match_date: string;
  manchester_united_score: number | null;
  opponent_score: number | null;
  status: MatchStatus;
  voting_status: VotingStatus;
  results_published: boolean;
}

interface MatchPlayerRow {
  id: string;
  match_id: string;
  player_id: string;
  participation_status: ParticipationStatus;
  minutes_played: number;
  eligible_for_rating: boolean;
}

interface PlayerRow {
  id: string;
  first_name: string;
  last_name: string;
  shirt_number: number | null;
  position: string;
  photo_url: string | null;
}

interface VoteRow {
  player_id: string;
  rating: number;
}

interface ManOfTheMatchVoteRow {
  player_id: string;
}

export interface BallotDto {
  match: {
    id: string;
    opponentName: string;
    opponentLogoUrl: string | null;
    competition: string;
    matchDate: string;
    manchesterUnitedScore: number | null;
    opponentScore: number | null;
    votingStatus: VotingStatus;
  };
  players: Array<{
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    position: string;
    shirtNumber: number | null;
    photoUrl: string | null;
    participationStatus: ParticipationStatus;
    minutesPlayed: number;
  }>;
  existingBallot: {
    ratings: Array<{
      playerId: string;
      rating: number;
    }>;
    manOfTheMatchPlayerId: string | null;
  } | null;
}

export interface MatchResultsDto {
  match: {
    id: string;
    opponentName: string;
    opponentLogoUrl: string | null;
    competition: string;
    matchDate: string;
    manchesterUnitedScore: number | null;
    opponentScore: number | null;
    votingStatus: VotingStatus;
    resultsPublished: boolean;
  };
  summary: {
    eligiblePlayers: number;
    usersWhoVoted: number;
    ratingsCount: number;
  };
  ranking: Array<{
    playerId: string;
    firstName: string;
    lastName: string;
    displayName: string;
    photoUrl: string | null;
    position: string;
    shirtNumber: number | null;
    votesCount: number;
    averageRating: number | null;
    manOfTheMatchVotes: number;
    rank: number;
  }>;
  manOfTheMatch: Array<{
    playerId: string;
    firstName: string;
    lastName: string;
    displayName: string;
    photoUrl: string | null;
    position: string;
    shirtNumber: number | null;
    selections: number;
  }>;
}

const matchBallotFields =
  'id, opponent_name, opponent_logo_url, competition, match_date, manchester_united_score, opponent_score, status, voting_status, results_published';
const matchPlayerFields =
  'id, match_id, player_id, participation_status, minutes_played, eligible_for_rating';
const playerFields = 'id, first_name, last_name, shirt_number, position, photo_url';

const mapBallotMatch = (match: MatchRow): BallotDto['match'] => ({
  id: match.id,
  opponentName: match.opponent_name,
  opponentLogoUrl: match.opponent_logo_url,
  competition: match.competition,
  matchDate: match.match_date,
  manchesterUnitedScore: match.manchester_united_score,
  opponentScore: match.opponent_score,
  votingStatus: match.voting_status,
});

const getBallotMatch = async (client: SupabaseClient, matchId: string) => {
  const { data, error } = await client
    .from('matches')
    .select(matchBallotFields)
    .eq('id', matchId)
    .maybeSingle<MatchRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch voting match');
  }

  if (!data) {
    throw createNotFoundError('Match');
  }

  if (data.status !== 'finished') {
    throw createNotFoundError('Voting match');
  }

  return data;
};

const getEligiblePlayers = async (client: SupabaseClient, matchId: string) => {
  const { data: matchPlayers, error: matchPlayersError } = await client
    .from('match_players')
    .select(matchPlayerFields)
    .eq('match_id', matchId)
    .eq('eligible_for_rating', true)
    .in('participation_status', ['starter', 'substitute_entered'])
    .order('participation_status', { ascending: true })
    .order('minutes_played', { ascending: false });

  if (matchPlayersError) {
    throw mapSupabaseError(matchPlayersError, 'Unable to fetch voting players');
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
    throw mapSupabaseError(playersError, 'Unable to fetch player details');
  }

  const playersById = new Map(
    (players ?? []).map((player) => [(player as PlayerRow).id, player as PlayerRow]),
  );

  return rows
    .map((row) => {
      const player = playersById.get(row.player_id);

      if (!player) {
        return null;
      }

      return {
        id: player.id,
        firstName: player.first_name,
        lastName: player.last_name,
        displayName: `${player.first_name} ${player.last_name}`,
        position: player.position,
        shirtNumber: player.shirt_number,
        photoUrl: player.photo_url,
        participationStatus: row.participation_status,
        minutesPlayed: row.minutes_played,
      };
    })
    .filter((player): player is BallotDto['players'][number] => Boolean(player));
};

const getExistingBallot = async (client: SupabaseClient, matchId: string) => {
  const { data: ratingRows, error: ratingsError } = await client
    .from('votes')
    .select('player_id, rating')
    .eq('match_id', matchId);

  if (ratingsError) {
    throw mapSupabaseError(ratingsError, 'Unable to fetch existing ratings');
  }

  const { data: manOfTheMatchRow, error: manOfTheMatchError } = await client
    .from('man_of_the_match_votes')
    .select('player_id')
    .eq('match_id', matchId)
    .maybeSingle<ManOfTheMatchVoteRow>();

  if (manOfTheMatchError) {
    throw mapSupabaseError(manOfTheMatchError, 'Unable to fetch man of the match vote');
  }

  const ratings = ((ratingRows ?? []) as VoteRow[]).map((rating) => ({
    playerId: rating.player_id,
    rating: Number(rating.rating),
  }));

  if (ratings.length === 0 && !manOfTheMatchRow) {
    return null;
  }

  return {
    ratings,
    manOfTheMatchPlayerId: manOfTheMatchRow?.player_id ?? null,
  };
};

export const getVotingBallot = async (
  client: SupabaseClient,
  matchId: string,
): Promise<BallotDto> => {
  const match = await getBallotMatch(client, matchId);
  const [players, existingBallot] = await Promise.all([
    getEligiblePlayers(client, matchId),
    getExistingBallot(client, matchId),
  ]);

  return {
    match: mapBallotMatch(match),
    players,
    existingBallot,
  };
};

export const submitVotingBallot = async (
  client: SupabaseClient,
  matchId: string,
  input: SubmitBallotInput,
) => {
  const { error } = await client.rpc('submit_match_ballot', {
    p_match_id: matchId,
    p_ratings: input.ratings,
    p_man_of_the_match_player_id: input.manOfTheMatchPlayerId,
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to submit ballot');
  }
};

export const getMatchResults = async (
  client: SupabaseClient,
  matchId: string,
): Promise<MatchResultsDto> => {
  const { data, error } = await client.rpc('get_match_results', {
    p_match_id: matchId,
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch match results');
  }

  if (!data) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Match results were not returned');
  }

  return data as MatchResultsDto;
};
