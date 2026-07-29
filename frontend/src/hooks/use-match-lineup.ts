import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getMatchLineup,
  replaceMatchLineup as replaceMatchLineupRequest,
} from '../services/matches-api.service';
import type { ReplaceLineupPayload } from '../types/match';
import { matchLineupQueryKey, matchQueryKey, matchesQueryKey, votingMatchesQueryKey } from './query-keys';

export const useMatchLineup = (matchId: string) =>
  useQuery({
    queryKey: matchLineupQueryKey(matchId),
    queryFn: () => getMatchLineup(matchId),
    enabled: Boolean(matchId),
  });

export const useMatchLineupMutations = () => {
  const queryClient = useQueryClient();

  return {
    replaceMatchLineup: useMutation({
      mutationFn: ({ matchId, payload }: { matchId: string; payload: ReplaceLineupPayload }) =>
        replaceMatchLineupRequest(matchId, payload),
      onSuccess: (lineup) => {
        void queryClient.invalidateQueries({ queryKey: matchLineupQueryKey(lineup.match.id) });
        void queryClient.invalidateQueries({ queryKey: matchQueryKey(lineup.match.id) });
        void queryClient.invalidateQueries({ queryKey: matchesQueryKey });
        void queryClient.invalidateQueries({ queryKey: votingMatchesQueryKey });
      },
    }),
  };
};
