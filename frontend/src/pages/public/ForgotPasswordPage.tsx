import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { AccountError, requestPasswordRecovery } from '../../services/account.service';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const genericSuccessMessage =
  'Si un compte correspond a cette adresse, un lien de recuperation a ete envoye.';

const getErrorMessage = (error: unknown) =>
  error instanceof AccountError || error instanceof Error
    ? error.message
    : 'Impossible d envoyer le lien de recuperation pour le moment.';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!isValidEmail(email.trim())) {
      setFormError('Renseigne une adresse email valide.');
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordRecovery(email);
      setSuccessMessage(genericSuccessMessage);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow="Compte supporter"
        title="Mot de passe oublie"
        description="Demande un lien securise pour definir un nouveau mot de passe."
      />
      <form onSubmit={handleSubmit} noValidate className="panel space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-bold text-zinc-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="supporter@example.com"
            autoComplete="email"
            disabled={isSubmitting}
          />
        </label>
        {formError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {formError}
          </p>
        ) : null}
        {successMessage ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {successMessage}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien'}
        </button>
        <Link
          to="/login"
          className="inline-flex text-sm font-black text-united-red hover:text-red-800"
        >
          Retour a la connexion
        </Link>
      </form>
    </div>
  );
}
