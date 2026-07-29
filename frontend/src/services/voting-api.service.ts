import { apiRequest } from '../lib/api';
import type { Match, VotingMatchDetails } from '../types/match';

interface DataResponse<T> {
  success: true;
  data: T;
}

export const getVotingMatches = async () => {
  const response = await apiRequest<DataResponse<Match[]>>('/api/voting/matches');

  return response.data;
};

export const getVotingMatch = async (matchId: string) => {
  const response = await apiRequest<DataResponse<VotingMatchDetails>>(`/api/voting/matches/${matchId}`);

  return response.data;
};
