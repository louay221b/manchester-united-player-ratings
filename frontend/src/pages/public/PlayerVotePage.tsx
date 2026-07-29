import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { ManOfTheMatchSelector } from '../../components/voting/ManOfTheMatchSelector';
import { PlayerRatingCard } from '../../components/voting/PlayerRatingCard';
import { VotingProgress } from '../../components/voting/VotingProgress';
import { useVotingBallot, useVotingBallotMutations } from '../../hooks/use-voting-ballot';
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
  const ballotQuery = useVotingBallot(matchId ?? '');
  const { submitBallot } = useVotingBallotMutations();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [manOfTheMatchPlayerId, setManOfTheMatchPlayerId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!ballotQuery.data) {
      return;
    }

    queueMicrotask(() => {
      const existingRatings = Object.fromEntries(
        ballotQuery.data.existingBallot?.ratings.map((rating) => [
          rating.playerId,
          rating.rating,
        ]) ?? [],
      );

      setRatings(existingRatings);
      setManOfTheMatchPlayerId(ballotQuery.data.existingBallot?.manOfTheMatchPlayerId ?? null);
    });
  }, [ballotQuery.data]);

  if (!matchId) {
    return (
      <PageHeader
        eyebrow="Vote"
        title="Match introuvable"
        description="Aucun identifiant de match n a ete fourni."
      />
    );
  }

  if (ballotQuery.isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">Chargement du vote...</div>
    );
  }

  if (ballotQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Vote"
          title="Vote indisponible"
          description={getErrorMessage(
            ballotQuery.error,
            'Ce match n est pas ouvert au vote ou ta session a expire.',
          )}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void ballotQuery.refetch()}
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

  const ballot = ballotQuery.data;

  if (!ballot) {
    return null;
  }

  const isVotingClosed = ballot.match.votingStatus !== 'open';
  const ratedCount = ballot.players.filter((player) => ratings[player.id]).length;
  const hasCompleteRatings = ratedCount === ballot.players.length && ballot.players.length > 0;
  const hasManOfTheMatch = Boolean(manOfTheMatchPlayerId);
  const canSubmit =
    hasCompleteRatings && hasManOfTheMatch && !isVotingClosed && !submitBallot.isPending;
  const hasExistingBallot = Boolean(ballot.existingBallot);

  const handleSubmit = () => {
    if (!canSubmit || !manOfTheMatchPlayerId) {
      return;
    }

    setSubmitError(null);
    setSuccessMessage(null);

    submitBallot.mutate(
      {
        matchId,
        payload: {
          ratings: ballot.players.map((player) => ({
            playerId: player.id,
            rating: ratings[player.id],
          })),
          manOfTheMatchPlayerId,
        },
      },
      {
        onSuccess: () => {
          setSuccessMessage('Vote enregistre avec succes.');
        },
        onError: (error) => {
          setSubmitError(getErrorMessage(error, 'Impossible d enregistrer ton vote.'));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vote supporters"
        title={`Manchester United vs ${ballot.match.opponentName}`}
        description={`${ballot.match.competition} - ${formatDate(ballot.match.matchDate)} - ${formatScore(
          ballot.match.manchesterUnitedScore,
          ballot.match.opponentScore,
        )}`}
      />

      {isVotingClosed ? (
        <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Les votes sont maintenant clotures.
        </div>
      ) : (
        <div className="panel border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Vous pouvez modifier votre vote jusqu a la cloture.
        </div>
      )}

      {successMessage ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          {successMessage}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {submitError}
        </div>
      ) : null}

      <VotingProgress
        ratedCount={ratedCount}
        totalCount={ballot.players.length}
        hasManOfTheMatch={hasManOfTheMatch}
      />

      {ballot.players.length === 0 ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          Aucun joueur eligible au vote pour ce match.
        </div>
      ) : (
        <div className="space-y-4">
          {ballot.players.map((player) => (
            <PlayerRatingCard
              key={player.id}
              player={player}
              rating={ratings[player.id]}
              disabled={isVotingClosed || submitBallot.isPending}
              onChange={(playerId, rating) =>
                setRatings((current) => ({
                  ...current,
                  [playerId]: rating,
                }))
              }
            />
          ))}
        </div>
      )}

      <ManOfTheMatchSelector
        players={ballot.players}
        selectedPlayerId={manOfTheMatchPlayerId}
        disabled={isVotingClosed || submitBallot.isPending}
        onChange={setManOfTheMatchPlayerId}
      />

      {!isVotingClosed ? (
        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-zinc-600">
            {ratedCount}/{ballot.players.length} joueurs notes
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            {submitBallot.isPending
              ? 'Enregistrement...'
              : hasExistingBallot
                ? 'Mettre a jour mon vote'
                : 'Envoyer mon vote'}
          </button>
        </div>
      ) : null}

      <Link
        to={`/matches/${ballot.match.id}`}
        className="text-sm font-black text-united-red hover:text-red-800"
      >
        Retour au match
      </Link>
    </div>
  );
}
