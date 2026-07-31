import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { PageMeta } from '../../components/PageMeta';
import { useAuth } from '../../contexts/useAuth';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function RegisterPage() {
  const { t } = useTranslation();
  const { authError, signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const visibleError = formError || authError;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setConfirmationMessage('');

    if (!fullName.trim()) {
      setFormError(t('auth.register.missingFullName'));
      return;
    }

    if (!isValidEmail(email.trim())) {
      setFormError(t('auth.register.invalidEmail'));
      return;
    }

    if (password.length < 8) {
      setFormError(t('auth.register.shortPassword'));
      return;
    }

    if (password !== confirmPassword) {
      setFormError(t('auth.register.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);
    const result = await signUp({ fullName, email, password });
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error ?? t('auth.register.failed'));
      return;
    }

    if (result.needsEmailConfirmation) {
      setConfirmationMessage(t('auth.register.confirmation'));
      setPassword('');
      setConfirmPassword('');
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageMeta title={t('seo.register.title')} description={t('seo.register.description')} />
      <PageHeader
        eyebrow={t('auth.accountEyebrow')}
        title={t('auth.register.title')}
        description={t('auth.register.description')}
      />
      <form onSubmit={handleSubmit} noValidate className="panel space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-bold text-zinc-700">{t('auth.fullName')}</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Alex Supporter"
            autoComplete="name"
          />
        </label>
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
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-zinc-700">{t('auth.confirmPassword')}</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="********"
            autoComplete="new-password"
          />
        </label>
        {visibleError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {visibleError}
          </p>
        ) : null}
        {confirmationMessage ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {confirmationMessage}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>
        <p className="text-sm text-zinc-600">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="font-black text-united-red hover:text-red-800">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </form>
    </div>
  );
}
