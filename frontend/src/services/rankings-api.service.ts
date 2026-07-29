import { apiRequest } from '../lib/api';
import type {
  AdminSeasonStatistics,
  AdminStatisticsFilters,
  RankingFilters,
  SeasonRanking,
} from '../types/ranking';

interface DataResponse<T> {
  success: true;
  data: T;
}

const appendRankingFilters = (params: URLSearchParams, filters: RankingFilters) => {
  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.position?.trim()) {
    params.set('position', filters.position.trim());
  }

  if (filters.active !== undefined) {
    params.set('active', String(filters.active));
  }

  if (filters.minMatches !== undefined) {
    params.set('minMatches', String(filters.minMatches));
  }
};

const buildRankingQuery = (filters: RankingFilters) => {
  const params = new URLSearchParams();
  appendRankingFilters(params, filters);

  return params.toString();
};

const buildAdminStatisticsQuery = (filters: AdminStatisticsFilters) => {
  const params = new URLSearchParams();
  appendRankingFilters(params, filters);
  params.set('publishedOnly', String(filters.publishedOnly));

  return params.toString();
};

export const getSeasonRanking = async (seasonId: string, filters: RankingFilters) => {
  const query = buildRankingQuery(filters);
  const response = await apiRequest<DataResponse<SeasonRanking>>(
    `/api/rankings/seasons/${seasonId}${query ? `?${query}` : ''}`,
  );

  return response.data;
};

export const getActiveSeasonRanking = async (filters: RankingFilters) => {
  const query = buildRankingQuery(filters);
  const response = await apiRequest<DataResponse<SeasonRanking>>(
    `/api/rankings/active${query ? `?${query}` : ''}`,
  );

  return response.data;
};

export const getAdminSeasonStatistics = async (
  seasonId: string,
  filters: AdminStatisticsFilters,
) => {
  const query = buildAdminStatisticsQuery(filters);
  const response = await apiRequest<DataResponse<AdminSeasonStatistics>>(
    `/api/admin/statistics/seasons/${seasonId}?${query}`,
  );

  return response.data;
};
