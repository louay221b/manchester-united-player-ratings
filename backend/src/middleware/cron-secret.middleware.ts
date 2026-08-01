import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

import { env } from '../config/env.js';

const cronAttempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 60_000;
const maxAttempts = 12;

const safeCompare = (received: string, expected: string) => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};

export const limitCronRequests: RequestHandler = (request, response, next) => {
  const key = request.ip ?? 'unknown';
  const now = Date.now();
  const current = cronAttempts.get(key);

  if (!current || current.resetAt <= now) {
    cronAttempts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (current.count >= maxAttempts) {
    response.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many cron synchronization requests',
      },
    });
    return;
  }

  current.count += 1;
  next();
};

export const requireCronSecret: RequestHandler = (request, response, next) => {
  const receivedSecret = request.header('x-cron-secret');

  if (
    !receivedSecret ||
    !env.CRON_SYNC_SECRET ||
    !safeCompare(receivedSecret, env.CRON_SYNC_SECRET)
  ) {
    response.status(401).json({
      success: false,
      error: {
        code: 'CRON_UNAUTHORIZED',
        message: 'Cron synchronization is not authorized',
      },
    });
    return;
  }

  next();
};
