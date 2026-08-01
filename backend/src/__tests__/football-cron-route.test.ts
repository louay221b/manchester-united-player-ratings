import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { postInternalFootballSync } from '../controllers/football.controller.js';
import { requireCronSecret } from '../middleware/cron-secret.middleware.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
import { HttpError } from '../utils/http-error.js';

const footballService = vi.hoisted(() => ({
  getFootballIntegrationStatus: vi.fn(),
  syncFixtureDetails: vi.fn(),
  syncLiveFixtures: vi.fn(),
  syncManchesterUnitedFixtures: vi.fn(),
  testFootballConnection: vi.fn(),
}));

vi.mock('../integrations/football/football-sync.service.js', () => footballService);

const originalCronSecret = process.env.CRON_SYNC_SECRET;

const syncSummary = {
  created: 1,
  updated: 2,
  unchanged: 3,
  errors: 0,
  differences: [],
  lastSyncedAt: '2026-08-01T00:00:00.000Z',
};

const createMockResponse = () => {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
};

const createMockRequest = (headers: Record<string, string | undefined>, body: unknown = {}) =>
  ({
    body,
    header: vi.fn((name: string) => headers[name.toLowerCase()]),
  }) as unknown as Request;

const runInternalSync = async (body: unknown) => {
  const response = createMockResponse();
  let capturedError: unknown;
  const next = vi.fn((error?: unknown) => {
    capturedError = error;
  }) as NextFunction;

  await Promise.resolve(postInternalFootballSync({ body } as Request, response, next));

  if (capturedError) {
    errorMiddleware(capturedError, {} as Request, response, vi.fn());
  }

  return response;
};

beforeEach(() => {
  process.env.CRON_SYNC_SECRET = 'cron-secret';
  vi.clearAllMocks();
  footballService.syncManchesterUnitedFixtures.mockResolvedValue(syncSummary);
  footballService.syncLiveFixtures.mockResolvedValue({
    ...syncSummary,
    created: 0,
    updated: 1,
  });
});

afterEach(() => {
  if (originalCronSecret === undefined) {
    delete process.env.CRON_SYNC_SECRET;
  } else {
    process.env.CRON_SYNC_SECRET = originalCronSecret;
  }
});

describe('cron football synchronization secret guard', () => {
  it('returns 503 when the server secret is not configured', () => {
    delete process.env.CRON_SYNC_SECRET;
    const request = createMockRequest({ 'x-cron-secret': 'cron-secret' });
    const response = createMockResponse();
    const next = vi.fn() as NextFunction;

    requireCronSecret(request, response, next);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'CRON_SECRET_NOT_CONFIGURED',
        message: 'Cron synchronization is not configured',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the secret header is absent', () => {
    const request = createMockRequest({});
    const response = createMockResponse();
    const next = vi.fn() as NextFunction;

    requireCronSecret(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'CRON_UNAUTHORIZED',
        message: 'Cron synchronization is not authorized',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the secret header is incorrect', () => {
    const request = createMockRequest({ 'x-cron-secret': 'wrong-secret' });
    const response = createMockResponse();
    const next = vi.fn() as NextFunction;

    requireCronSecret(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'CRON_UNAUTHORIZED',
        message: 'Cron synchronization is not authorized',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts the correct secret header without user authentication', () => {
    const request = createMockRequest({ 'x-cron-secret': 'cron-secret' });
    const response = createMockResponse();
    const next = vi.fn() as NextFunction;

    requireCronSecret(request, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });
});

describe('cron football synchronization controller', () => {
  it('returns 400 for an invalid mode', async () => {
    const response = await runInternalSync({ mode: 'season' });

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      }),
    );
    expect(footballService.syncManchesterUnitedFixtures).not.toHaveBeenCalled();
    expect(footballService.syncLiveFixtures).not.toHaveBeenCalled();
  });

  it('calls fixture synchronization for mode fixtures', async () => {
    const response = await runInternalSync({ mode: 'fixtures' });

    expect(footballService.syncManchesterUnitedFixtures).toHaveBeenCalledOnce();
    expect(footballService.syncLiveFixtures).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: {
        created: 1,
        updated: 2,
        unchanged: 3,
        errors: 0,
      },
    });
  });

  it('calls live synchronization for mode live', async () => {
    const response = await runInternalSync({ mode: 'live' });

    expect(footballService.syncLiveFixtures).toHaveBeenCalledOnce();
    expect(footballService.syncManchesterUnitedFixtures).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: {
        created: 0,
        updated: 1,
        unchanged: 3,
        errors: 0,
      },
    });
  });

  it('returns a safe error envelope when the football provider fails', async () => {
    footballService.syncManchesterUnitedFixtures.mockRejectedValueOnce(
      new HttpError(502, 'FOOTBALL_PROVIDER_ERROR', 'Football provider unavailable'),
    );

    const response = await runInternalSync({ mode: 'fixtures' });

    expect(response.status).toHaveBeenCalledWith(502);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FOOTBALL_PROVIDER_ERROR',
        message: 'Football provider unavailable',
      },
    });
    expect(JSON.stringify(response.json.mock.calls)).not.toContain('cron-secret');
  });
});
