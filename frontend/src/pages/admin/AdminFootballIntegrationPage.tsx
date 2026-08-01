import { PlugZap, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../../components/PageHeader';
import { PageMeta } from '../../components/PageMeta';
import { StatCard } from '../../components/StatCard';
import {
  useFootballIntegrationMutations,
  useFootballIntegrationStatus,
} from '../../hooks/use-football-integration';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import type { FootballSyncSummary } from '../../types/football';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const dash = '-';

export function AdminFootballIntegrationPage() {
  const { t } = useTranslation();
  const { formatDate, formatNumber } = useFormatters();
  const statusQuery = useFootballIntegrationStatus();
  const { syncFixtures, testConnection } = useFootballIntegrationMutations();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [lastSummary, setLastSummary] = useState<FootballSyncSummary | null>(null);

  const isWorking = syncFixtures.isPending || testConnection.isPending;

  const formatSyncDate = (value: string | null | undefined) =>
    value
      ? formatDate(value, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : dash;

  const handleTestConnection = () => {
    setNotification(null);
    testConnection.mutate(undefined, {
      onSuccess: (summary) => {
        setLastSummary(summary);
        setNotification({ type: 'success', message: t('admin.football.connectionSuccess') });
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: translateApiError(error, t, 'admin.football.testError'),
        });
      },
    });
  };

  const handleSyncFixtures = () => {
    setNotification(null);
    syncFixtures.mutate(undefined, {
      onSuccess: (summary) => {
        setLastSummary(summary);
        setNotification({ type: 'success', message: t('admin.football.syncSuccess') });
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: translateApiError(error, t, 'admin.football.syncError'),
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={t('admin.football.title')}
        description={t('admin.football.description')}
        robots="noindex, nofollow"
      />
      <PageHeader
        eyebrow={t('navigation.footballIntegration')}
        title={t('admin.football.title')}
        description={t('admin.football.description')}
        action={
          <>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isWorking}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-800 hover:border-united-red hover:text-united-red disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlugZap className="h-4 w-4" aria-hidden="true" />
              {testConnection.isPending
                ? t('admin.football.testingConnection')
                : t('admin.football.testConnection')}
            </button>
            <button
              type="button"
              onClick={handleSyncFixtures}
              disabled={isWorking}
              className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              <RefreshCw
                className={`h-4 w-4 ${syncFixtures.isPending ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {syncFixtures.isPending ? t('admin.football.syncing') : t('admin.football.syncNow')}
            </button>
          </>
        }
      />

      {notification ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            notification.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notification.message}
        </div>
      ) : null}

      {statusQuery.isLoading ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">{t('common.loading')}</div>
      ) : null}

      {statusQuery.isError ? (
        <div className="panel space-y-3 p-6">
          <p className="text-sm font-semibold text-red-700">
            {translateApiError(statusQuery.error, t, 'admin.football.loadError')}
          </p>
          <button
            type="button"
            onClick={() => void statusQuery.refetch()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : null}

      {statusQuery.isSuccess ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('admin.football.provider')} value={statusQuery.data.provider} />
            <StatCard
              label={t('admin.football.teamId')}
              value={
                statusQuery.data.manchesterUnitedExternalId ?? t('admin.football.unconfigured')
              }
            />
            <StatCard
              label={t('admin.football.season')}
              value={statusQuery.data.currentSeason ?? t('admin.football.unconfigured')}
            />
            <StatCard
              label={t('admin.football.noSecret')}
              value="OK"
              helper={t('admin.football.noSecret')}
            />
          </section>

          <section className="panel p-5">
            <h2 className="text-lg font-black text-zinc-950">{t('admin.football.status')}</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                  {t('admin.football.lastSynchronization')}
                </dt>
                <dd className="mt-1 text-sm font-bold text-zinc-800">
                  {formatSyncDate(statusQuery.data.lastSynchronization)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                  {t('admin.football.lastSuccess')}
                </dt>
                <dd className="mt-1 text-sm font-bold text-zinc-800">
                  {formatSyncDate(statusQuery.data.lastSuccess)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                  {t('admin.football.lastError')}
                </dt>
                <dd className="mt-1 text-sm font-bold text-zinc-800">
                  {statusQuery.data.lastError ?? dash}
                </dd>
              </div>
            </dl>
          </section>
        </>
      ) : null}

      {lastSummary ? (
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t('admin.football.created')}
              value={formatNumber(lastSummary.created)}
            />
            <StatCard
              label={t('admin.football.updated')}
              value={formatNumber(lastSummary.updated)}
            />
            <StatCard
              label={t('admin.football.unchanged')}
              value={formatNumber(lastSummary.unchanged)}
            />
            <StatCard label={t('admin.football.errors')} value={formatNumber(lastSummary.errors)} />
          </div>

          {lastSummary.differences.length > 0 ? (
            <section className="panel p-5">
              <h2 className="text-lg font-black text-zinc-950">
                {t('admin.football.differences')}
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="table-head">{t('admin.football.fixture')}</th>
                      <th className="table-head">{t('admin.football.field')}</th>
                      <th className="table-head">{t('admin.football.current')}</th>
                      <th className="table-head">{t('admin.football.incoming')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {lastSummary.differences.slice(0, 20).map((difference) => (
                      <tr key={`${difference.fixtureId}-${difference.field}`}>
                        <td className="table-cell font-bold text-zinc-950">
                          {difference.fixtureId}
                        </td>
                        <td className="table-cell">{difference.field}</td>
                        <td className="table-cell">{String(difference.current ?? dash)}</td>
                        <td className="table-cell">{String(difference.incoming ?? dash)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
