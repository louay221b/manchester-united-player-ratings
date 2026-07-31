import { ArrowRight, BarChart3, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { BrandLogo } from '../../components/layout/BrandLogo';
import { OpponentLogo } from '../../components/OpponentLogo';
import { PageHeader } from '../../components/PageHeader';
import { PageMeta } from '../../components/PageMeta';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useMatches } from '../../hooks/use-matches';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import type { Match } from '../../types/match';

function ApiMatchCard({ match }: { match: Match }) {
  const { t } = useTranslation();
  const { formatDate, formatScore } = useFormatters();

  return (
    <article className="panel overflow-hidden">
      <div className="border-b border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">{match.competition}</p>
            <div className="mt-2 flex items-center gap-3">
              <BrandLogo size="sm" />
              <span className="text-sm font-black uppercase text-zinc-400">vs</span>
              <OpponentLogo
                opponentName={match.opponentName}
                logoUrl={match.opponentLogoUrl}
                size="sm"
              />
              <h2 className="text-xl font-black text-zinc-950">
                Manchester United vs {match.opponentName}
              </h2>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {formatDate(match.matchDate, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              - {match.venue ?? t('matches.venueTbc')}
            </p>
          </div>
          <VoteStatusBadge status={match.votingStatus} />
        </div>
        <p className="mt-4 text-3xl font-black text-zinc-950">
          {formatScore(match.manchesterUnitedScore, match.opponentScore, t('common.upcoming'))}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 bg-zinc-50 px-5 py-4">
        <Link
          to={`/matches/${match.id}`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-700 hover:border-united-red hover:text-united-red"
        >
          {t('common.details')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        {match.votingStatus === 'open' ? (
          <Link
            to={`/matches/${match.id}/vote`}
            className="inline-flex items-center gap-2 rounded-md bg-united-red px-3 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            {t('common.vote')}
            <Star size={16} aria-hidden="true" />
          </Link>
        ) : null}
        {match.resultsPublished ? (
          <Link
            to={`/matches/${match.id}/results`}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
          >
            {t('common.results')}
            <BarChart3 size={16} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function MatchesPage() {
  const { t } = useTranslation();
  const matchesQuery = useMatches({ page: 1, limit: 50 });

  return (
    <div className="space-y-6">
      <PageMeta title={t('seo.matches.title')} description={t('seo.matches.description')} />
      <PageHeader
        eyebrow={t('matches.eyebrow')}
        title={t('matches.title')}
        description={t('matches.description')}
      />

      {matchesQuery.isLoading ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">{t('matches.loading')}</div>
      ) : null}

      {matchesQuery.isError ? (
        <div className="space-y-3">
          <div className="panel p-6 text-sm font-semibold text-red-700">
            {translateApiError(matchesQuery.error, t, 'matches.loadError')}
          </div>
          <button
            type="button"
            onClick={() => void matchesQuery.refetch()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : null}

      {matchesQuery.isSuccess && matchesQuery.data.data.length === 0 ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          {t('matches.noMatches')}
        </div>
      ) : null}

      {matchesQuery.isSuccess && matchesQuery.data.data.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {matchesQuery.data.data.map((match) => (
            <ApiMatchCard key={match.id} match={match} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
