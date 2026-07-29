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
