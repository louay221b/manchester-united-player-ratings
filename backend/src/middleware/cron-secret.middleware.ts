import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

const cronAttempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 60_000;
const maxAttempts = 12;

export const safeCompareCronSecret = (received: string, expected: string) => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
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
  const configuredSecret = process.env.CRON_SYNC_SECRET;
  const receivedSecret = request.header('X-Cron-Secret');

  if (!configuredSecret) {
    response.status(503).json({
      success: false,
      error: {
        code: 'CRON_SECRET_NOT_CONFIGURED',
        message: 'Cron synchronization is not configured',
      },
    });
    return;
  }

  if (!receivedSecret || !safeCompareCronSecret(receivedSecret, configuredSecret)) {
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
