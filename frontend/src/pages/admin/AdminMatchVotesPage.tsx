import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { OpponentLogo } from '../../components/OpponentLogo';
import { PageHeader } from '../../components/PageHeader';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useAdminMatchResults } from '../../hooks/use-match-results';
import { useMatch, useMatchMutations } from '../../hooks/use-matches';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import type { MatchResultRow } from '../../types/match';
import { isUuid } from '../../utils/uuid';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

function AdminRankingRow({
  row,
  isManOfTheMatch,
}: {
  row: MatchResultRow;
  isManOfTheMatch: boolean;
}) {
  const { t } = useTranslation();
  const { formatNumber, formatRating } = useFormatters();

  return (
    <tr>
      <td className="table-cell font-black text-zinc-950">#{formatNumber(row.rank)}</td>
      <td className="table-cell">
        <span className="flex items-center gap-3 font-black text-zinc-950">
          <ApiPlayerAvatar player={row} size="sm" />
          {row.displayName}
        </span>
      </td>
      <td className="table-cell">
        {t(`positions.${row.position}`, { defaultValue: row.position })}
      </td>
      <td className="table-cell">{formatNumber(row.votesCount)}</td>
      <td className="table-cell text-lg font-black text-united-red">
        {formatRating(row.averageRating, t('common.dash'))}
      </td>
      <td className="table-cell">{formatNumber(row.manOfTheMatchVotes)}</td>
      <td className="table-cell">{isManOfTheMatch ? t('common.yes') : '-'}</td>
    </tr>
  );
}

