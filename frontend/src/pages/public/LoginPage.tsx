import { useState, type FormEvent } from 'react';
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

const demoAccounts = [
  { label: 'Administrateur', email: 'admin@example.com', password: 'Admin123!', role: 'admin' },
  { label: 'Utilisateur', email: 'user@example.com', password: 'User123!', role: 'user' },
];

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const state = location.state as LoginLocationState | null;
  const from = state?.from;
  const redirectTo = `${from?.pathname ?? '/'}${from?.search ?? ''}${from?.hash ?? ''}`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!login(email, password)) {
      setError('Identifiants invalides pour les comptes de demonstration.');
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow="Compte supporter"
        title="Connexion"
        description="Authentification temporaire cote frontend, en attendant Supabase Auth et les controles backend."
      />
      <form onSubmit={handleSubmit} className="panel space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-bold text-zinc-700">Email</span>
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
          <span className="text-sm font-bold text-zinc-700">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="********"
            autoComplete="current-password"
          />
        </label>
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
        >
          Se connecter
        </button>
        <p className="text-sm text-zinc-600">
          Pas encore inscrit ?{' '}
          <Link to="/register" className="font-black text-united-red hover:text-red-800">
            Creer un compte
          </Link>
        </p>
      </form>

      <section className="panel space-y-3 p-5">
        <h2 className="text-lg font-black text-zinc-950">Comptes de demonstration</h2>
        <p className="text-sm text-zinc-600">
          Ces comptes servent uniquement a tester l interface avant Supabase.
        </p>
        <div className="grid gap-3">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
                setError('');
              }}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left hover:border-united-red hover:bg-red-50/40"
            >
              <span className="block font-black text-zinc-950">
                {account.label} - role {account.role}
              </span>
              <span className="mt-1 block text-sm text-zinc-600">
                {account.email} / {account.password}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
