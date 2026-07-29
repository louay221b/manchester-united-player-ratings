import { useQuery } from '@tanstack/react-query';

import { getAdminMatchResults, getMatchResults } from '../services/matches-api.service';
import { adminMatchResultsQueryKey, matchResultsQueryKey } from './query-keys';

export const useMatchResults = (matchId: string) =>
  useQuery({
    queryKey: matchResultsQueryKey(matchId),
    queryFn: () => getMatchResults(matchId),
    enabled: Boolean(matchId),
  });

export const useAdminMatchResults = (matchId: string) =>
  useQuery({
    queryKey: adminMatchResultsQueryKey(matchId),
    queryFn: () => getAdminMatchResults(matchId),
    enabled: Boolean(matchId),
  });
