import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import {
  AuthContext,
  type AuthActionResult,
  type AuthContextValue,
  type Profile,
  type SignUpResult,
} from './AuthContext';
import i18n from '../i18n';
import { supabase, supabaseConfigError, supabaseMissingVariables } from '../lib/supabase';

const getSupabaseConfigError = () =>
  supabaseConfigError
    ? i18n.t('auth.errors.supabaseConfig', {
        variables: supabaseMissingVariables.join(', '),
      })
    : null;

const toReadableAuthError = (message?: string) => {
  if (!message) {
    return i18n.t('auth.errors.generic');
  }

  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return i18n.t('auth.errors.invalidCredentials');
  }

  if (normalized.includes('email not confirmed')) {
    return i18n.t('auth.errors.emailNotConfirmed');
  }

  if (normalized.includes('password')) {
    return i18n.t('auth.errors.weakPassword');
  }

  return message;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(!supabaseConfigError);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(getSupabaseConfigError());
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (supabaseConfigError) {
      return undefined;
    }

    let isMounted = true;

    const loadInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthError(toReadableAuthError(error.message));
      }

      setSession(data.session);
      setIsSessionLoading(false);
    };

    void loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError(null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    setIsProfileLoading(true);
    setProfileError(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle<Profile>();

    if (error) {
      setProfile(null);
      setProfileError(i18n.t('auth.errors.profileLoad'));
      setIsProfileLoading(false);
      return;
    }

    if (!data) {
      setProfile(null);
      setProfileError(i18n.t('auth.errors.missingProfile'));
      setIsProfileLoading(false);
      return;
    }

    setProfile(data);
    setIsProfileLoading(false);
  }, []);

  useEffect(() => {
    if (supabaseConfigError) {
      return undefined;
    }

    const userId = session?.user.id;

    if (!userId) {
      queueMicrotask(() => {
        setProfile(null);
        setProfileError(null);
        setIsProfileLoading(false);
      });
      return undefined;
    }

    let isCancelled = false;

    const loadProfile = async () => {
      setIsProfileLoading(true);
      setProfileError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle<Profile>();

      if (isCancelled) {
        return;
      }

      if (error) {
        setProfile(null);
        setProfileError(i18n.t('auth.errors.profileLoad'));
        setIsProfileLoading(false);
        return;
      }

      if (!data) {
        setProfile(null);
        setProfileError(i18n.t('auth.errors.missingProfile'));
        setIsProfileLoading(false);
        return;
      }

      setProfile(data);
      setIsProfileLoading(false);
    };

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [session?.user.id]);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user.id;

    if (!userId || supabaseConfigError) {
      setProfile(null);
      setProfileError(null);
      setIsProfileLoading(false);
      return;
    }

    await fetchProfile(userId);
  }, [fetchProfile, session?.user.id]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    setAuthError(null);

    if (supabaseConfigError) {
      const message = getSupabaseConfigError() ?? supabaseConfigError;
      setAuthError(message);
      return { success: false, error: message };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const message = toReadableAuthError(error.message);
      setAuthError(message);
      return { success: false, error: message };
    }

    setSession(data.session);
    return { success: true };
  }, []);

  const signUp = useCallback(
    async ({
      fullName,
      email,
      password,
    }: {
      fullName: string;
      email: string;
      password: string;
    }): Promise<SignUpResult> => {
      setAuthError(null);

      if (supabaseConfigError) {
        const message = getSupabaseConfigError() ?? supabaseConfigError;
        setAuthError(message);
        return { success: false, error: message };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        const message = toReadableAuthError(error.message);
        setAuthError(message);
        return { success: false, error: message };
      }

      if (data.session) {
        setSession(data.session);
      }

      return {
        success: true,
        needsEmailConfirmation: !data.session,
      };
    },
    [],
  );

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    const { error } = await supabase.auth.signOut();

    setSession(null);
    setProfile(null);
    setProfileError(null);

    if (error) {
      const message = toReadableAuthError(error.message);
      setAuthError(message);
      return { success: false, error: message };
    }

    setAuthError(null);
    return { success: true };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      role: profile?.role ?? null,
      isAuthenticated: Boolean(session?.user),
      isLoading: isSessionLoading || (Boolean(session?.user) && isProfileLoading),
      isProfileLoading,
      authError,
      profileError,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [
      authError,
      isProfileLoading,
      isSessionLoading,
      profile,
      profileError,
      refreshProfile,
      session,
      signIn,
      signOut,
      signUp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
