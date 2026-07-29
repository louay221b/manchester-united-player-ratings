import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { PageHeader } from '../../components/PageHeader';
import { RatingInput } from '../../components/RatingInput';
import { useVotingMatch } from '../../hooks/use-voting-matches';
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
    return 'Score indisponible';
  }

  return `${unitedScore}-${opponentScore}`;
};

export function PlayerVotePage() {
  const { matchId } = useParams();
  const votingMatchQuery = useVotingMatch(matchId ?? '');
  const [ratings, setRatings] = useState<Record<string, number>>({});

  if (!matchId) {
    return (
      <PageHeader
        eyebrow="Vote"
        title="Match introuvable"
        description="Aucun identifiant de match n a ete fourni."
      />
    );
  }

  if (votingMatchQuery.isLoading) {
    return <div className="panel p-6 text-sm font-semibold text-zinc-600">Chargement du vote...</div>;
  }

  if (votingMatchQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Vote"
          title="Vote indisponible"
          description={getErrorMessage(
            votingMatchQuery.error,
            'Ce match n est pas ouvert au vote ou ta session a expire.',
          )}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void votingMatchQuery.refetch()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            Reessayer
          </button>
          <Link
            to="/"
            className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            Retour accueil
          </Link>
        </div>
      </div>
    );
  }

  const votingMatch = votingMatchQuery.data;

  if (!votingMatch) {
    return null;
  }

  const { match, eligiblePlayers } = votingMatch;
  const allRated =
    eligiblePlayers.length > 0 && eligiblePlayers.every((lineupPlayer) => ratings[lineupPlayer.playerId]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vote supporters"
        title={`Manchester United vs ${match.opponentName}`}
        description={`${match.competition} - ${formatDate(match.matchDate)} - ${formatScore(
          match.manchesterUnitedScore,
          match.opponentScore,
        )}`}
      />

      <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        Interface preparee pour les votes. L enregistrement sera connecte lors de l etape vote complet.
      </div>

      {eligiblePlayers.length === 0 ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          Aucun joueur eligible au vote pour ce match.
        </div>
      ) : (
        <form className="space-y-4">
          {eligiblePlayers.map((lineupPlayer) => (
            <section key={lineupPlayer.id} className="panel p-5">
              <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-center">
                <div className="flex items-center gap-4">
                  <ApiPlayerAvatar player={lineupPlayer.player} />
                  <div>
                    <p className="font-black text-zinc-950">
                      {lineupPlayer.player.shirtNumber ? `#${lineupPlayer.player.shirtNumber} ` : ''}
                      {lineupPlayer.player.displayName}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">{lineupPlayer.player.position}</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-600">
                      {lineupPlayer.participationStatus === 'starter'
                        ? 'Titulaire'
                        : 'Remplacant entre'}{' '}
                      - {lineupPlayer.minutesPlayed} min
                    </p>
                  </div>
                </div>
                <RatingInput
                  value={ratings[lineupPlayer.playerId]}
                  onChange={(rating) =>
                    setRatings((current) => ({
                      ...current,
                      [lineupPlayer.playerId]: rating,
                    }))
                  }
                />
              </div>
            </section>
          ))}

          <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-zinc-600">
              {Object.keys(ratings).length}/{eligiblePlayers.length} joueurs notes
            </p>
            <button
              type="button"
              disabled={!allRated}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              Envoyer plus tard
            </button>
          </div>
        </form>
      )}

      <Link to={`/matches/${match.id}`} className="text-sm font-black text-united-red hover:text-red-800">
        Retour au match
      </Link>
    </div>
  );
}
