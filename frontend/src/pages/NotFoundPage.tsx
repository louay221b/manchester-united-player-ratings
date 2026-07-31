import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../components/PageHeader';
import { PageMeta } from '../components/PageMeta';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageMeta
        title={t('notFound.title')}
        description={t('notFound.description')}
        robots="noindex, nofollow"
      />
      <PageHeader
        eyebrow="404"
        title={t('notFound.title')}
        description={t('notFound.description')}
      />
      <div className="flex flex-wrap gap-3">
        <Link
          to="/"
          className="inline-flex rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
        >
          {t('notFound.homeLink')}
        </Link>
        <Link
          to="/matches"
          className="inline-flex rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-zinc-700 hover:border-united-red hover:text-united-red"
        >
          {t('notFound.matchesLink')}
        </Link>
      </div>
    </div>
  );
}
