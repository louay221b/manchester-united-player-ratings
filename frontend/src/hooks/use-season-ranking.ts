import { useQuery } from '@tanstack/react-query';

import {
  getActiveSeasonRanking,
  getAdminSeasonStatistics,
  getSeasonRanking,
} from '../services/rankings-api.service';
import type { AdminStatisticsFilters, RankingFilters } from '../types/ranking';
import {
  activeSeasonRankingQueryKey,
  adminSeasonStatisticsQueryKey,
  seasonRankingQueryKey,
} from './query-keys';

export const useSeasonRanking = (
  seasonId: string,
  filters: RankingFilters,
  enabled = true,
) =>
  useQuery({
    queryKey: seasonRankingQueryKey(seasonId, filters),
    queryFn: () => getSeasonRanking(seasonId, filters),
    enabled: enabled && Boolean(seasonId),
  });

export const useActiveSeasonRanking = (filters: RankingFilters, enabled = true) =>
  useQuery({
    queryKey: activeSeasonRankingQueryKey(filters),
    queryFn: () => getActiveSeasonRanking(filters),
    enabled,
  });

export const useAdminSeasonStatistics = (
  seasonId: string,
  filters: AdminStatisticsFilters,
  enabled = true,
) =>
  useQuery({
    queryKey: adminSeasonStatisticsQueryKey(seasonId, filters),
    queryFn: () => getAdminSeasonStatistics(seasonId, filters),
    enabled: enabled && Boolean(seasonId),
  });
