import type { SupabaseClient, User } from '@supabase/supabase-js';

export type ApiRole = 'user' | 'admin';

export interface ApiProfile {
  id: string;
  full_name: string | null;
  role: ApiRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: User;
        profile: ApiProfile;
        accessToken: string;
        supabase: SupabaseClient;
      };
    }
  }
}

export {};
