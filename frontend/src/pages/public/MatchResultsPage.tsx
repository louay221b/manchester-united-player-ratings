import { Link, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { PageHeader } from '../../components/PageHeader';
import { useMatchResults } from '../../hooks/use-match-results';
import { ApiError } from '../../lib/api';
import type { MatchResultRow } from '../../types/match';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));

const formatRating = (rating: number | null) => (rating === null ? '-' : rating.toFixed(2));

function RankingRow({ row, isManOfTheMatch }: { row: MatchResultRow; isManOfTheMatch: boolean }) {
  return (
    <tr>
      <td className="table-cell font-black text-zinc-950">#{row.rank}</td>
      <td className="table-cell">
        <Link
          to={`/players/${row.playerId}`}
          className="flex items-center gap-3 font-black text-zinc-950 hover:text-united-red"
        >
          <ApiPlayerAvatar player={row} size="sm" />
          {row.displayName}
        </Link>
      </td>
      <td className="table-cell">{row.position}</td>
      <td className="table-cell">{row.votesCount}</td>
      <td className="table-cell text-lg font-black text-united-red">
        {formatRating(row.averageRating)}
      </td>
      <td className="table-cell">{isManOfTheMatch ? 'Homme du match' : '-'}</td>
    </tr>
  );
}

export function MatchResultsPage() {
  const { matchId } = useParams();
  const resultsQuery = useMatchResults(matchId ?? '');

  if (!matchId) {
    return (
      <PageHeader
        eyebrow="Resultats"
        title="Match introuvable"
        description="Aucun identifiant de match n a ete fourni."
      />
    );
  }

  if (resultsQuery.isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">
        Chargement des resultats...
      </div>
    );
  }

  if (resultsQuery.isError) {
    const unpublished =
      resultsQuery.error instanceof ApiError && resultsQuery.error.code === 'RESULTS_NOT_PUBLISHED';

    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Resultats"
          title={unpublished ? 'Resultats non publies' : 'Resultats indisponibles'}
          description={
            unpublished
              ? 'Les resultats ne sont pas encore publies.'
              : getErrorMessage(resultsQuery.error, 'Impossible de charger les resultats.')
          }
        />
        {!unpublished ? (
          <button
            type="button"
            onClick={() => void resultsQuery.refetch()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            Reessayer
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
        eyebrow="Resultats"
        title={`Manchester United vs ${results.match.opponentName}`}
        description={`${results.match.competition} - ${formatDate(results.match.matchDate)} - ${results.match.manchesterUnitedScore}-${results.match.opponentScore}`}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Utilisateurs votants</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{results.summary.usersWhoVoted}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Notes recues</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{results.summary.ratingsCount}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Joueurs eligibles</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">
            {results.summary.eligiblePlayers}
          </p>
        </article>
      </section>

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

      <section className="panel overflow-hidden">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-xl font-black text-zinc-950">Classement des joueurs</h2>
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
                  <th className="table-head">Distinction</th>
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
