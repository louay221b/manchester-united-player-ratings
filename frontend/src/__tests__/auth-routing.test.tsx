import { cleanup, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublicLayout } from '../layouts/PublicLayout';
import { AdminRoute } from '../routes/AdminRoute';
import { GuestRoute } from '../routes/GuestRoute';
import { ProtectedRoute } from '../routes/ProtectedRoute';

type MockAuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: 'user' | 'admin' | null;
  profile: { full_name: string; role: 'user' | 'admin' } | null;
  profileError: string | null;
  user: { email: string } | null;
};

const signOut = vi.fn();

let authState: MockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  role: null,
  profile: null,
  profileError: null,
  user: null,
};

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    ...authState,
    signOut,
  }),
}));

afterEach(() => {
  cleanup();
});

const renderRoutes = (initialPath: string, routeElement: ReactElement) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Accueil public</div>} />
        <Route path="/login" element={<div>Connexion page</div>} />
        <Route element={routeElement}>
          <Route path="/protected" element={<div>Contenu protege</div>} />
          <Route path="/admin" element={<div>Contenu admin</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('protected routing', () => {
  beforeEach(() => {
    signOut.mockReset();
    authState = {
      isAuthenticated: false,
      isLoading: false,
      role: null,
      profile: null,
      profileError: null,
      user: null,
    };
  });

  it('redirects guests from protected routes to login', () => {
    renderRoutes('/protected', <ProtectedRoute />);

    expect(screen.getByText('Connexion page')).toBeInTheDocument();
  });

  it('denies admin routes to authenticated users without admin role', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      role: 'user',
      profile: { full_name: 'User', role: 'user' },
      profileError: null,
      user: { email: 'user@example.com' },
    };

    renderRoutes('/admin', <AdminRoute />);

    expect(screen.getByText(/réservé aux administrateurs/i)).toBeInTheDocument();
    expect(screen.queryByText('Contenu admin')).not.toBeInTheDocument();
  });

  it('allows admin users through admin routes', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      role: 'admin',
      profile: { full_name: 'Admin', role: 'admin' },
      profileError: null,
      user: { email: 'admin@example.com' },
    };

    renderRoutes('/admin', <AdminRoute />);

    expect(screen.getByText('Contenu admin')).toBeInTheDocument();
  });

  it('redirects authenticated users away from guest routes', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      role: 'user',
      profile: { full_name: 'User', role: 'user' },
      profileError: null,
      user: { email: 'user@example.com' },
    };

    renderRoutes('/protected', <GuestRoute />);

    expect(screen.getByText('Accueil public')).toBeInTheDocument();
  });
});

describe('public navigation', () => {
  beforeEach(() => {
    signOut.mockReset();
  });

  const renderPublicLayout = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<div>Accueil</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

  it('hides Admin from visitors and simple users', () => {
    authState = {
      isAuthenticated: false,
      isLoading: false,
      role: null,
      profile: null,
      profileError: null,
      user: null,
    };

    const { rerender } = renderPublicLayout();

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Connexion' })).toBeInTheDocument();

    authState = {
      isAuthenticated: true,
      isLoading: false,
      role: 'user',
      profile: { full_name: 'User', role: 'user' },
      profileError: null,
      user: { email: 'user@example.com' },
    };

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<div>Accueil</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Connexion' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
  });

  it('shows Admin only for admin users', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      role: 'admin',
      profile: { full_name: 'Admin', role: 'admin' },
      profileError: null,
      user: { email: 'admin@example.com' },
    };

    renderPublicLayout();

    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
  });

  it('refreshes the displayed navigation name from the profile state', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      role: 'user',
      profile: { full_name: 'Old Name', role: 'user' },
      profileError: null,
      user: { email: 'user@example.com' },
    };

    const { rerender } = renderPublicLayout();

    expect(screen.getByText('Old Name')).toBeInTheDocument();

    authState = {
      ...authState,
      profile: { full_name: 'New Name', role: 'user' },
    };

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<div>Accueil</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('New Name')).toBeInTheDocument();
    expect(screen.queryByText('Old Name')).not.toBeInTheDocument();
  });
});
