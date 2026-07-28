import type { Request, Response } from 'express';

export const getCurrentApiUser = (request: Request, response: Response) => {
  const auth = request.auth;

  if (!auth) {
    response.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }

  response.json({
    success: true,
    data: {
      user: {
        id: auth.user.id,
        email: auth.user.email ?? null,
      },
      profile: {
        id: auth.profile.id,
        fullName: auth.profile.full_name,
        role: auth.profile.role,
      },
    },
  });
};
