import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../components/PageHeader';
import { PageMeta } from '../components/PageMeta';

interface AccessDeniedPageProps {
  description?: string;
}

export function AccessDeniedPage({ description }: AccessDeniedPageProps) {
  const { t } = useTranslation();
  const resolvedDescription = description ?? t('accessDenied.description');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageMeta
        title={t('accessDenied.title')}
        description={resolvedDescription}
        robots="noindex, nofollow"
      />
      <PageHeader
        eyebrow={t('errors.ADMIN_REQUIRED')}
        title={t('accessDenied.title')}
        description={resolvedDescription}
      />
      <Link
        to="/"
        className="inline-flex rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
      >
        {t('common.backHome')}
      </Link>
    </div>
  );
}
