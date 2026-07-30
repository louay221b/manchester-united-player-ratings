import { apiRequest } from '../lib/api';
import type { Player, PlayerFilters, PlayerPagination, PlayerPayload } from '../types/player';

interface DataResponse<T> {
  success: true;
  data: T;
}

interface DeleteResponse {
  success: true;
  warnings?: string[];
}

interface PlayerListResponse {
  success: true;
  data: Player[];
  pagination: PlayerPagination;
}

const buildPlayersQuery = (filters: PlayerFilters) => {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.position?.trim()) {
    params.set('position', filters.position.trim());
  }

  if (filters.active !== undefined) {
    params.set('active', String(filters.active));
  }

  return params.toString();
};

export const getPlayers = async (filters: PlayerFilters) => {
  const query = buildPlayersQuery(filters);
  const response = await apiRequest<PlayerListResponse>(`/api/players?${query}`);

  return {
    data: response.data,
    pagination: response.pagination,
  };
};

export const getPlayer = async (playerId: string) => {
  const response = await apiRequest<DataResponse<Player>>(`/api/players/${playerId}`);

  return response.data;
};

export const createPlayer = async (payload: PlayerPayload) => {
  const response = await apiRequest<DataResponse<Player>>('/api/players', {
    method: 'POST',
    body: payload,
  });

  return response.data;
};

export const updatePlayer = async (playerId: string, payload: Partial<PlayerPayload>) => {
  const response = await apiRequest<DataResponse<Player>>(`/api/players/${playerId}`, {
    method: 'PATCH',
    body: payload,
  });

  return response.data;
};

export const updatePlayerStatus = async (playerId: string, active: boolean) => {
  const response = await apiRequest<DataResponse<Player>>(`/api/players/${playerId}/status`, {
    method: 'PATCH',
    body: { active },
  });

  return response.data;
};

export const deletePlayer = async (playerId: string) =>
  apiRequest<DeleteResponse>(`/api/players/${playerId}`, {
    method: 'DELETE',
  });
