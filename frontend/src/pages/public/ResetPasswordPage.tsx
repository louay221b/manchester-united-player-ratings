import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { PageMeta } from '../../components/PageMeta';
import { supabase } from '../../lib/supabase';
import { updatePassword } from '../../services/account.service';

type RecoveryStatus = 'checking' | 'ready' | 'invalid' | 'success';

const hasRecoveryHint = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);

  return (
    hashParams.get('type') === 'recovery' ||
    searchParams.get('type') === 'recovery' ||
    searchParams.has('code')
  );
};

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasLinkHint = useMemo(() => hasRecoveryHint(), []);
  const [status, setStatus] = useState<RecoveryStatus>(hasLinkHint ? 'checking' : 'invalid');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (password: string, confirmation: string) => {
    if (password.length < 8) {
      return t('auth.register.shortPassword');
    }

    if (password !== confirmation) {
      return t('auth.register.passwordMismatch');
    }

    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted || status === 'success') {
        return;
      }

      setStatus(session && hasLinkHint ? 'ready' : 'invalid');
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setStatus('ready');
        setFormError('');
      }
    });

    if (hasLinkHint) {
      void checkRecoverySession();
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hasLinkHint, status]);

  useEffect(() => {
    if (status !== 'success') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/profile', { replace: true });
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const validationError = validatePassword(newPassword, confirmPassword);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setStatus('success');
    } catch {
      setFormError(t('auth.resetPassword.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageMeta
        title={t('seo.resetPassword.title')}
        description={t('seo.resetPassword.description')}
        robots="noindex, nofollow"
      />
      <PageHeader
        eyebrow={t('auth.accountEyebrow')}
        title={t('auth.resetPassword.title')}
        description={t('auth.resetPassword.description')}
      />

      {status === 'checking' ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          {t('auth.resetPassword.checking')}
        </div>
      ) : null}

      {status === 'invalid' ? (
        <section className="panel space-y-4 border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="font-black">{t('auth.resetPassword.invalidTitle')}</p>
          <p className="text-sm font-semibold">{t('auth.resetPassword.invalidDescription')}</p>
          <Link
            to="/forgot-password"
            className="inline-flex rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            {t('auth.resetPassword.requestNewLink')}
          </Link>
        </section>
      ) : null}

      {status === 'success' ? (
        <section className="panel border-emerald-200 bg-emerald-50 p-6 text-sm font-semibold text-emerald-800">
          {t('auth.resetPassword.success')}
        </section>
      ) : null}

      {status === 'ready' ? (
        <form onSubmit={handleSubmit} noValidate className="panel space-y-4 p-6">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">{t('auth.newPassword')}</span>
            <span className="mt-2 flex rounded-md border border-zinc-300 bg-white focus-within:ring-2 focus-within:ring-united-red/30">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="min-w-0 flex-1 rounded-md px-3 py-2 outline-none"
                autoComplete="new-password"
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </label>
          {formError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {formError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {isSubmitting ? t('common.saving') : t('auth.resetPassword.submit')}
          </button>
        </form>
      ) : null}
    </div>
  );
}
