import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { describe, expect, it, vi } from 'vitest';

import { errorMiddleware } from '../middleware/error.middleware.js';
import { requireAdmin } from '../middleware/require-admin.middleware.js';
import { createSeasonSchema } from '../schemas/seasons.schema.js';
import { HttpError } from '../utils/http-error.js';
import { mapSupabaseError, parseUuidParam } from '../utils/supabase-error.js';

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

describe('admin authorization middleware', () => {
  it('rejects non-admin profiles without trusting client-provided roles', () => {
    const response = createMockResponse();
    const next = vi.fn() as NextFunction;
    const request = {
      auth: {
        profile: {
          role: 'user',
        },
      },
    } as unknown as Request;

    requireAdmin(request, response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Administrator access required',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows admin profiles to continue', () => {
    const response = createMockResponse();
    const next = vi.fn() as NextFunction;
    const request = {
      auth: {
        profile: {
          role: 'admin',
        },
      },
    } as unknown as Request;

    requireAdmin(request, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });
});

describe('error handling', () => {
  it('returns the uniform error envelope for HttpError', () => {
    const response = createMockResponse();

    errorMiddleware(
      new HttpError(409, 'CONFLICT', 'Business conflict'),
      {} as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Business conflict',
      },
    });
  });

  it('returns validation errors without stack traces', () => {
    const response = createMockResponse();
    let validationError: ZodError | null = null;

    try {
      createSeasonSchema.parse({});
    } catch (error) {
      validationError = error as ZodError;
    }

    errorMiddleware(validationError, {} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
        }),
      }),
    );
    expect(response.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ stack: expect.anything() }),
    );
  });

  it('maps invalid identifiers and season-not-found database errors safely', () => {
    expect(() => parseUuidParam('not-a-uuid', 'season')).toThrow(
      expect.objectContaining({
        statusCode: 400,
        code: 'INVALID_ID',
      }),
    );

    const error = mapSupabaseError(
      {
        code: 'P0002',
        message: 'SEASON_NOT_FOUND',
      },
      'Unable to fetch season',
    );

    expect(error).toMatchObject({
      statusCode: 404,
      code: 'SEASON_NOT_FOUND',
      message: 'Season not found',
    });
  });
});
