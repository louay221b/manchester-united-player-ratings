import type { RequestHandler } from 'express';

import {
  closeMatchVoting,
  createMatch,
  deleteMatch,
  finishMatchAndOpenVoting,
  getMatchDetails,
  getMatchLineup,
  listMatches,
  replaceMatchLineup,
  setMatchResultsPublication,
  updateMatch,
} from '../services/matches.service.js';
import { getMatchResults as getAggregatedMatchResults } from '../services/voting.service.js';
import {
  createMatchSchema,
  finishMatchSchema,
  matchQuerySchema,
  replaceLineupSchema,
  updateMatchSchema,
} from '../schemas/matches.schema.js';
import { HttpError } from '../utils/http-error.js';
import { parseUuidParam } from '../utils/supabase-error.js';

const getAuthenticatedClient = (request: Parameters<RequestHandler>[0]) => {
  if (!request.auth) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
  }

  return request.auth.supabase;
};

export const getMatches: RequestHandler = async (request, response, next) => {
  try {
    const filters = matchQuerySchema.parse(request.query);

    if (filters.seasonId) {
      parseUuidParam(filters.seasonId, 'season');
    }

    const result = await listMatches(filters);

    response.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getMatch: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const match = await getMatchDetails(matchId);

    response.json({
      success: true,
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublishedMatchResults: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const results = await getAggregatedMatchResults(getAuthenticatedClient(request), matchId);

    response.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminMatchResults: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const results = await getAggregatedMatchResults(getAuthenticatedClient(request), matchId);

    response.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const postMatch: RequestHandler = async (request, response, next) => {
  try {
    const body = createMatchSchema.parse(request.body);
    const match = await createMatch(getAuthenticatedClient(request), body);

    response.status(201).json({
      success: true,
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

export const patchMatch: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const body = updateMatchSchema.parse(request.body);
    const match = await updateMatch(getAuthenticatedClient(request), matchId, body);

    response.json({
      success: true,
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMatch: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');

    const result = await deleteMatch(getAuthenticatedClient(request), matchId);

    response.json({
      success: true,
      ...(result.warnings.length > 0 ? { warnings: result.warnings } : {}),
    });
  } catch (error) {
    next(error);
  }
};

export const getLineup: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const lineup = await getMatchLineup(matchId);

    response.json({
      success: true,
      data: lineup,
    });
  } catch (error) {
    next(error);
  }
};

export const putLineup: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const body = replaceLineupSchema.parse(request.body);
    const lineup = await replaceMatchLineup(getAuthenticatedClient(request), matchId, body);

    response.json({
      success: true,
      data: lineup,
    });
  } catch (error) {
    next(error);
  }
};

export const postFinishMatch: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const body = finishMatchSchema.parse(request.body);
    const result = await finishMatchAndOpenVoting(getAuthenticatedClient(request), matchId, body);

    response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const postCloseVoting: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const match = await closeMatchVoting(getAuthenticatedClient(request), matchId);

    response.json({
      success: true,
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

export const postPublishResults: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const match = await setMatchResultsPublication(getAuthenticatedClient(request), matchId, true);

    response.json({
      success: true,
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

export const postUnpublishResults: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const match = await setMatchResultsPublication(getAuthenticatedClient(request), matchId, false);

    response.json({
      success: true,
      data: match,
    });
  } catch (error) {
    next(error);
  }
};
