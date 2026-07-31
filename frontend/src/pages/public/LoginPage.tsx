import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../contexts/useAuth';

type RedirectLocation = {
  pathname?: string;
  search?: string;
  hash?: string;
};

type LoginLocationState = {
  from?: RedirectLocation;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function LoginPage() {
  const { t } = useTranslation();
  const { authError, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const state = location.state as LoginLocationState | null;
  const from = state?.from;
  const redirectTo = `${from?.pathname ?? '/'}${from?.search ?? ''}${from?.hash ?? ''}`;
  const visibleError = formError || authError;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!isValidEmail(email.trim())) {
      setFormError(t('auth.login.invalidEmail'));
      return;
    }

    if (!password) {
      setFormError(t('auth.login.missingPassword'));
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error ?? t('auth.login.failed'));
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow={t('auth.accountEyebrow')}
        title={t('auth.login.title')}
        description={t('auth.login.description')}
      />
      <form onSubmit={handleSubmit} noValidate className="panel space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-bold text-zinc-700">{t('auth.email')}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="supporter@example.com"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-zinc-700">{t('auth.password')}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="********"
            autoComplete="current-password"
          />
        </label>
        {visibleError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {visibleError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
        <p className="text-sm text-zinc-600">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-black text-united-red hover:text-red-800">
            {t('auth.login.createAccount')}
          </Link>
        </p>
        <Link
          to="/forgot-password"
          className="inline-flex text-sm font-black text-united-red hover:text-red-800"
        >
          {t('auth.login.forgotPassword')}
        </Link>
      </form>
    </div>
  );
}
