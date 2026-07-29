import { BarChart3, Star } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { PageHeader } from '../../components/PageHeader';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useMatch } from '../../hooks/use-matches';
import { ApiError } from '../../lib/api';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

const formatScore = (unitedScore: number | null, opponentScore: number | null) => {
  if (unitedScore === null || opponentScore === null) {
    return 'A venir';
  }

  return `${unitedScore}-${opponentScore}`;
};

export function MatchDetailsPage() {
  const { matchId } = useParams();
  const matchQuery = useMatch(matchId ?? '');

  if (!matchId) {
    return (
      <PageHeader
        eyebrow="Erreur"
        title="Match introuvable"
        description="Aucun identifiant de match n a ete fourni."
      />
    );
  }

  if (matchQuery.isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">Chargement du match...</div>
    );
  }

  if (matchQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Erreur"
          title="Match introuvable"
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

  const participants = match.lineup.filter(
    (lineupPlayer) => lineupPlayer.participationStatus !== 'substitute_unused',
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={match.competition}
        title={`Manchester United vs ${match.opponentName}`}
        description={`${formatDate(match.matchDate)} - ${match.venue ?? 'Lieu a confirmer'}`}
        action={
          <>
            {match.votingStatus === 'open' ? (
              <Link
                to={`/matches/${match.id}/vote`}
                className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
              >
                <Star size={18} aria-hidden="true" />
                Voter
              </Link>
            ) : null}
            {match.resultsPublished ? (
              <Link
                to={`/matches/${match.id}/results`}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-black text-white hover:bg-zinc-800"
              >
                <BarChart3 size={18} aria-hidden="true" />
                Resultats
              </Link>
            ) : null}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <article className="panel p-5 md:col-span-2">
          <p className="text-sm font-semibold text-zinc-500">Score</p>
          <p className="mt-2 text-4xl font-black text-zinc-950">
            {formatScore(match.manchesterUnitedScore, match.opponentScore)}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Statut votes</p>
          <div className="mt-3">
            <VoteStatusBadge status={match.votingStatus} />
          </div>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Lieu</p>
          <p className="mt-2 text-lg font-black text-zinc-950">
            {match.isHome ? 'Domicile' : 'Exterieur'}
          </p>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-zinc-950">Joueurs participants</h2>
        {participants.length === 0 ? (
          <div className="panel p-5 text-sm font-semibold text-zinc-600">
            La composition participante n est pas encore definie.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {participants.map((lineupPlayer) => (
              <article key={lineupPlayer.id} className="panel flex items-center gap-3 p-4">
                <ApiPlayerAvatar player={lineupPlayer.player} size="sm" />
                <div>
                  <p className="font-black text-zinc-950">{lineupPlayer.player.displayName}</p>
                  <p className="text-sm text-zinc-500">
                    {lineupPlayer.player.position} - {lineupPlayer.minutesPlayed} min
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
