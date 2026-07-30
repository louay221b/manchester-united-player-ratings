import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Session, Subscription } from '@supabase/supabase-js';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage';
import { ProfilePage } from '../pages/public/ProfilePage';
import { ResetPasswordPage } from '../pages/public/ResetPasswordPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';

const accountServiceMocks = vi.hoisted(() => ({
  requestPasswordRecovery: vi.fn(),
  updateOwnProfile: vi.fn(),
  updatePassword: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

type MockAuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: {
    id: string;
    full_name: string | null;
    role: 'user' | 'admin';
    created_at: string;
    updated_at: string;
  } | null;
  refreshProfile: ReturnType<typeof vi.fn>;
  role: 'user' | 'admin' | null;
  user: {
    email: string;
    created_at: string;
  } | null;
};

let authState: MockAuthState;

vi.mock('../services/account.service', () => ({
  AccountError: class AccountError extends Error {},
  requestPasswordRecovery: accountServiceMocks.requestPasswordRecovery,
  updateOwnProfile: accountServiceMocks.updateOwnProfile,
  updatePassword: accountServiceMocks.updatePassword,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
    },
  },
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => authState,
}));

const unsubscribe = vi.fn();
const mockSubscription = { unsubscribe } as unknown as Subscription;

const renderWithRouter = (element: ReactElement, initialPath = '/') =>
  render(<MemoryRouter initialEntries={[initialPath]}>{element}</MemoryRouter>);

const renderProtectedProfile = (initialPath = '/profile') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Connexion page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

const setResetUrl = (path: string) => {
  window.history.pushState({}, '', path);
};

describe('account pages', () => {
  beforeEach(() => {
    accountServiceMocks.requestPasswordRecovery.mockReset();
    accountServiceMocks.updateOwnProfile.mockReset();
    accountServiceMocks.updatePassword.mockReset();
    authMocks.getSession.mockReset();
    authMocks.onAuthStateChange.mockReset();
    unsubscribe.mockReset();
    authMocks.onAuthStateChange.mockReturnValue({
      data: {
        subscription: mockSubscription,
      },
    });
    authState = {
      isAuthenticated: true,
      isLoading: false,
      profile: {
        id: '11111111-1111-4111-8111-111111111111',
        full_name: 'Alex Supporter',
        role: 'user',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      refreshProfile: vi.fn(),
      role: 'user',
      user: {
        email: 'alex@example.com',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects visitors away from /profile', () => {
    authState = {
      ...authState,
      isAuthenticated: false,
      profile: null,
      role: null,
      user: null,
    };

    renderProtectedProfile();

    expect(screen.getByText('Connexion page')).toBeInTheDocument();
  });

  it('loads the profile and updates the full name through the API', async () => {
    accountServiceMocks.updateOwnProfile.mockResolvedValue({
      success: true,
      data: {
        profile: {
          id: authState.profile?.id,
          fullName: 'Alex Updated',
          role: 'user',
        },
      },
    });

    renderProtectedProfile();

    expect(screen.getAllByText('Alex Supporter')[0]).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nom complet'), {
      target: { value: '  Alex Updated  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => {
      expect(accountServiceMocks.updateOwnProfile).toHaveBeenCalledWith('Alex Updated');
    });
    expect(authState.refreshProfile).toHaveBeenCalledOnce();
    expect(await screen.findByText('Profil mis a jour.')).toBeInTheDocument();
  });

  it('rejects short passwords and mismatched confirmations before update', () => {
    renderWithRouter(<ProfilePage />);

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText('Confirmation'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));

    expect(
      screen.getByText('Le mot de passe doit contenir au moins 8 caracteres.'),
    ).toBeInTheDocument();
    expect(accountServiceMocks.updatePassword).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirmation'), {
      target: { value: 'Different123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));

    expect(
      screen.getByText('La confirmation du mot de passe ne correspond pas.'),
    ).toBeInTheDocument();
    expect(accountServiceMocks.updatePassword).not.toHaveBeenCalled();
  });

  it('updates the connected password and clears the fields', async () => {
    accountServiceMocks.updatePassword.mockResolvedValue(undefined);

    renderWithRouter(<ProfilePage />);

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirmation'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));

    await waitFor(() => {
      expect(accountServiceMocks.updatePassword).toHaveBeenCalledWith('NewPassword123!');
    });
    expect(await screen.findByText('Mot de passe mis a jour.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nouveau mot de passe')).toHaveValue('');
  });

  it('requests password recovery and shows a generic success message', async () => {
    accountServiceMocks.requestPasswordRecovery.mockResolvedValue(undefined);

    renderWithRouter(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    await waitFor(() => {
      expect(accountServiceMocks.requestPasswordRecovery).toHaveBeenCalledWith('alex@example.com');
    });
    expect(
      await screen.findByText(
        'Si un compte correspond a cette adresse, un lien de recuperation a ete envoye.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the reset form only for a valid recovery session', async () => {
    setResetUrl('/reset-password?type=recovery');
    authMocks.getSession.mockResolvedValue({
      data: {
        session: { user: { id: 'user-id' } } as Session,
      },
    });

    renderWithRouter(<ResetPasswordPage />);

    expect(
      await screen.findByRole('button', { name: 'Enregistrer le nouveau mot de passe' }),
    ).toBeInTheDocument();
  });

  it('shows an invalid-link state when recovery session is missing', async () => {
    setResetUrl('/reset-password?type=recovery');
    authMocks.getSession.mockResolvedValue({
      data: {
        session: null,
      },
    });

    renderWithRouter(<ResetPasswordPage />);

    expect(await screen.findByText('Lien expire ou invalide.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Enregistrer le nouveau mot de passe' }),
    ).not.toBeInTheDocument();
  });

  it('updates the password during reset recovery', async () => {
    setResetUrl('/reset-password?type=recovery');
    authMocks.getSession.mockResolvedValue({
      data: {
        session: { user: { id: 'user-id' } } as Session,
      },
    });
    accountServiceMocks.updatePassword.mockResolvedValue(undefined);

    renderWithRouter(<ResetPasswordPage />);

    fireEvent.change(await screen.findByLabelText('Nouveau mot de passe'), {
      target: { value: 'Recovered123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirmation'), {
      target: { value: 'Recovered123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le nouveau mot de passe' }));

    await waitFor(() => {
      expect(accountServiceMocks.updatePassword).toHaveBeenCalledWith('Recovered123!');
    });
    expect(await screen.findByText(/Mot de passe mis a jour/)).toBeInTheDocument();
  });
});