export function AdminMatchVotesPage() {
  const { t } = useTranslation();
  const { formatNumber } = useFormatters();
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const hasValidMatchId = isUuid(matchId);
  const safeMatchId = hasValidMatchId ? matchId : '';
  const matchQuery = useMatch(safeMatchId);
  const resultsQuery = useAdminMatchResults(safeMatchId);
  const { closeMatchVoting, publishMatchResults, unpublishMatchResults } = useMatchMutations();
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!hasValidMatchId) {
      navigate('/admin/matches', {
        replace: true,
        state: { message: t('admin.votes.invalidMatch') },
      });
    }
  }, [hasValidMatchId, navigate, t]);

  if (!hasValidMatchId) {
    return (
      <PageHeader
        eyebrow={t('admin.votes.title')}
        title={t('admin.votes.invalidMatch')}
        description={t('admin.votes.backDescription')}
      />
    );
  }

  if (resultsQuery.isLoading || matchQuery.isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">{t('common.loading')}</div>
    );
  }

  if (resultsQuery.isError || matchQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow={t('admin.votes.title')}
          title={t('admin.votes.notFound')}
          description={translateApiError(
            resultsQuery.error ?? matchQuery.error,
            t,
            'admin.votes.loadError',
          )}
        />
        <button
          type="button"
          onClick={() => void resultsQuery.refetch()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const results = resultsQuery.data;
  const match = matchQuery.data;

  if (!results || !match) {
    return null;
  }

  const manOfTheMatchIds = new Set(results.manOfTheMatch.map((player) => player.playerId));
  const isScheduled = match.status === 'scheduled';
  const hasVotes = results.summary.usersWhoVoted > 0 && results.summary.ratingsCount > 0;
  const shouldShowAggregates = !isScheduled && hasVotes;

  const handleMutation = (
    mutate: (
      matchId: string,
      callbacks: { onSuccess: () => void; onError: (error: unknown) => void },
    ) => void,
    successMessage: string,
    fallbackErrorKey: string,
  ) => {
    setNotification(null);
    mutate(safeMatchId, {
      onSuccess: () => {
        setNotification({ type: 'success', message: successMessage });
      },
      onError: (error) => {
        setNotification({ type: 'error', message: translateApiError(error, t, fallbackErrorKey) });
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('admin.votes.title')}
        title={`Manchester United vs ${results.match.opponentName}`}
        description={
          isScheduled
            ? t('admin.votes.notOpen')
            : t('admin.votes.summary', {
                users: formatNumber(results.summary.usersWhoVoted),
                ratings: formatNumber(results.summary.ratingsCount),
              })
        }
        action={
          <>
            <OpponentLogo
              opponentName={results.match.opponentName}
              logoUrl={results.match.opponentLogoUrl}
              size="md"
            />
            <Link
              to="/admin/matches"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
            >
              {t('admin.lineup.backToMatches')}
            </Link>
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

      <section className="grid gap-4 md:grid-cols-4">
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('admin.votes.title')}</p>
          <div className="mt-3">
            <VoteStatusBadge status={results.match.votingStatus} />
          </div>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('admin.votes.users')}</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">
            {formatNumber(results.summary.usersWhoVoted)}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('admin.votes.ratings')}</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">
            {formatNumber(results.summary.ratingsCount)}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('admin.votes.publication')}</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {results.match.resultsPublished ? t('common.published') : t('common.hidden')}
          </p>
        </article>
      </section>

      {isScheduled ? (
        <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {t('admin.votes.notOpen')}
        </div>
      ) : null}

      {!isScheduled && results.match.votingStatus === 'open' && !hasVotes ? (
        <div className="panel p-4 text-sm font-semibold text-zinc-600">
          {t('admin.votes.noVotesYet')}
        </div>
      ) : null}

      <section className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-end">
        {results.match.votingStatus === 'open' ? (
          <button
            type="button"
            onClick={() =>
              handleMutation(
                closeMatchVoting.mutate,
                t('admin.matches.votingClosed'),
                'admin.matches.closeVotingFailed',
              )
            }
            className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={closeMatchVoting.isPending}
          >
            {t('admin.matches.closeVoting')}
          </button>
        ) : null}

        {results.match.votingStatus === 'completed' && !results.match.resultsPublished ? (
          <button
            type="button"
            onClick={() =>
              handleMutation(
                publishMatchResults.mutate,
                t('admin.matches.resultsPublished'),
                'admin.matches.publishResultsFailed',
              )
            }
            className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={publishMatchResults.isPending}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            {t('common.publish')}
          </button>
        ) : null}

        {results.match.resultsPublished ? (
          <button
            type="button"
            onClick={() =>
              handleMutation(
                unpublishMatchResults.mutate,
                t('admin.matches.resultsHidden'),
                'admin.matches.hideResultsFailed',
              )
            }
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
            disabled={unpublishMatchResults.isPending}
          >
            <EyeOff className="h-4 w-4" aria-hidden="true" />
            {t('common.hide')}
          </button>
        ) : null}
      </section>

      {shouldShowAggregates || results.match.votingStatus === 'completed' ? (
        <section className="panel p-5">
          <h2 className="text-xl font-black text-zinc-950">{t('results.manOfTheMatch')}</h2>
          {results.manOfTheMatch.length === 0 ? (
            <p className="mt-3 text-sm font-semibold text-zinc-600">{t('results.noSelection')}</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {results.manOfTheMatch.map((player) => (
                <article
                  key={player.playerId}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3"
                >
                  <ApiPlayerAvatar player={player} size="sm" />
                  <div>
                    <p className="font-black text-zinc-950">{player.displayName}</p>
                    <p className="text-sm text-zinc-500">
                      {t('results.selection', { count: player.selections })}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
          {results.manOfTheMatch.length > 1 ? (
            <p className="mt-3 text-sm font-semibold text-amber-700">{t('results.tie')}</p>
          ) : null}
        </section>
      ) : null}

      {shouldShowAggregates || results.match.votingStatus === 'completed' ? (
        <section className="panel overflow-hidden">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-xl font-black text-zinc-950">{t('ranking.title')}</h2>
          </div>
          {results.summary.ratingsCount === 0 ? (
            <div className="p-6 text-sm font-semibold text-zinc-600">{t('results.noVotes')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="table-head">{t('ranking.rank')}</th>
                    <th className="table-head">{t('players.player')}</th>
                    <th className="table-head">{t('players.position')}</th>
                    <th className="table-head">{t('ranking.totalVotes')}</th>
                    <th className="table-head">{t('ranking.averageRating')}</th>
                    <th className="table-head">{t('admin.votes.motm')}</th>
                    <th className="table-head">{t('admin.votes.tie')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {results.ranking.map((row) => (
                    <AdminRankingRow
                      key={row.playerId}
                      row={row}
                      isManOfTheMatch={manOfTheMatchIds.has(row.playerId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
