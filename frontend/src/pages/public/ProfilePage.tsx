import { Eye, EyeOff, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../contexts/useAuth';
import { AccountError, updateOwnProfile, updatePassword } from '../../services/account.service';

const validateFullName = (value: string) => {
  const normalized = value.trim();

  if (normalized.length < 2 || normalized.length > 100) {
    return 'Le nom complet doit contenir entre 2 et 100 caracteres.';
  }

  return null;
};

const validatePassword = (password: string, confirmPassword: string) => {
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caracteres.';
  }

  if (password !== confirmPassword) {
    return 'La confirmation du mot de passe ne correspond pas.';
  }

  return null;
};

const formatDate = (value?: string) => {
  if (!value) {
    return 'Non disponible';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof AccountError || error instanceof Error ? error.message : fallback;

export function ProfilePage() {
  const { profile, refreshProfile, role, user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setFullName(profile?.full_name ?? '');
    });
  }, [profile?.full_name]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const validationError = validateFullName(fullName);

    if (validationError) {
      setProfileError(validationError);
      return;
    }

    setIsProfileSubmitting(true);

    try {
      await updateOwnProfile(fullName.trim());
      await refreshProfile();
      setProfileSuccess('Profil mis a jour.');
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Impossible de mettre a jour le profil.'));
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const validationError = validatePassword(newPassword, confirmPassword);

    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setIsPasswordSubmitting(true);

    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Mot de passe mis a jour.');
    } catch (error) {
      setPasswordError(getErrorMessage(error, 'Impossible de changer le mot de passe.'));
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compte"
        title="Profil"
        description="Consulte ton compte et mets a jour uniquement ton nom complet."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Nom complet</p>
          <p className="mt-2 break-words text-xl font-black text-zinc-950">
            {profile?.full_name ?? 'Non renseigne'}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Email</p>
          <p className="mt-2 break-words text-xl font-black text-zinc-950">
            {user?.email ?? 'Non disponible'}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Role</p>
          <p className="mt-2 text-xl font-black uppercase text-zinc-950">{role ?? 'user'}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Compte cree</p>
          <p className="mt-2 text-xl font-black text-zinc-950">
            {formatDate(profile?.created_at ?? user?.created_at)}
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleProfileSubmit} noValidate className="panel space-y-4 p-6">
          <div>
            <h2 className="text-xl font-black text-zinc-950">Modifier le profil</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              Le role ne peut pas etre modifie depuis cette page.
            </p>
          </div>
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">Nom complet</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
              autoComplete="name"
              disabled={isProfileSubmitting}
            />
          </label>
          {profileError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {profileError}
            </p>
          ) : null}
          {profileSuccess ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {profileSuccess}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isProfileSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isProfileSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} noValidate className="panel space-y-4 p-6">
          <div>
            <h2 className="text-xl font-black text-zinc-950">Changer le mot de passe</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              Minimum 8 caracteres. Le mot de passe n est jamais envoye a notre API.
            </p>
          </div>
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">Nouveau mot de passe</span>
            <span className="mt-2 flex rounded-md border border-zinc-300 bg-white focus-within:ring-2 focus-within:ring-united-red/30">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="min-w-0 flex-1 rounded-md px-3 py-2 outline-none"
                autoComplete="new-password"
                disabled={isPasswordSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="px-3 text-zinc-600 hover:text-zinc-950"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">Confirmation</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
              autoComplete="new-password"
              disabled={isPasswordSubmitting}
            />
          </label>
          {passwordError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {passwordError}
            </p>
          ) : null}
          {passwordSuccess ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {passwordSuccess}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPasswordSubmitting}
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {isPasswordSubmitting ? 'Mise a jour...' : 'Changer le mot de passe'}
          </button>
        </form>
      </section>
    </div>
  );
}
