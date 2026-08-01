import { apiRequest } from '../lib/api';
import type { FootballIntegrationStatus, FootballSyncSummary } from '../types/football';

interface DataResponse<T> {
  success: true;
  data: T;
}

export const getFootballIntegrationStatus = async () => {
  const response = await apiRequest<DataResponse<FootballIntegrationStatus>>(
    '/api/admin/football/integration',
  );

  return response.data;
};

export const testFootballConnection = async () => {
  const response = await apiRequest<DataResponse<FootballSyncSummary>>(
    '/api/admin/football/test-connection',
    {
      method: 'POST',
    },
  );

  return response.data;
};

export const syncFootballFixtures = async () => {
  const response = await apiRequest<DataResponse<FootballSyncSummary>>(
    '/api/admin/football/sync/fixtures',
    {
      method: 'POST',
    },
  );

  return response.data;
};
