import { Link } from 'react-router';

import { PageHeader } from '../components/PageHeader';

export function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Acces refuse"
        title="Cette zone est reservee aux administrateurs"
        description="Ton compte est connecte, mais il ne dispose pas du role admin requis pour cette page."
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
