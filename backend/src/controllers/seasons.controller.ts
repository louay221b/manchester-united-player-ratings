import type { RequestHandler } from 'express';

import {
  activateSeason,
  createSeason,
  deleteSeason,
  getSeasonById,
  listSeasons,
  updateSeason,
} from '../services/seasons.service.js';
import { createSeasonSchema, updateSeasonSchema } from '../schemas/seasons.schema.js';
import { HttpError } from '../utils/http-error.js';
import { parseUuidParam } from '../utils/supabase-error.js';

const getAuthenticatedClient = (request: Parameters<RequestHandler>[0]) => {
  if (!request.auth) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
  }

  return request.auth.supabase;
};

export const getSeasons: RequestHandler = async (_request, response, next) => {
  try {
    const seasons = await listSeasons();

    response.json({
      success: true,
      data: seasons,
    });
  } catch (error) {
    next(error);
  }
};

export const getSeason: RequestHandler = async (request, response, next) => {
  try {
    const seasonId = parseUuidParam(request.params.seasonId, 'season');
    const season = await getSeasonById(seasonId);

    response.json({
      success: true,
      data: season,
    });
  } catch (error) {
    next(error);
  }
};

export const postSeason: RequestHandler = async (request, response, next) => {
  try {
    const body = createSeasonSchema.parse(request.body);
    const season = await createSeason(getAuthenticatedClient(request), body);

    response.status(201).json({
      success: true,
      data: season,
    });
  } catch (error) {
    next(error);
  }
};

export const patchSeason: RequestHandler = async (request, response, next) => {
  try {
    const seasonId = parseUuidParam(request.params.seasonId, 'season');
    const body = updateSeasonSchema.parse(request.body);
    const season = await updateSeason(getAuthenticatedClient(request), seasonId, body);

    response.json({
      success: true,
      data: season,
    });
  } catch (error) {
    next(error);
  }
};

export const removeSeason: RequestHandler = async (request, response, next) => {
  try {
    const seasonId = parseUuidParam(request.params.seasonId, 'season');

    await deleteSeason(getAuthenticatedClient(request), seasonId);

    response.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const postActivateSeason: RequestHandler = async (request, response, next) => {
  try {
    const seasonId = parseUuidParam(request.params.seasonId, 'season');
    const season = await activateSeason(getAuthenticatedClient(request), seasonId);

    response.json({
      success: true,
      data: season,
    });
  } catch (error) {
    next(error);
  }
};
