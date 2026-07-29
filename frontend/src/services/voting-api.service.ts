import { apiRequest } from '../lib/api';
import type { Match, SubmitBallotPayload, VotingBallot, VotingMatchDetails } from '../types/match';

interface DataResponse<T> {
  success: true;
  data: T;
}

export const getVotingMatches = async () => {
  const response = await apiRequest<DataResponse<Match[]>>('/api/voting/matches');

  return response.data;
};

export const getVotingMatch = async (matchId: string) => {
  const response = await apiRequest<DataResponse<VotingMatchDetails>>(
    `/api/voting/matches/${matchId}`,
  );

  return response.data;
};

export const getVotingBallot = async (matchId: string) => {
  const response = await apiRequest<DataResponse<VotingBallot>>(
    `/api/voting/matches/${matchId}/ballot`,
  );

  return response.data;
};

export const submitVotingBallot = async (matchId: string, payload: SubmitBallotPayload) =>
  apiRequest<{ success: true; message: string }>(`/api/voting/matches/${matchId}/ballot`, {
    method: 'PUT',
    body: payload,
  });
