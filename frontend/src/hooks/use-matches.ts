import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  closeMatchVoting as closeMatchVotingRequest,
  createMatch as createMatchRequest,
  deleteMatch as deleteMatchRequest,
  finishMatch as finishMatchRequest,
  getMatch,
  getMatches,
  publishMatchResults as publishMatchResultsRequest,
  unpublishMatchResults as unpublishMatchResultsRequest,
  updateMatch as updateMatchRequest,
} from '../services/matches-api.service';
import type { FinishMatchPayload, MatchFilters, MatchPayload } from '../types/match';
import { matchLineupQueryKey, matchQueryKey, matchesQueryKey, votingMatchesQueryKey } from './query-keys';

export const useMatches = (filters: MatchFilters) =>
  useQuery({
    queryKey: [...matchesQueryKey, filters],
    queryFn: () => getMatches(filters),
  });

export const useMatch = (matchId: string) =>
  useQuery({
    queryKey: matchQueryKey(matchId),
    queryFn: () => getMatch(matchId),
    enabled: Boolean(matchId),
  });

export const useMatchMutations = () => {
  const queryClient = useQueryClient();

  const invalidateMatchCollections = () => {
    void queryClient.invalidateQueries({ queryKey: matchesQueryKey });
    void queryClient.invalidateQueries({ queryKey: votingMatchesQueryKey });
  };

  const invalidateMatch = (matchId: string) => {
    void queryClient.invalidateQueries({ queryKey: matchQueryKey(matchId) });
    void queryClient.invalidateQueries({ queryKey: matchLineupQueryKey(matchId) });
  };

  return {
    createMatch: useMutation({
      mutationFn: createMatchRequest,
      onSuccess: invalidateMatchCollections,
    }),
    updateMatch: useMutation({
      mutationFn: ({ matchId, payload }: { matchId: string; payload: Partial<MatchPayload> }) =>
        updateMatchRequest(matchId, payload),
      onSuccess: (match) => {
        invalidateMatchCollections();
        invalidateMatch(match.id);
      },
    }),
    deleteMatch: useMutation({
      mutationFn: deleteMatchRequest,
      onSuccess: invalidateMatchCollections,
    }),
    finishMatch: useMutation({
      mutationFn: ({ matchId, payload }: { matchId: string; payload: FinishMatchPayload }) =>
        finishMatchRequest(matchId, payload),
      onSuccess: (result) => {
        invalidateMatchCollections();
        invalidateMatch(result.match.id);
      },
    }),
    closeMatchVoting: useMutation({
      mutationFn: closeMatchVotingRequest,
      onSuccess: (match) => {
        invalidateMatchCollections();
        invalidateMatch(match.id);
      },
    }),
    publishMatchResults: useMutation({
      mutationFn: publishMatchResultsRequest,
      onSuccess: (match) => {
        invalidateMatchCollections();
        invalidateMatch(match.id);
      },
    }),
    unpublishMatchResults: useMutation({
      mutationFn: unpublishMatchResultsRequest,
      onSuccess: (match) => {
        invalidateMatchCollections();
        invalidateMatch(match.id);
      },
    }),
  };
};
