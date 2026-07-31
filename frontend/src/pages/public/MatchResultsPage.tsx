import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { OpponentLogo } from '../../components/OpponentLogo';
import { PageHeader } from '../../components/PageHeader';
import { useMatchResults } from '../../hooks/use-match-results';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import { ApiError } from '../../lib/api';
import type { MatchResultRow } from '../../types/match';

function RankingRow({ row, isManOfTheMatch }: { row: MatchResultRow; isManOfTheMatch: boolean }) {
  const { t } = useTranslation();
  const { formatNumber, formatRating } = useFormatters();

  return (
    <tr>
      <td className="table-cell font-black text-zinc-950">#{formatNumber(row.rank)}</td>
      <td className="table-cell">
        <Link
          to={`/players/${row.playerId}`}
          className="flex items-center gap-3 font-black text-zinc-950 hover:text-united-red"
        >
          <ApiPlayerAvatar player={row} size="sm" />
          {row.displayName}
        </Link>
      </td>
      <td className="table-cell">
        {t(`positions.${row.position}`, { defaultValue: row.position })}
      </td>
      <td className="table-cell">{formatNumber(row.votesCount)}</td>
      <td className="table-cell text-lg font-black text-united-red">
        {formatRating(row.averageRating, t('common.dash'))}
      </td>
      <td className="table-cell">{isManOfTheMatch ? t('results.manOfTheMatch') : '-'}</td>
    </tr>
  );
}

export function MatchResultsPage() {
  const { t } = useTranslation();
  const { formatDate, formatNumber, formatScore } = useFormatters();
  const { matchId } = useParams();
  const resultsQuery = useMatchResults(matchId ?? '');

  if (!matchId) {
    return (
      <PageHeader
        eyebrow={t('results.title')}
        title={t('matches.notFound')}
        description={t('matches.missingId')}
      />
    );
  }

  if (resultsQuery.isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">{t('results.loading')}</div>
    );
  }

  if (resultsQuery.isError) {
    const unpublished =
      resultsQuery.error instanceof ApiError && resultsQuery.error.code === 'RESULTS_NOT_PUBLISHED';

    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow={t('results.title')}
          title={unpublished ? t('results.unpublished') : t('results.unavailable')}
          description={
            unpublished
              ? t('results.unpublishedDescription')
              : translateApiError(resultsQuery.error, t, 'results.loadError')
          }
        />
        {!unpublished ? (
          <button
            type="button"
            onClick={() => void resultsQuery.refetch()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            {t('common.retry')}
          </button>
        ) : null}
      </div>
    );
  }

  const results = resultsQuery.data;

  if (!results) {
    return null;
  }

  const manOfTheMatchIds = new Set(results.manOfTheMatch.map((player) => player.playerId));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('results.title')}
        title={`Manchester United vs ${results.match.opponentName}`}
        description={`${results.match.competition} - ${formatDate(results.match.matchDate, {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })} - ${formatScore(
          results.match.manchesterUnitedScore,
          results.match.opponentScore,
          t('matches.resultUnavailable'),
        )}`}
        action={
          <OpponentLogo
            opponentName={results.match.opponentName}
            logoUrl={results.match.opponentLogoUrl}
            size="lg"
          />
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('results.votingUsers')}</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">
            {formatNumber(results.summary.usersWhoVoted)}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('results.ratingsReceived')}</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">
            {formatNumber(results.summary.ratingsCount)}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">{t('results.eligiblePlayers')}</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">
            {formatNumber(results.summary.eligiblePlayers)}
          </p>
        </article>
      </section>

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

      <section className="panel overflow-hidden">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-xl font-black text-zinc-950">{t('results.playersRanking')}</h2>
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
                  <th className="table-head">{t('results.distinction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {results.ranking.map((row) => (
                  <RankingRow
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
    </div>
  );
}
