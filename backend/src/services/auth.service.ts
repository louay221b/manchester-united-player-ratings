import type { SupabaseClient } from '@supabase/supabase-js';

import type { UpdateOwnProfileInput } from '../schemas/auth.schema.js';
import { HttpError } from '../utils/http-error.js';
import { mapSupabaseError } from '../utils/supabase-error.js';

interface UpdatedProfileRow {
  id: string;
  full_name: string;
  role: 'user' | 'admin';
}

export interface UpdatedProfileDto {
  id: string;
  fullName: string;
  role: 'user' | 'admin';
}

const mapUpdatedProfileRow = (profile: UpdatedProfileRow): UpdatedProfileDto => ({
  id: profile.id,
  fullName: profile.full_name,
  role: profile.role,
});

export const updateOwnProfile = async (
  client: SupabaseClient,
  input: UpdateOwnProfileInput,
): Promise<UpdatedProfileDto> => {
  const { data, error } = await client
    .rpc('update_own_profile', {
      p_full_name: input.fullName,
    })
    .maybeSingle<UpdatedProfileRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to update profile');
  }

  if (!data) {
    throw new HttpError(404, 'PROFILE_NOT_FOUND', 'User profile was not found');
  }

  return mapUpdatedProfileRow(data);
};
