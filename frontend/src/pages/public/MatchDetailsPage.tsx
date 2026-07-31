import { BarChart3, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { OpponentLogo } from '../../components/OpponentLogo';
import { PageHeader } from '../../components/PageHeader';
import { PageMeta } from '../../components/PageMeta';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useMatch } from '../../hooks/use-matches';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';

export function MatchDetailsPage() {
  const { t } = useTranslation();
  const { formatDate, formatNumber, formatScore } = useFormatters();
  const { matchId } = useParams();
  const matchQuery = useMatch(matchId ?? '');

  if (!matchId) {
    return (
      <>
        <PageMeta
          title={t('seo.matchDetails.title')}
          description={t('seo.matchDetails.description')}
          robots="noindex, nofollow"
        />
        <PageHeader
          eyebrow={t('errors.NOT_FOUND')}
          title={t('matches.notFound')}
          description={t('matches.missingId')}
        />
      </>
    );
  }

  if (matchQuery.isLoading) {
    return (
      <>
        <PageMeta
          title={t('seo.matchDetails.title')}
          description={t('seo.matchDetails.description')}
        />
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          {t('matches.detailsLoading')}
        </div>
      </>
    );
  }

  if (matchQuery.isError) {
    return (
      <div className="space-y-4">
        <PageMeta
          title={t('seo.matchDetails.title')}
          description={t('seo.matchDetails.description')}
          robots="noindex, nofollow"
        />
        <PageHeader
          eyebrow={t('errors.NOT_FOUND')}
          title={t('matches.notFound')}
          description={translateApiError(matchQuery.error, t, 'matches.detailsLoadError')}
        />
        <button
          type="button"
          onClick={() => void matchQuery.refetch()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const match = matchQuery.data;

  if (!match) {
    return null;
  }

  const participants = match.lineup.filter(
    (lineupPlayer) => lineupPlayer.participationStatus !== 'substitute_unused',
  );

  return (
    <div className="space-y-6">
      <PageMeta
        title={t('seo.matchDetails.title')}
        description={t('seo.matchDetails.description')}
      />
      <PageHeader
        eyebrow={match.competition}
        title={`Manchester United vs ${match.opponentName}`}
        description={`${formatDate(match.matchDate, {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })} - ${match.venue ?? t('matches.venueTbc')}`}
        action={
          <>
            <OpponentLogo
              opponentName={match.opponentName}
              logoUrl={match.opponentLogoUrl}
              size="lg"
            />
            {match.votingStatus === 'open' ? (
              <Link
                to={`/matches/${match.id}/vote`}
                className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
              >
                <Star size={18} aria-hidden="true" />
                {t('common.vote')}
              </Link>
            ) : null}
            {match.resultsPublished ? (
              <Link
                to={`/matches/${match.id}/results`}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-black text-white hover:bg-zinc-800"
              >
                <BarChart3 size={18} aria-hidden="true" />
                {t('common.results')}
              </Link>
            ) : null}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <article className="panel p-5 md:col-span-2">
          <p className="text-sm font-semibold text-zinc-500">{t('common.score')}</p>
          <p className="mt-2 text-4xl font-black text-zinc-950">
            {formatScore(match.manchesterUnitedScore, match.opponentScore, t('common.upcoming'))}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('matches.voteStatus')}</p>
          <div className="mt-3">
            <VoteStatusBadge status={match.votingStatus} />
          </div>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('matches.venue')}</p>
          <p className="mt-2 text-lg font-black text-zinc-950">
            {match.isHome ? t('matches.home') : t('matches.away')}
          </p>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-zinc-950">{t('matches.participants')}</h2>
        {participants.length === 0 ? (
          <div className="panel p-5 text-sm font-semibold text-zinc-600">
            {t('matches.noParticipants')}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {participants.map((lineupPlayer) => (
              <article key={lineupPlayer.id} className="panel flex items-center gap-3 p-4">
                <ApiPlayerAvatar player={lineupPlayer.player} size="sm" />
                <div>
                  <p className="font-black text-zinc-950">{lineupPlayer.player.displayName}</p>
                  <p className="text-sm text-zinc-500">
                    {lineupPlayer.player.position} -{' '}
                    {t('common.minutesShort', {
                      count: formatNumber(lineupPlayer.minutesPlayed),
                    })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
