import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';

export function LoginPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow="Compte supporter"
        title="Connexion"
        description="Formulaire temporaire, pret a etre relie a une authentification plus tard."
      />
      <form className="panel space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            type="email"
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="supporter@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Mot de passe</span>
          <input
            type="password"
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="********"
          />
        </label>
        <button
          type="button"
          className="w-full rounded-md bg-united-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Se connecter
        </button>
        <p className="text-sm text-zinc-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-united-red">
            Creer un compte
          </Link>
        </p>
      </form>
    </div>
  );
}
