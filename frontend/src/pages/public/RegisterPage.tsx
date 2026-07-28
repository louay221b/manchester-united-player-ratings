import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../contexts/useAuth';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!register(name, email, password)) {
      setError('Renseigne un pseudo, un email et un mot de passe pour continuer.');
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow="Compte supporter"
        title="Inscription"
        description="Creation de session temporaire cote frontend, sans backend ni API externe."
      />
      <form onSubmit={handleSubmit} className="panel space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-bold text-zinc-700">Pseudo</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="RedDevil92"
            autoComplete="name"
          />
        </label>
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
            autoComplete="new-password"
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
          Creer le compte
        </button>
        <p className="text-sm text-zinc-600">
          Deja inscrit ?{' '}
          <Link to="/login" className="font-black text-united-red hover:text-red-800">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
