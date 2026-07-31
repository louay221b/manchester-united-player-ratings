import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../components/PageHeader';

interface AccessDeniedPageProps {
  description?: string;
}

export function AccessDeniedPage({ description }: AccessDeniedPageProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow={t('errors.ADMIN_REQUIRED')}
        title={t('accessDenied.title')}
        description={description ?? t('accessDenied.description')}
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
