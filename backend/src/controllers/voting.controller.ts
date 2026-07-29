import type { RequestHandler } from 'express';

import { getOpenVotingMatchDetails, listOpenVotingMatches } from '../services/matches.service.js';
import { getVotingBallot, submitVotingBallot } from '../services/voting.service.js';
import { submitBallotSchema } from '../schemas/voting.schema.js';
import { HttpError } from '../utils/http-error.js';
import { parseUuidParam } from '../utils/supabase-error.js';

const getAuthenticatedClient = (request: Parameters<RequestHandler>[0]) => {
  if (!request.auth) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
  }

  return request.auth.supabase;
};

export const getVotingMatches: RequestHandler = async (request, response, next) => {
  try {
    const matches = await listOpenVotingMatches(getAuthenticatedClient(request));

    response.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
};

export const getVotingMatch: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const match = await getOpenVotingMatchDetails(getAuthenticatedClient(request), matchId);

    response.json({
      success: true,
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

export const getVotingMatchBallot: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const ballot = await getVotingBallot(getAuthenticatedClient(request), matchId);

    response.json({
      success: true,
      data: ballot,
    });
  } catch (error) {
    next(error);
  }
};

export const putVotingMatchBallot: RequestHandler = async (request, response, next) => {
  try {
    const matchId = parseUuidParam(request.params.matchId, 'match');
    const body = submitBallotSchema.parse(request.body);

    await submitVotingBallot(getAuthenticatedClient(request), matchId, body);

    response.json({
      success: true,
      message: 'Vote enregistre avec succes',
    });
  } catch (error) {
    next(error);
  }
};
