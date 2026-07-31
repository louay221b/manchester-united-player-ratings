import { BarChart3, CalendarDays, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { useMatches } from '../../hooks/use-matches';
import { usePlayers } from '../../hooks/use-players';
import { useAdminSeasonStatistics } from '../../hooks/use-season-ranking';
import { useSeasons } from '../../hooks/use-seasons';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import { verifyAdminApiAccess } from '../../services/auth-api.service';
import type { MatchFilters } from '../../types/match';
import type { PlayerFilters } from '../../types/player';
import type { AdminStatisticsFilters } from '../../types/ranking';

const allMatchesFilters: MatchFilters = { page: 1, limit: 1 };
const openMatchesFilters: MatchFilters = { page: 1, limit: 1, votingStatus: 'open' };
const activePlayersFilters: PlayerFilters = { page: 1, limit: 1, active: true };
const dashboardStatisticsFilters: AdminStatisticsFilters = { publishedOnly: false };

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const { formatNumber } = useFormatters();
  const seasonsQuery = useSeasons();
  const matchesQuery = useMatches(allMatchesFilters);
  const openMatchesQuery = useMatches(openMatchesFilters);
  const playersQuery = usePlayers(activePlayersFilters);
  const activeSeason = seasonsQuery.data?.find((season) => season.status === 'active');
  const statisticsQuery = useAdminSeasonStatistics(
    activeSeason?.id ?? '',
    dashboardStatisticsFilters,
    Boolean(activeSeason?.id),
  );
  const leader = statisticsQuery.data?.ranking.find((row) => row.seasonAverage !== null);
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiError, setApiError] = useState<unknown>(null);

  useEffect(() => {
    let isCancelled = false;

    const verifyApiAccess = async () => {
      setApiStatus('loading');
      setApiError(null);

      try {
        await verifyAdminApiAccess();

        if (!isCancelled) {
          setApiStatus('success');
        }
      } catch (error) {
        if (!isCancelled) {
          setApiStatus('error');
          setApiError(error);
        }
      }
    };

    void verifyApiAccess();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.dashboard.title')}
        description={t('admin.dashboard.description')}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label={t('common.activeSeason')} value={activeSeason?.name ?? t('common.dash')} />
        <StatCard
          label={t('home.activePlayers')}
          value={
            playersQuery.data ? formatNumber(playersQuery.data.pagination.total) : t('common.dash')
          }
        />
        <StatCard
          label={t('navigation.matches')}
          value={
            matchesQuery.data ? formatNumber(matchesQuery.data.pagination.total) : t('common.dash')
          }
        />
        <StatCard
          label={t('statuses.voting.open')}
          value={
            openMatchesQuery.data
              ? formatNumber(openMatchesQuery.data.pagination.total)
              : t('common.dash')
          }
          helper={t('navigation.matches')}
        />
      </section>

      <section
        className={[
          'panel p-5',
          apiStatus === 'success' ? 'border-emerald-200 bg-emerald-50' : '',
          apiStatus === 'error' ? 'border-red-200 bg-red-50' : '',
        ].join(' ')}
      >
        <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">
          {t('admin.dashboard.apiVerification')}
        </p>
        <p
          className={[
            'mt-2 font-black',
            apiStatus === 'success' ? 'text-emerald-700' : '',
            apiStatus === 'error' ? 'text-red-700' : '',
            apiStatus === 'loading' ? 'text-zinc-700' : '',
          ].join(' ')}
        >
          {apiStatus === 'loading'
            ? t('admin.dashboard.apiChecking')
            : apiStatus === 'success'
              ? t('admin.dashboard.apiSuccess')
              : translateApiError(apiError, t, 'admin.dashboard.apiError')}
        </p>
      </section>

      {(seasonsQuery.isError ||
        playersQuery.isError ||
        matchesQuery.isError ||
        openMatchesQuery.isError ||
        statisticsQuery.isError) && (
        <section className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {t('admin.dashboard.partialDataError')}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-4">
        <Link
          to="/admin/matches"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <CalendarDays className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">{t('navigation.matchesAdmin')}</span>
            <span className="mt-1 block text-sm text-zinc-500">
              {t('admin.dashboard.matchesDescription')}
            </span>
          </span>
        </Link>
        <Link
          to="/admin/players"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <Users className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">{t('navigation.players')}</span>
            <span className="mt-1 block text-sm text-zinc-500">
              {t('admin.dashboard.playersDescription')}
            </span>
          </span>
        </Link>
        <Link
          to="/admin/statistics"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <BarChart3 className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">{t('navigation.statistics')}</span>
            <span className="mt-1 block text-sm text-zinc-500">
              {t('admin.dashboard.statisticsDescription')}
            </span>
          </span>
        </Link>
        <article className="panel flex items-start gap-4 p-5">
          <Trophy className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">
              {leader ? `${leader.firstName} ${leader.lastName}` : t('common.dash')}
            </span>
            <span className="mt-1 block text-sm text-zinc-500">
              {t('admin.dashboard.currentLeader')}
            </span>
          </span>
        </article>
      </section>
    </div>
  );
}
