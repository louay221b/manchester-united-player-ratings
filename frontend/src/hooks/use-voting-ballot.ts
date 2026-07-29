import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getVotingBallot, submitVotingBallot } from '../services/voting-api.service';
import type { MatchDetails, SubmitBallotPayload, VotingMatchDetails } from '../types/match';
import {
  adminSeasonStatisticsBaseQueryKey,
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

        const votingMatch = queryClient.getQueryData<VotingMatchDetails>(
          votingMatchQueryKey(variables.matchId),
        );
        const matchDetails = queryClient.getQueryData<MatchDetails>(matchQueryKey(variables.matchId));
        const seasonId = votingMatch?.match.seasonId ?? matchDetails?.seasonId;

        if (seasonId) {
          void queryClient.invalidateQueries({
            queryKey: adminSeasonStatisticsBaseQueryKey(seasonId),
          });
        }
      },
    }),
  };
};
