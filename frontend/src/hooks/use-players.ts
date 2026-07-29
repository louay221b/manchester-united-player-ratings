import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPlayer as createPlayerRequest,
  deletePlayer as deletePlayerRequest,
  getPlayer,
  getPlayers,
  updatePlayer as updatePlayerRequest,
  updatePlayerStatus as updatePlayerStatusRequest,
} from '../services/players-api.service';
import type { PlayerFilters, PlayerPayload } from '../types/player';

export const playersQueryKey = ['players'];
export const playerQueryKey = (playerId: string) => ['player', playerId];

export const usePlayers = (filters: PlayerFilters) =>
  useQuery({
    queryKey: [...playersQueryKey, filters],
    queryFn: () => getPlayers(filters),
  });

export const usePlayer = (playerId: string) =>
  useQuery({
    queryKey: playerQueryKey(playerId),
    queryFn: () => getPlayer(playerId),
    enabled: Boolean(playerId),
  });

export const usePlayerMutations = () => {
  const queryClient = useQueryClient();
  const invalidatePlayers = () => queryClient.invalidateQueries({ queryKey: playersQueryKey });
  const invalidatePlayer = (playerId: string) =>
    queryClient.invalidateQueries({ queryKey: playerQueryKey(playerId) });

  return {
    createPlayer: useMutation({
      mutationFn: createPlayerRequest,
      onSuccess: () => {
        void invalidatePlayers();
      },
    }),
    updatePlayer: useMutation({
      mutationFn: ({ playerId, payload }: { playerId: string; payload: Partial<PlayerPayload> }) =>
        updatePlayerRequest(playerId, payload),
      onSuccess: (player) => {
        void invalidatePlayers();
        void invalidatePlayer(player.id);
      },
    }),
    updatePlayerStatus: useMutation({
      mutationFn: ({ playerId, active }: { playerId: string; active: boolean }) =>
        updatePlayerStatusRequest(playerId, active),
      onSuccess: (player) => {
        void invalidatePlayers();
        void invalidatePlayer(player.id);
      },
    }),
    deletePlayer: useMutation({
      mutationFn: deletePlayerRequest,
      onSuccess: () => {
        void invalidatePlayers();
      },
    }),
  };
};
