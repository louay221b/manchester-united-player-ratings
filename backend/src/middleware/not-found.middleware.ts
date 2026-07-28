import type { RequestHandler } from 'express';

export const notFoundMiddleware: RequestHandler = (request, response) => {
  response.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.originalUrl} not found`,
    },
  });
};
