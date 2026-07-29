import { useQuery } from '@tanstack/react-query';

import { getVotingMatch, getVotingMatches } from '../services/voting-api.service';
import { votingMatchesQueryKey, votingMatchQueryKey } from './query-keys';

export const useVotingMatches = (enabled = true) =>
  useQuery({
    queryKey: votingMatchesQueryKey,
    queryFn: getVotingMatches,
    enabled,
    refetchInterval: enabled ? 15000 : false,
  });

export const useVotingMatch = (matchId: string) =>
  useQuery({
    queryKey: votingMatchQueryKey(matchId),
    queryFn: () => getVotingMatch(matchId),
    enabled: Boolean(matchId),
  });
