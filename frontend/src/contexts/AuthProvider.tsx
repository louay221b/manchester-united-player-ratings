import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { AuthContext, type AuthContextValue, type AuthUser } from './AuthContext';

const AUTH_STORAGE_KEY = 'mufc-player-ratings-session';

// Authentication is intentionally temporary and frontend-only.
// Replace this with Supabase Auth plus backend-side role checks before production.
const demoAccounts: Array<AuthUser & { password: string }> = [
  {
    id: 'demo-admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    name: 'Administrateur demo',
    role: 'admin',
  },
  {
    id: 'demo-user',
    email: 'user@example.com',
    password: 'User123!',
    name: 'Supporter demo',
    role: 'user',
  },
];

const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const storeUser = (user: AuthUser) => {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const login = useCallback((email: string, password: string) => {
    const account = demoAccounts.find(
      (demoAccount) =>
        demoAccount.email.toLowerCase() === email.trim().toLowerCase() &&
        demoAccount.password === password,
    );

    if (!account) {
      return false;
    }

    const sessionUser: AuthUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    };

    setUser(sessionUser);
    storeUser(sessionUser);
    return true;
  }, []);

  const register = useCallback((name: string, email: string, password: string) => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      return false;
    }

    const sessionUser: AuthUser = {
      id: `temporary-${Date.now()}`,
      email: email.trim(),
      name: name.trim(),
      role: 'user',
    };

    setUser(sessionUser);
    storeUser(sessionUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      role: user?.role ?? null,
      login,
      register,
      logout,
    }),
    [login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
