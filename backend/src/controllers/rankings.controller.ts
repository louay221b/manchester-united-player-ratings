import type { RequestHandler } from 'express';

import {
  getActiveSeasonRankings,
  getAdminSeasonStatistics,
  getPublicSeasonRankings,
} from '../services/rankings.service.js';
import { adminStatisticsQuerySchema, rankingQuerySchema } from '../schemas/rankings.schema.js';
import { HttpError } from '../utils/http-error.js';
import { parseUuidParam } from '../utils/supabase-error.js';

const getAuthenticatedClient = (request: Parameters<RequestHandler>[0]) => {
  if (!request.auth) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
  }

  return request.auth.supabase;
};

export const getSeasonRankings: RequestHandler = async (request, response, next) => {
  try {
    const seasonId = parseUuidParam(request.params.seasonId, 'season');
    const filters = rankingQuerySchema.parse(request.query);
    const rankings = await getPublicSeasonRankings(seasonId, filters);

    response.json({
      success: true,
      data: rankings,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveRankings: RequestHandler = async (request, response, next) => {
  try {
    const filters = rankingQuerySchema.parse(request.query);
    const rankings = await getActiveSeasonRankings(filters);

    response.json({
      success: true,
      data: rankings,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminStatistics: RequestHandler = async (request, response, next) => {
  try {
    const seasonId = parseUuidParam(request.params.seasonId, 'season');
    const filters = adminStatisticsQuerySchema.parse(request.query);
    const statistics = await getAdminSeasonStatistics(
      getAuthenticatedClient(request),
      seasonId,
      filters,
    );

    response.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};
