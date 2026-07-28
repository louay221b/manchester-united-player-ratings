import { Link } from 'react-router';

import { PageHeader } from '../components/PageHeader';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="404"
        title="Page introuvable"
        description="La route demandee n existe pas dans cette maquette frontend."
      />
      <Link
        to="/"
        className="inline-flex rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
      >
        Retour a l accueil
      </Link>
    </div>
  );
}
