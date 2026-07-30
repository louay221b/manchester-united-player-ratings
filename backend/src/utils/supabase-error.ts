import type { PostgrestError } from '@supabase/supabase-js';
import { z } from 'zod';

import { HttpError } from './http-error.js';

type SupabaseErrorLike = Pick<PostgrestError, 'code' | 'message'> & {
  details?: string | null;
  hint?: string | null;
};

const uuidSchema = z.string().uuid();

const isForbiddenMessage = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('row-level security') ||
    normalizedMessage.includes('permission denied') ||
    normalizedMessage.includes('access denied')
  );
};

export const parseUuidParam = (value: unknown, resourceName: string) => {
  const parsed = uuidSchema.safeParse(value);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_ID', `Invalid ${resourceName} identifier`);
  }

  return parsed.data;
};

export const createNotFoundError = (resourceName: string) =>
  new HttpError(404, 'NOT_FOUND', `${resourceName} not found`);

export const mapSupabaseError = (
  error: SupabaseErrorLike,
  fallbackMessage = 'Database operation failed',
) => {
  if (error.message.includes('VOTING_CLOSED')) {
    return new HttpError(409, 'VOTING_CLOSED', 'Voting is closed for this match');
  }

  if (error.message.includes('PLAYER_NOT_ELIGIBLE')) {
    return new HttpError(400, 'PLAYER_NOT_ELIGIBLE', 'Player is not eligible for this ballot');
  }

  if (error.message.includes('INCOMPLETE_BALLOT')) {
    return new HttpError(
      400,
      'INCOMPLETE_BALLOT',
      'A rating is required for every eligible player',
    );
  }

  if (error.message.includes('RESULTS_NOT_PUBLISHED')) {
    return new HttpError(403, 'RESULTS_NOT_PUBLISHED', 'Results are not published yet');
  }

  if (error.message.includes('SEASON_NOT_FOUND')) {
    return new HttpError(404, 'SEASON_NOT_FOUND', 'Season not found');
  }

  if (error.message.includes('AUTH_REQUIRED')) {
    return new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
  }

  if (error.message.includes('PROFILE_NOT_FOUND')) {
    return new HttpError(404, 'PROFILE_NOT_FOUND', 'User profile was not found');
  }

  if (error.message.includes('ADMIN_REQUIRED')) {
    return new HttpError(403, 'ADMIN_REQUIRED', 'Administrator access required');
  }

  if (error.message.includes('VALIDATION_ERROR')) {
    return new HttpError(400, 'VALIDATION_ERROR', 'Invalid request data');
  }

  if (
    error.code === '22P02' ||
    error.message.toLowerCase().includes('invalid input syntax for type uuid')
  ) {
    return new HttpError(400, 'INVALID_ID', 'Invalid identifier');
  }

  if (error.code === 'PGRST116' || error.code === 'P0002') {
    return new HttpError(404, 'NOT_FOUND', 'Resource not found');
  }

  if (error.code === '23505') {
    return new HttpError(409, 'CONFLICT', 'Resource already exists');
  }

  if (error.code === '23503') {
    return new HttpError(409, 'RESOURCE_IN_USE', 'Resource is already in use');
  }

  if (error.code === '23514') {
    return new HttpError(400, 'CONSTRAINT_VIOLATION', 'Request violates a database constraint');
  }

  if (error.code === '42501' || error.code === 'PGRST301' || isForbiddenMessage(error.message)) {
    return new HttpError(403, 'FORBIDDEN', 'Access denied');
  }

  return new HttpError(500, 'INTERNAL_ERROR', fallbackMessage);
};
