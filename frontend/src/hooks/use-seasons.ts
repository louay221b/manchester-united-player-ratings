import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activateSeason as activateSeasonRequest,
  createSeason as createSeasonRequest,
  deleteSeason as deleteSeasonRequest,
  getSeasons,
  updateSeason as updateSeasonRequest,
} from '../services/seasons-api.service';
import type { SeasonPayload } from '../types/season';

export const seasonsQueryKey = ['seasons'];

export const useSeasons = () =>
  useQuery({
    queryKey: seasonsQueryKey,
    queryFn: getSeasons,
  });

export const useSeasonMutations = () => {
  const queryClient = useQueryClient();
  const invalidateSeasons = () => queryClient.invalidateQueries({ queryKey: seasonsQueryKey });

  return {
    createSeason: useMutation({
      mutationFn: createSeasonRequest,
      onSuccess: invalidateSeasons,
    }),
    updateSeason: useMutation({
      mutationFn: ({ seasonId, payload }: { seasonId: string; payload: Partial<SeasonPayload> }) =>
        updateSeasonRequest(seasonId, payload),
      onSuccess: invalidateSeasons,
    }),
    deleteSeason: useMutation({
      mutationFn: deleteSeasonRequest,
      onSuccess: invalidateSeasons,
    }),
    activateSeason: useMutation({
      mutationFn: activateSeasonRequest,
      onSuccess: invalidateSeasons,
    }),
  };
};
