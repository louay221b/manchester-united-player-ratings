import { apiRequest } from '../lib/api';
import type { Season, SeasonPayload } from '../types/season';

interface DataResponse<T> {
  success: true;
  data: T;
}

export const getSeasons = async () => {
  const response = await apiRequest<DataResponse<Season[]>>('/api/seasons');

  return response.data;
};

export const getSeason = async (seasonId: string) => {
  const response = await apiRequest<DataResponse<Season>>(`/api/seasons/${seasonId}`);

  return response.data;
};

export const createSeason = async (payload: SeasonPayload) => {
  const response = await apiRequest<DataResponse<Season>>('/api/seasons', {
    method: 'POST',
    body: payload,
  });

  return response.data;
};

export const updateSeason = async (seasonId: string, payload: Partial<SeasonPayload>) => {
  const response = await apiRequest<DataResponse<Season>>(`/api/seasons/${seasonId}`, {
    method: 'PATCH',
    body: payload,
  });

  return response.data;
};

export const deleteSeason = async (seasonId: string) =>
  apiRequest<{ success: true }>(`/api/seasons/${seasonId}`, {
    method: 'DELETE',
  });

export const activateSeason = async (seasonId: string) => {
  const response = await apiRequest<DataResponse<Season>>(`/api/seasons/${seasonId}/activate`, {
    method: 'POST',
  });

  return response.data;
};
