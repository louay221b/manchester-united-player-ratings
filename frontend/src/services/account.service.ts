import { apiRequest } from '../lib/api';
import { supabase } from '../lib/supabase';

export interface UpdatedProfileResponse {
  success: true;
  data: {
    profile: {
      id: string;
      fullName: string;
      role: 'user' | 'admin';
    };
  };
}

export class AccountError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const toAccountError = (fallback: string) => new AccountError(fallback);

export const updateOwnProfile = async (fullName: string) =>
  apiRequest<UpdatedProfileResponse>('/api/auth/profile', {
    method: 'PATCH',
    body: {
      fullName,
    },
  });

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw toAccountError('Impossible de mettre a jour le mot de passe pour le moment.');
  }
};

export const requestPasswordRecovery = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw toAccountError('Impossible d envoyer le lien de recuperation pour le moment.');
  }
};
