import type { RequestHandler } from 'express';

import {
  createPlayer,
  deletePlayer,
  getPlayerById,
  listPlayers,
  updatePlayer,
  updatePlayerStatus,
} from '../services/players.service.js';
import {
  createPlayerSchema,
  playerQuerySchema,
  playerStatusSchema,
  updatePlayerSchema,
} from '../schemas/players.schema.js';
import { HttpError } from '../utils/http-error.js';
import { parseUuidParam } from '../utils/supabase-error.js';

const getAuthenticatedClient = (request: Parameters<RequestHandler>[0]) => {
  if (!request.auth) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
  }

  return request.auth.supabase;
};

export const getPlayers: RequestHandler = async (request, response, next) => {
  try {
    const filters = playerQuerySchema.parse(request.query);
    const result = await listPlayers(filters);

    response.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlayer: RequestHandler = async (request, response, next) => {
  try {
    const playerId = parseUuidParam(request.params.playerId, 'player');
    const player = await getPlayerById(playerId);

    response.json({
      success: true,
      data: player,
    });
  } catch (error) {
    next(error);
  }
};

export const postPlayer: RequestHandler = async (request, response, next) => {
  try {
    const body = createPlayerSchema.parse(request.body);
    const player = await createPlayer(getAuthenticatedClient(request), body);

    response.status(201).json({
      success: true,
      data: player,
    });
  } catch (error) {
    next(error);
  }
};

export const patchPlayer: RequestHandler = async (request, response, next) => {
  try {
    const playerId = parseUuidParam(request.params.playerId, 'player');
    const body = updatePlayerSchema.parse(request.body);
    const player = await updatePlayer(getAuthenticatedClient(request), playerId, body);

    response.json({
      success: true,
      data: player,
    });
  } catch (error) {
    next(error);
  }
};

export const patchPlayerStatus: RequestHandler = async (request, response, next) => {
  try {
    const playerId = parseUuidParam(request.params.playerId, 'player');
    const body = playerStatusSchema.parse(request.body);
    const player = await updatePlayerStatus(getAuthenticatedClient(request), playerId, body);

    response.json({
      success: true,
      data: player,
    });
  } catch (error) {
    next(error);
  }
};

export const removePlayer: RequestHandler = async (request, response, next) => {
  try {
    const playerId = parseUuidParam(request.params.playerId, 'player');

    const result = await deletePlayer(getAuthenticatedClient(request), playerId);

    response.json({
      success: true,
      ...(result.warnings.length > 0 ? { warnings: result.warnings } : {}),
    });
  } catch (error) {
    next(error);
  }
};
