import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getVotingBallot, submitVotingBallot } from '../services/voting-api.service';
import type { SubmitBallotPayload } from '../types/match';
import {
  matchQueryKey,
  votingBallotQueryKey,
  votingMatchQueryKey,
  votingMatchesQueryKey,
} from './query-keys';

export const useVotingBallot = (matchId: string) =>
  useQuery({
    queryKey: votingBallotQueryKey(matchId),
    queryFn: () => getVotingBallot(matchId),
    enabled: Boolean(matchId),
  });

export const useVotingBallotMutations = () => {
  const queryClient = useQueryClient();

  return {
    submitBallot: useMutation({
      mutationFn: ({ matchId, payload }: { matchId: string; payload: SubmitBallotPayload }) =>
        submitVotingBallot(matchId, payload),
      onSuccess: (_result, variables) => {
        void queryClient.invalidateQueries({ queryKey: votingBallotQueryKey(variables.matchId) });
        void queryClient.invalidateQueries({ queryKey: votingMatchQueryKey(variables.matchId) });
        void queryClient.invalidateQueries({ queryKey: matchQueryKey(variables.matchId) });
        void queryClient.invalidateQueries({ queryKey: votingMatchesQueryKey });
      },
    }),
  };
};
