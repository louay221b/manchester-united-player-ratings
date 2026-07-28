import type { Request, Response } from 'express';

import { env } from '../config/env.js';

export const getRootStatus = (_request: Request, response: Response) => {
  response.json({
    name: 'Manchester United Player Ratings API',
    status: 'running',
  });
};

export const getHealth = (_request: Request, response: Response) => {
  response.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
};
