import type { RequestHandler } from 'express';

import { createUserSupabaseClient, supabaseAuthClient } from '../lib/supabase.js';
import type { ApiProfile } from '../types/express.js';

const sendAuthRequired = (response: Parameters<RequestHandler>[1]) => {
  response.status(401).json({
    success: false,
    error: {
      code: 'AUTH_REQUIRED',
      message: 'Authentication required',
    },
  });
};

const sendInvalidToken = (response: Parameters<RequestHandler>[1]) => {
  response.status(401).json({
    success: false,
    error: {
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token',
    },
  });
};

export const authenticate: RequestHandler = async (request, response, next) => {
  const authorizationHeader = request.header('authorization');

  if (!authorizationHeader) {
    sendAuthRequired(response);
    return;
  }

  if (!authorizationHeader.startsWith('Bearer ')) {
    sendInvalidToken(response);
    return;
  }

  const accessToken = authorizationHeader.slice('Bearer '.length).trim();

  if (!accessToken) {
    sendInvalidToken(response);
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAuthClient.auth.getUser(accessToken);

  if (userError || !user) {
    sendInvalidToken(response);
    return;
  }

  const userSupabase = createUserSupabaseClient(accessToken);
  const { data: profile, error: profileError } = await userSupabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .maybeSingle<ApiProfile>();

  if (profileError || !profile) {
    response.status(401).json({
      success: false,
      error: {
        code: 'PROFILE_NOT_FOUND',
        message: 'User profile was not found',
      },
    });
    return;
  }

  request.auth = {
    user,
    profile,
    accessToken,
    supabase: userSupabase,
  };

  next();
};
