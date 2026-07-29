import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type AuthRole = 'user' | 'admin';

export interface Profile {
  id: string;
  role: AuthRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export interface SignUpResult extends AuthActionResult {
  needsEmailConfirmation?: boolean;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  authError: string | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<SignUpResult>;
  signOut: () => Promise<AuthActionResult>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
