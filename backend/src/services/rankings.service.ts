import type { SupabaseClient } from '@supabase/supabase-js';

import { supabasePublicClient } from '../lib/supabase.js';
import type { AdminStatisticsQueryInput, RankingQueryInput } from '../schemas/rankings.schema.js';
import type { SeasonStatus } from '../schemas/seasons.schema.js';
import { HttpError } from '../utils/http-error.js';
import { mapSupabaseError } from '../utils/supabase-error.js';

interface SeasonSummaryDto {
  id: string;
  name: string;
  status: SeasonStatus;
}

export interface SeasonRankingRowDto {
  rank: number;
  playerId: string;
  firstName: string;
  lastName: string;
  shirtNumber: number | null;
  position: string;
  photoUrl: string | null;
  active: boolean;
  matchesPlayed: number;
  ratedMatches: number;
  totalVotes: number;
  seasonAverage: number | null;
  manOfTheMatchCount: number;
}

export interface SeasonRankingDto {
  season: SeasonSummaryDto | null;
  ranking: SeasonRankingRowDto[];
}

interface AdminStatisticsSummaryDto {
  seasonId: string;
  seasonName: string;
  seasonStatus: SeasonStatus;
  publishedOnly: boolean;
  totalMatches: number;
  finishedMatches: number;
  matchesWithCompletedVoting: number;
  publishedMatches: number;
  totalRatings: number;
  usersWhoVoted: number;
  playersRated: number;
}

export interface AdminSeasonStatisticsDto extends SeasonRankingDto {
  season: SeasonSummaryDto;
  summary: AdminStatisticsSummaryDto;
}

type RankingPayload = {
  season?: SeasonSummaryDto | null;
  ranking?: SeasonRankingRowDto[];
};

type AdminStatisticsPayload = RankingPayload & {
  summary?: AdminStatisticsSummaryDto;
};

const sanitizeSearch = (value: string) => value.trim().toLowerCase();

const normalizeText = (value: string) => value.toLowerCase();

const applyRankingFilters = <TRow extends SeasonRankingRowDto>(
  ranking: TRow[],
  filters: RankingQueryInput,
) => {
  const search = filters.search ? sanitizeSearch(filters.search) : '';

  return ranking.filter((row) => {
    const fullName = `${row.firstName} ${row.lastName}`;
    const matchesSearch = search ? normalizeText(fullName).includes(search) : true;
    const matchesPosition = filters.position ? row.position === filters.position : true;
    const matchesActive = filters.active === undefined ? true : row.active === filters.active;
    const matchesMinimum =
      filters.minMatches === undefined ? true : row.matchesPlayed >= filters.minMatches;

    return matchesSearch && matchesPosition && matchesActive && matchesMinimum;
  });
};

const readRankingPayload = (payload: unknown): SeasonRankingDto => {
  const data = payload as RankingPayload | null;

  if (!data) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Ranking data was not returned');
  }

  return {
    season: data.season ?? null,
    ranking: Array.isArray(data.ranking) ? data.ranking : [],
  };
};

const readAdminStatisticsPayload = (payload: unknown): AdminSeasonStatisticsDto => {
  const data = payload as AdminStatisticsPayload | null;

  if (!data?.season || !data.summary) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Statistics data was not returned');
  }

  return {
    season: data.season,
    summary: data.summary,
    ranking: Array.isArray(data.ranking) ? data.ranking : [],
  };
};

export const getPublicSeasonRankings = async (
  seasonId: string,
  filters: RankingQueryInput,
): Promise<SeasonRankingDto> => {
  const { data, error } = await supabasePublicClient.rpc('get_public_season_rankings', {
    p_season_id: seasonId,
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch season rankings');
  }

  const result = readRankingPayload(data);

  return {
    ...result,
    ranking: applyRankingFilters(result.ranking, filters),
  };
};

export const getActiveSeasonRankings = async (
  filters: RankingQueryInput,
): Promise<SeasonRankingDto> => {
  const { data: activeSeason, error } = await supabasePublicClient
    .from('seasons')
    .select('id, name, status')
    .eq('status', 'active')
    .maybeSingle<SeasonSummaryDto>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch active season');
  }

  if (!activeSeason) {
    return {
      season: null,
      ranking: [],
    };
  }

  return getPublicSeasonRankings(activeSeason.id, filters);
};

export const getAdminSeasonStatistics = async (
  client: SupabaseClient,
  seasonId: string,
  filters: AdminStatisticsQueryInput,
): Promise<AdminSeasonStatisticsDto> => {
  const { data, error } = await client.rpc('get_admin_season_statistics', {
    p_season_id: seasonId,
    p_published_only: filters.publishedOnly,
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch admin season statistics');
  }

  const result = readAdminStatisticsPayload(data);

  return {
    ...result,
    ranking: applyRankingFilters(result.ranking, filters),
  };
};
