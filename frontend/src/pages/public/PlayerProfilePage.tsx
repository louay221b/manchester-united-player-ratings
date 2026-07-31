import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { usePlayer } from '../../hooks/use-players';
import { useActiveSeasonRanking } from '../../hooks/use-season-ranking';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import { ApiError } from '../../lib/api';
import type { RankingFilters } from '../../types/ranking';

const playerProfileRankingFilters: RankingFilters = {};

export function PlayerProfilePage() {
  const { t } = useTranslation();
  const { formatNumber, formatRating } = useFormatters();
  const { playerId } = useParams();
  const playerQuery = usePlayer(playerId ?? '');
  const rankingQuery = useActiveSeasonRanking(playerProfileRankingFilters, Boolean(playerId));

  if (!playerId) {
    return (
      <PageHeader
        eyebrow={t('players.player')}
        title={t('players.notFound')}
        description={t('players.missingId')}
      />
    );
  }

  if (playerQuery.isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">
        {t('players.loadingProfile')}
      </div>
    );
  }

  if (playerQuery.isError) {
    const isNotFound = playerQuery.error instanceof ApiError && playerQuery.error.status === 404;

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={t('players.player')}
          title={isNotFound ? t('players.notFound') : t('players.profileUnavailable')}
          description={translateApiError(playerQuery.error, t, 'players.profileLoadError')}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void playerQuery.refetch()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            {t('common.retry')}
          </button>
          <Link
            to="/ranking"
            className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            {t('players.viewRanking')}
          </Link>
        </div>
      </div>
    );
  }

  if (!playerQuery.data) {
    return null;
  }

  const player = playerQuery.data;
  const seasonStats = rankingQuery.data?.ranking.find((row) => row.playerId === player.id);

  return (
    <div className="space-y-6">
      <section className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <ApiPlayerAvatar player={player} size="lg" />
        <div>
          <p className="eyebrow">Manchester United</p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">
            {player.shirtNumber ? `#${formatNumber(player.shirtNumber)} ` : ''}
            {player.displayName}
          </h1>
          <p className="mt-2 text-zinc-600">
            {t(`positions.${player.position}`, { defaultValue: player.position })}
          </p>
          <span
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${
              player.active ? 'bg-green-100 text-green-800' : 'bg-zinc-200 text-zinc-700'
            }`}
          >
            {player.active ? t('players.active') : t('players.inactive')}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('players.shirtNumber')}</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {player.shirtNumber ? `#${formatNumber(player.shirtNumber)}` : t('common.notProvided')}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('players.arrival')}</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {player.joinedAt ?? t('common.notProvided')}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('players.departure')}</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {player.leftAt ?? t('common.notProvided')}
          </p>
        </article>
      </section>

      <section className="space-y-4">
        <div>
          <p className="eyebrow">{t('common.season')}</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">{t('players.seasonStats')}</h2>
          <p className="mt-2 text-sm font-semibold text-zinc-500">
            {t('players.seasonStatsDescription')}
          </p>
        </div>

        {rankingQuery.isLoading ? (
          <div className="panel p-6 text-sm font-semibold text-zinc-600">
            {t('players.loadingSeasonStats')}
          </div>
        ) : null}

        {rankingQuery.isError ? (
          <div className="panel border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
            {translateApiError(rankingQuery.error, t, 'players.seasonStatsError')}
          </div>
        ) : null}

        {rankingQuery.data && !seasonStats ? (
          <div className="panel p-6 text-sm font-semibold text-zinc-600">
            {t('players.noSeasonStats')}
          </div>
        ) : null}

        {seasonStats ? (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label={t('ranking.matchesPlayed')}
              value={formatNumber(seasonStats.matchesPlayed)}
            />
            <StatCard
              label={t('ranking.ratedMatches')}
              value={formatNumber(seasonStats.ratedMatches)}
            />
            <StatCard
              label={t('ranking.totalVotes')}
              value={formatNumber(seasonStats.totalVotes)}
            />
            <StatCard
              label={t('ranking.averageRating')}
              value={formatRating(seasonStats.seasonAverage, t('common.dash'))}
            />
            <StatCard
              label={t('ranking.manOfTheMatch')}
              value={formatNumber(seasonStats.manOfTheMatchCount)}
            />
            <StatCard label={t('ranking.rank')} value={`#${formatNumber(seasonStats.rank)}`} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
