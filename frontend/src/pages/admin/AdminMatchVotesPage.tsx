import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { PageHeader } from '../../components/PageHeader';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useAdminMatchResults } from '../../hooks/use-match-results';
import { useMatch, useMatchMutations } from '../../hooks/use-matches';
import { ApiError } from '../../lib/api';
import type { MatchResultRow } from '../../types/match';
import { isUuid } from '../../utils/uuid';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

const formatRating = (rating: number | null) => (rating === null ? '-' : rating.toFixed(2));
const invalidMatchMessage = 'Sélectionnez d’abord un match.';

function AdminRankingRow({
  row,
  isManOfTheMatch,
}: {
  row: MatchResultRow;
  isManOfTheMatch: boolean;
}) {
  return (
    <tr>
      <td className="table-cell font-black text-zinc-950">#{row.rank}</td>
      <td className="table-cell">
        <span className="flex items-center gap-3 font-black text-zinc-950">
          <ApiPlayerAvatar player={row} size="sm" />
          {row.displayName}
        </span>
      </td>
      <td className="table-cell">{row.position}</td>
      <td className="table-cell">{row.votesCount}</td>
      <td className="table-cell text-lg font-black text-united-red">
        {formatRating(row.averageRating)}
      </td>
      <td className="table-cell">{row.manOfTheMatchVotes}</td>
      <td className="table-cell">{isManOfTheMatch ? 'Oui' : '-'}</td>
    </tr>
  );
}

export function AdminMatchVotesPage() {
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
        state: { message: invalidMatchMessage },
      });
    }
  }, [hasValidMatchId, navigate]);

  if (!hasValidMatchId) {
    return (
      <PageHeader
        eyebrow="Votes"
        title={invalidMatchMessage}
        description="Retour vers la liste des matchs."
      />
    );
  }

  if (resultsQuery.isLoading || matchQuery.isLoading) {
    return <div className="panel p-6 text-sm font-semibold text-zinc-600">Chargement...</div>;
  }

  if (resultsQuery.isError || matchQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Votes"
          title="Votes introuvables"
          description={getErrorMessage(
            resultsQuery.error ?? matchQuery.error,
            'Impossible de charger les resultats.',
          )}
        />
        <button
          type="button"
          onClick={() => void resultsQuery.refetch()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
        >
          Reessayer
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
    fallbackError: string,
  ) => {
    setNotification(null);
    mutate(safeMatchId, {
      onSuccess: () => {
        setNotification({ type: 'success', message: successMessage });
      },
      onError: (error) => {
        setNotification({ type: 'error', message: getErrorMessage(error, fallbackError) });
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Votes"
        title={`Manchester United vs ${results.match.opponentName}`}
        description={
          isScheduled
            ? 'Les votes ne sont pas encore ouverts.'
            : `${results.summary.usersWhoVoted} utilisateurs ont vote, ${results.summary.ratingsCount} notes au total.`
        }
        action={
          <Link
            to="/admin/matches"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            Retour aux matchs
          </Link>
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
          <p className="text-sm font-semibold text-zinc-500">Votes</p>
          <div className="mt-3">
            <VoteStatusBadge status={results.match.votingStatus} />
          </div>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Utilisateurs</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{results.summary.usersWhoVoted}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Notes</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{results.summary.ratingsCount}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Publication</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {results.match.resultsPublished ? 'Publies' : 'Masques'}
          </p>
        </article>
      </section>

      {isScheduled ? (
        <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Les votes ne sont pas encore ouverts.
        </div>
      ) : null}

      {!isScheduled && results.match.votingStatus === 'open' && !hasVotes ? (
        <div className="panel p-4 text-sm font-semibold text-zinc-600">
          Aucun utilisateur n’a encore voté.
        </div>
      ) : null}

      <section className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-end">
        {results.match.votingStatus === 'open' ? (
          <button
            type="button"
            onClick={() =>
              handleMutation(
                closeMatchVoting.mutate,
                'Votes clotures.',
                'Impossible de cloturer les votes.',
              )
            }
            className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={closeMatchVoting.isPending}
          >
            Cloturer les votes
          </button>
        ) : null}

        {results.match.votingStatus === 'completed' && !results.match.resultsPublished ? (
          <button
            type="button"
            onClick={() =>
              handleMutation(
                publishMatchResults.mutate,
                'Resultats publies.',
                'Impossible de publier les resultats.',
              )
            }
            className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={publishMatchResults.isPending}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Publier
          </button>
        ) : null}

        {results.match.resultsPublished ? (
          <button
            type="button"
            onClick={() =>
              handleMutation(
                unpublishMatchResults.mutate,
                'Resultats masques.',
                'Impossible de masquer les resultats.',
              )
            }
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
            disabled={unpublishMatchResults.isPending}
          >
            <EyeOff className="h-4 w-4" aria-hidden="true" />
            Masquer
          </button>
        ) : null}
      </section>

      {shouldShowAggregates || results.match.votingStatus === 'completed' ? (
        <section className="panel p-5">
          <h2 className="text-xl font-black text-zinc-950">Homme du match</h2>
          {results.manOfTheMatch.length === 0 ? (
            <p className="mt-3 text-sm font-semibold text-zinc-600">
              Aucune selection pour le moment.
            </p>
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
                      {player.selections} selection{player.selections > 1 ? 's' : ''}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
          {results.manOfTheMatch.length > 1 ? (
            <p className="mt-3 text-sm font-semibold text-amber-700">Egalite homme du match.</p>
          ) : null}
        </section>
      ) : null}

      {shouldShowAggregates || results.match.votingStatus === 'completed' ? (
        <section className="panel overflow-hidden">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-xl font-black text-zinc-950">Classement</h2>
          </div>
          {results.summary.ratingsCount === 0 ? (
            <div className="p-6 text-sm font-semibold text-zinc-600">Aucun vote enregistre.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="table-head">Rang</th>
                    <th className="table-head">Joueur</th>
                    <th className="table-head">Poste</th>
                    <th className="table-head">Votes</th>
                    <th className="table-head">Moyenne</th>
                    <th className="table-head">MOTM</th>
                    <th className="table-head">Ex aequo</th>
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
