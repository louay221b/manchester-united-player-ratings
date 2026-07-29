import { Link, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { PageHeader } from '../../components/PageHeader';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useMatch } from '../../hooks/use-matches';
import { ApiError } from '../../lib/api';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

const formatScore = (unitedScore: number | null, opponentScore: number | null) => {
  if (unitedScore === null || opponentScore === null) {
    return 'A venir';
  }

  return `${unitedScore}-${opponentScore}`;
};

export function AdminMatchVotesPage() {
  const { matchId } = useParams();
  const matchQuery = useMatch(matchId ?? '');

  if (!matchId) {
    return (
      <PageHeader
        eyebrow="Votes"
        title="Match introuvable"
        description="Aucun identifiant de match n a ete fourni."
      />
    );
  }

  if (matchQuery.isLoading) {
    return <div className="panel p-6 text-sm font-semibold text-zinc-600">Chargement...</div>;
  }

  if (matchQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Votes"
          title="Votes introuvables"
          description={getErrorMessage(matchQuery.error, 'Impossible de charger ce match.')}
        />
        <button
          type="button"
          onClick={() => void matchQuery.refetch()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
        >
          Reessayer
        </button>
      </div>
    );
  }

  const match = matchQuery.data;

  if (!match) {
    return null;
  }

  const eligiblePlayers = match.lineup.filter(
    (lineupPlayer) =>
      lineupPlayer.eligibleForRating &&
      (lineupPlayer.participationStatus === 'starter' ||
        lineupPlayer.participationStatus === 'substitute_entered'),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Votes"
        title={`Manchester United vs ${match.opponentName}`}
        description={`${match.competition} - ${formatScore(
          match.manchesterUnitedScore,
          match.opponentScore,
        )}`}
        action={
          <Link
            to="/admin/matches"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            Retour aux matchs
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Statut du match</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">{match.status}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Votes</p>
          <div className="mt-3">
            <VoteStatusBadge status={match.votingStatus} />
          </div>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Resultats publics</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">
            {match.resultsPublished ? 'Publies' : 'Masques'}
          </p>
        </article>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-xl font-black text-zinc-950">Joueurs eligibles au vote</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Les totaux de votes seront connectes lors de l etape du systeme de vote complet.
          </p>
        </div>
        {eligiblePlayers.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">
            Aucun joueur eligible dans cette composition.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="table-head">Joueur</th>
                  <th className="table-head">Statut</th>
                  <th className="table-head">Minutes</th>
                  <th className="table-head">Votes</th>
                  <th className="table-head">Note moyenne</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {eligiblePlayers.map((lineupPlayer) => (
                  <tr key={lineupPlayer.id}>
                    <td className="table-cell">
                      <span className="flex items-center gap-3 font-black text-zinc-950">
                        <ApiPlayerAvatar player={lineupPlayer.player} size="sm" />
                        {lineupPlayer.player.displayName}
                      </span>
                    </td>
                    <td className="table-cell">
                      {lineupPlayer.participationStatus === 'starter'
                        ? 'Titulaire'
                        : 'Remplacant entre'}
                    </td>
                    <td className="table-cell">{lineupPlayer.minutesPlayed} min</td>
                    <td className="table-cell text-zinc-500">A connecter</td>
                    <td className="table-cell text-zinc-500">A connecter</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
