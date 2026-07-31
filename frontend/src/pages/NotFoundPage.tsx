import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../components/PageHeader';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="404"
        title={t('notFound.title')}
        description={t('notFound.description')}
      />
      <Link
        to="/"
        className="inline-flex rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
      >
        {t('voting.backHome')}
      </Link>
    </div>
  );
}
