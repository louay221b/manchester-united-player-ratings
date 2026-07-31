import { Eye, EyeOff, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../../components/PageHeader';
import { PageMeta } from '../../components/PageMeta';
import { useAuth } from '../../contexts/useAuth';
import { useFormatters } from '../../i18n/format';
import { updateOwnProfile, updatePassword } from '../../services/account.service';

export function ProfilePage() {
  const { t } = useTranslation();
  const { formatDate } = useFormatters();
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

  const validateFullName = (value: string) => {
    const normalized = value.trim();

    if (normalized.length < 2 || normalized.length > 100) {
      return t('account.fullNameLength');
    }

    return null;
  };

  const validatePassword = (password: string, confirmation: string) => {
    if (password.length < 8) {
      return t('auth.register.shortPassword');
    }

    if (password !== confirmation) {
      return t('auth.register.passwordMismatch');
    }

    return null;
  };

  const formatAccountDate = (value?: string) => {
    if (!value) {
      return t('common.notAvailable');
    }

    return formatDate(value, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

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
      setProfileSuccess(t('account.profileUpdated'));
    } catch {
      setProfileError(t('account.profileUpdateFailed'));
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
      setPasswordSuccess(t('account.passwordUpdated'));
    } catch {
      setPasswordError(t('account.passwordUpdateFailed'));
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={t('seo.profile.title')}
        description={t('seo.profile.description')}
        robots="noindex, nofollow"
      />
      <PageHeader
        eyebrow={t('account.eyebrow')}
        title={t('account.title')}
        description={t('account.description')}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('auth.fullName')}</p>
          <p className="mt-2 break-words text-xl font-black text-zinc-950">
            {profile?.full_name ?? t('common.notProvided')}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('auth.email')}</p>
          <p className="mt-2 break-words text-xl font-black text-zinc-950">
            {user?.email ?? t('common.notAvailable')}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('account.role')}</p>
          <p className="mt-2 text-xl font-black uppercase text-zinc-950">{role ?? 'user'}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('account.createdAt')}</p>
          <p className="mt-2 text-xl font-black text-zinc-950">
            {formatAccountDate(profile?.created_at ?? user?.created_at)}
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleProfileSubmit} noValidate className="panel space-y-4 p-6">
          <div>
            <h2 className="text-xl font-black text-zinc-950">{t('account.editProfile')}</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">{t('account.roleReadonly')}</p>
          </div>
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">{t('auth.fullName')}</span>
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
            {isProfileSubmitting ? t('common.saving') : t('common.save')}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} noValidate className="panel space-y-4 p-6">
          <div>
            <h2 className="text-xl font-black text-zinc-950">{t('account.changePassword')}</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">{t('account.passwordHelp')}</p>
          </div>
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">{t('auth.newPassword')}</span>
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
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
            <span className="text-sm font-bold text-zinc-700">{t('auth.confirmPassword')}</span>
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
            {isPasswordSubmitting ? t('account.updatingPassword') : t('account.changePassword')}
          </button>
        </form>
      </section>
    </div>
  );
}
