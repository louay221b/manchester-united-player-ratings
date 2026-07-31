import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';

const signIn = vi.fn();
const signUp = vi.fn();

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    authError: null,
    signIn,
    signUp,
  }),
}));

const renderWithRouter = (element: ReactElement) => render(<MemoryRouter>{element}</MemoryRouter>);

afterEach(() => {
  cleanup();
});

describe('auth forms', () => {
  beforeEach(() => {
    signIn.mockReset();
    signUp.mockReset();
  });

  it('shows a readable login validation error for invalid email', () => {
    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(screen.getByText('Renseigne une adresse email valide.')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows a forgot-password link on login', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByRole('link', { name: 'Mot de passe oublié ?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('shows a readable registration error for password mismatch', () => {
    renderWithRouter(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Nom complet'), {
      target: { value: 'Alex Supporter' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirmation du mot de passe'), {
      target: { value: 'Different123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

    expect(
      screen.getByText('La confirmation du mot de passe ne correspond pas.'),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });
});
