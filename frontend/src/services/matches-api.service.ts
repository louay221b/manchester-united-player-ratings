import { apiRequest } from '../lib/api';
import type {
  FinishMatchPayload,
  FinishMatchResult,
  Match,
  MatchDetails,
  MatchFilters,
  MatchLineup,
  MatchPagination,
  MatchPayload,
  MatchResults,
  ReplaceLineupPayload,
} from '../types/match';

interface DataResponse<T> {
  success: true;
  data: T;
}

interface DeleteResponse {
  success: true;
  warnings?: string[];
}

interface MatchListResponse {
  success: true;
  data: Match[];
  pagination: MatchPagination;
}

const buildMatchesQuery = (filters: MatchFilters) => {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });

  if (filters.seasonId) {
    params.set('seasonId', filters.seasonId);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.votingStatus) {
    params.set('votingStatus', filters.votingStatus);
  }

  if (filters.competition?.trim()) {
    params.set('competition', filters.competition.trim());
  }

  return params.toString();
};

export const getMatches = async (filters: MatchFilters) => {
  const query = buildMatchesQuery(filters);
  const response = await apiRequest<MatchListResponse>(`/api/matches?${query}`);

  return {
    data: response.data,
    pagination: response.pagination,
  };
};

export const getMatch = async (matchId: string) => {
  const response = await apiRequest<DataResponse<MatchDetails>>(`/api/matches/${matchId}`);

  return response.data;
};

export const createMatch = async (payload: MatchPayload) => {
  const response = await apiRequest<DataResponse<Match>>('/api/matches', {
    method: 'POST',
    body: payload,
  });

  return response.data;
};

export const updateMatch = async (matchId: string, payload: Partial<MatchPayload>) => {
  const response = await apiRequest<DataResponse<Match>>(`/api/matches/${matchId}`, {
    method: 'PATCH',
    body: payload,
  });

  return response.data;
};

export const deleteMatch = async (matchId: string) =>
  apiRequest<DeleteResponse>(`/api/matches/${matchId}`, {
    method: 'DELETE',
  });

export const getMatchLineup = async (matchId: string) => {
  const response = await apiRequest<DataResponse<MatchLineup>>(`/api/matches/${matchId}/lineup`);

  return response.data;
};

export const replaceMatchLineup = async (matchId: string, payload: ReplaceLineupPayload) => {
  const response = await apiRequest<DataResponse<MatchLineup>>(`/api/matches/${matchId}/lineup`, {
    method: 'PUT',
    body: payload,
  });

  return response.data;
};

export const finishMatch = async (matchId: string, payload: FinishMatchPayload) => {
  const response = await apiRequest<DataResponse<FinishMatchResult>>(
    `/api/matches/${matchId}/finish`,
    {
      method: 'POST',
      body: payload,
    },
  );

  return response.data;
};

export const closeMatchVoting = async (matchId: string) => {
  const response = await apiRequest<DataResponse<Match>>(`/api/matches/${matchId}/close-voting`, {
    method: 'POST',
  });

  return response.data;
};

export const publishMatchResults = async (matchId: string) => {
  const response = await apiRequest<DataResponse<Match>>(
    `/api/matches/${matchId}/publish-results`,
    {
      method: 'POST',
    },
  );

  return response.data;
};

export const unpublishMatchResults = async (matchId: string) => {
  const response = await apiRequest<DataResponse<Match>>(
    `/api/matches/${matchId}/unpublish-results`,
    {
      method: 'POST',
    },
  );

  return response.data;
};

export const getMatchResults = async (matchId: string) => {
  const response = await apiRequest<DataResponse<MatchResults>>(`/api/matches/${matchId}/results`);

  return response.data;
};

export const getAdminMatchResults = async (matchId: string) => {
  const response = await apiRequest<DataResponse<MatchResults>>(
    `/api/admin/matches/${matchId}/results`,
  );

  return response.data;
};
