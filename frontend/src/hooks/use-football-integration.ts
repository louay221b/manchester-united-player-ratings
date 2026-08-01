import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getFootballIntegrationStatus,
  syncFootballFixtures,
  testFootballConnection,
} from '../services/football-api.service';
import {
  activeSeasonRankingBaseQueryKey,
  adminStatisticsQueryKey,
  footballIntegrationQueryKey,
  matchesQueryKey,
  votingMatchesQueryKey,
} from './query-keys';

export const useFootballIntegrationStatus = () =>
  useQuery({
    queryKey: footballIntegrationQueryKey,
    queryFn: getFootballIntegrationStatus,
  });

export const useFootballIntegrationMutations = () => {
  const queryClient = useQueryClient();

  const invalidateFootballData = () => {
    void queryClient.invalidateQueries({ queryKey: footballIntegrationQueryKey });
    void queryClient.invalidateQueries({ queryKey: matchesQueryKey });
    void queryClient.invalidateQueries({ queryKey: votingMatchesQueryKey });
    void queryClient.invalidateQueries({ queryKey: activeSeasonRankingBaseQueryKey });
    void queryClient.invalidateQueries({ queryKey: adminStatisticsQueryKey });
  };

  return {
    testConnection: useMutation({
      mutationFn: testFootballConnection,
      onSuccess: invalidateFootballData,
    }),
    syncFixtures: useMutation({
      mutationFn: syncFootballFixtures,
      onSuccess: invalidateFootballData,
    }),
  };
};
