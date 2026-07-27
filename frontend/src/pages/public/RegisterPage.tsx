import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';

export function RegisterPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow="Compte supporter"
        title="Inscription"
        description="Creation de compte en version frontend uniquement."
      />
      <form className="panel space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Pseudo</span>
          <input
            type="text"
            className="focus-ring mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="RedDevil92"
          />
        </label>
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
          Creer le compte
        </button>
        <p className="text-sm text-zinc-600">
          Deja inscrit ?{' '}
          <Link to="/login" className="font-semibold text-united-red">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
