import type { RequestHandler } from 'express';

import { cronFootballSyncSchema } from '../schemas/football.schema.js';
import {
  getFootballIntegrationStatus,
  syncFixtureDetails,
  syncLiveFixtures,
  syncManchesterUnitedFixtures,
  testFootballConnection,
} from '../integrations/football/football-sync.service.js';
import { logFootballSyncFailure } from '../integrations/football/football-sync.logger.js';

export const getFootballStatus: RequestHandler = async (_request, response, next) => {
  try {
    const status = await getFootballIntegrationStatus();

    response.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

export const postTestFootballConnection: RequestHandler = async (_request, response, next) => {
  try {
    const result = await testFootballConnection();

    response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const postSyncFootballFixtures: RequestHandler = async (_request, response, next) => {
  try {
    const result = await syncManchesterUnitedFixtures();

    response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const postSyncFootballFixture: RequestHandler = async (request, response, next) => {
  try {
    const requestedFixtureId = request.params.externalFixtureId;
    const externalFixtureId = Array.isArray(requestedFixtureId)
      ? requestedFixtureId[0]
      : requestedFixtureId;
    const result = await syncFixtureDetails(externalFixtureId ?? '');

    response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const postInternalFootballSync: RequestHandler = async (request, response, next) => {
  try {
    const body = cronFootballSyncSchema.parse(request.body);
    const result =
      body.mode === 'fixtures' ? await syncManchesterUnitedFixtures() : await syncLiveFixtures();

    response.json({
      success: true,
      data: {
        created: result.created,
        updated: result.updated,
        unchanged: result.unchanged,
        errors: result.errors,
      },
    });
  } catch (error) {
    logFootballSyncFailure(error);
    next(error);
  }
};
