import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../../components/PageHeader';
import { RankingFilters } from '../../components/ranking/RankingFilters';
import { RankingTable } from '../../components/ranking/RankingTable';
import { SeasonSelector } from '../../components/ranking/SeasonSelector';
import { StatCard } from '../../components/StatCard';
import { useAdminSeasonStatistics } from '../../hooks/use-season-ranking';
import { useSeasons } from '../../hooks/use-seasons';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import type {
  AdminStatisticsFilters,
  RankingFilters as RankingFiltersState,
} from '../../types/ranking';

export function AdminStatisticsPage() {
  const { t } = useTranslation();
  const { formatNumber } = useFormatters();
  const [manualSeasonId, setManualSeasonId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminStatisticsFilters>({
    publishedOnly: false,
  });
  const seasonsQuery = useSeasons();
  const seasons = seasonsQuery.data ?? [];
  const defaultSeasonId =
    seasons.find((season) => season.status === 'active')?.id ?? seasons[0]?.id ?? '';
  const selectedSeasonId = manualSeasonId ?? defaultSeasonId;
  const statisticsQuery = useAdminSeasonStatistics(
    selectedSeasonId,
    filters,
    Boolean(selectedSeasonId),
  );
  const summary = statisticsQuery.data?.summary;
  const rankingRows = statisticsQuery.data?.ranking ?? [];

  const updateRankingFilters = (nextFilters: RankingFiltersState) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.statistics.title')}
        description={t('admin.statistics.description')}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SeasonSelector
          seasons={seasons}
          selectedSeasonId={selectedSeasonId}
          onChange={setManualSeasonId}
          isLoading={seasonsQuery.isLoading}
        />
        <div className="lg:flex-1">
          <RankingFilters
            filters={filters}
            onChange={updateRankingFilters}
            publishedOnly={filters.publishedOnly}
            onPublishedOnlyChange={(publishedOnly) =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                publishedOnly,
              }))
            }
          />
        </div>
      </div>

      {!filters.publishedOnly ? (
        <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {t('admin.statistics.unpublishedIncluded')}
        </div>
      ) : null}

      {seasonsQuery.isLoading || statisticsQuery.isLoading ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          {t('admin.statistics.loading')}
        </div>
      ) : null}

      {seasonsQuery.isError || statisticsQuery.isError ? (
        <section className="panel border-red-200 bg-red-50 p-6">
          <p className="font-black text-red-800">{t('admin.statistics.unavailable')}</p>
          <p className="mt-2 text-sm text-red-700">
            {translateApiError(
              seasonsQuery.error ?? statisticsQuery.error,
              t,
              'admin.statistics.loadError',
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              void seasonsQuery.refetch();
              void statisticsQuery.refetch();
            }}
            className="mt-4 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            {t('common.retry')}
          </button>
        </section>
      ) : null}

      {!seasonsQuery.isLoading && seasons.length === 0 ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">{t('ranking.noSeason')}</div>
      ) : null}

      {summary ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t('admin.statistics.totalMatches')}
            value={formatNumber(summary.totalMatches)}
          />
          <StatCard
            label={t('admin.statistics.finishedMatches')}
            value={formatNumber(summary.finishedMatches)}
          />
          <StatCard
            label={t('admin.statistics.closedVotes')}
            value={formatNumber(summary.matchesWithCompletedVoting)}
          />
          <StatCard
            label={t('admin.statistics.publishedResults')}
            value={formatNumber(summary.publishedMatches)}
          />
          <StatCard
            label={t('admin.statistics.receivedRatings')}
            value={formatNumber(summary.totalRatings)}
          />
          <StatCard
            label={t('admin.statistics.votingUsers')}
            value={formatNumber(summary.usersWhoVoted)}
          />
          <StatCard
            label={t('admin.statistics.ratedPlayers')}
            value={formatNumber(summary.playersRated)}
          />
        </section>
      ) : null}

      {statisticsQuery.data ? (
        <RankingTable rows={rankingRows} emptyMessage={t('ranking.noMatchingStatistics')} />
      ) : null}
    </div>
  );
}
