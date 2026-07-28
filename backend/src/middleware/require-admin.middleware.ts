import type { RequestHandler } from 'express';

export const requireAdmin: RequestHandler = (request, response, next) => {
  if (request.auth?.profile.role !== 'admin') {
    response.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Administrator access required',
      },
    });
    return;
  }

  next();
};
