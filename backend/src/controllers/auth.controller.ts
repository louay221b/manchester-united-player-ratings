import type { Request, RequestHandler, Response } from 'express';

import { updateOwnProfileSchema } from '../schemas/auth.schema.js';
import { updateOwnProfile } from '../services/auth.service.js';

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

export const patchCurrentProfile: RequestHandler = async (request, response, next) => {
  try {
    if (!request.auth) {
      response.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const body = updateOwnProfileSchema.parse(request.body);
    const profile = await updateOwnProfile(request.auth.supabase, body);

    response.json({
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};
