import type { Request, Response } from 'express';

export const pingAdminApi = (_request: Request, response: Response) => {
  response.json({
    success: true,
    message: 'Administrator API access verified',
  });
};
