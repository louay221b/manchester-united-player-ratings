import { useTranslation } from 'react-i18next';

export function RouteFallback() {
  const { t } = useTranslation();

  return <div className="panel p-6 text-sm font-semibold text-zinc-600">{t('common.loading')}</div>;
}
