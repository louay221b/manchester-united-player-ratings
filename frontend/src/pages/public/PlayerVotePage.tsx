import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { OpponentLogo } from '../../components/OpponentLogo';
import { PageHeader } from '../../components/PageHeader';
import { PageMeta } from '../../components/PageMeta';
import { ManOfTheMatchSelector } from '../../components/voting/ManOfTheMatchSelector';
import { PlayerRatingCard } from '../../components/voting/PlayerRatingCard';
import { VotingProgress } from '../../components/voting/VotingProgress';
import { useVotingBallot, useVotingBallotMutations } from '../../hooks/use-voting-ballot';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';

export function PlayerVotePage() {
  const { t } = useTranslation();
  const { formatDate, formatNumber, formatScore } = useFormatters();
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
      <>
        <PageMeta
          title={t('seo.vote.title')}
          description={t('seo.vote.description')}
          robots="noindex, nofollow"
        />
        <PageHeader
          eyebrow={t('voting.supporterVote')}
          title={t('matches.notFound')}
          description={t('matches.missingId')}
        />
      </>
    );
  }

  if (ballotQuery.isLoading) {
    return (
      <>
        <PageMeta
          title={t('seo.vote.title')}
          description={t('seo.vote.description')}
          robots="noindex, nofollow"
        />
        <div className="panel p-6 text-sm font-semibold text-zinc-600">{t('voting.loading')}</div>
      </>
    );
  }

  if (ballotQuery.isError) {
    return (
      <div className="space-y-4">
        <PageMeta
          title={t('seo.vote.title')}
          description={t('seo.vote.description')}
          robots="noindex, nofollow"
        />
        <PageHeader
          eyebrow={t('voting.supporterVote')}
          title={t('voting.unavailable')}
          description={translateApiError(ballotQuery.error, t, 'voting.unavailableDescription')}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void ballotQuery.refetch()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            {t('common.retry')}
          </button>
          <Link
            to="/"
            className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            {t('voting.backHome')}
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
          setSuccessMessage(t('voting.success'));
        },
        onError: (error) => {
          setSubmitError(translateApiError(error, t, 'voting.submitError'));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={t('seo.vote.title')}
        description={t('seo.vote.description')}
        robots="noindex, nofollow"
      />
      <PageHeader
        eyebrow={t('voting.supporterVote')}
        title={`Manchester United vs ${ballot.match.opponentName}`}
        description={`${ballot.match.competition} - ${formatDate(ballot.match.matchDate, {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })} - ${formatScore(
          ballot.match.manchesterUnitedScore,
          ballot.match.opponentScore,
          t('matches.resultUnavailable'),
        )}`}
        action={
          <OpponentLogo
            opponentName={ballot.match.opponentName}
            logoUrl={ballot.match.opponentLogoUrl}
            size="lg"
          />
        }
      />

      {isVotingClosed ? (
        <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {t('voting.closedNotice')}
        </div>
      ) : (
        <div className="panel border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {t('voting.openNotice')}
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
          {t('voting.noEligiblePlayers')}
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
            {t('voting.progressPlayers', {
              rated: formatNumber(ratedCount),
              total: formatNumber(ballot.players.length),
            })}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            {submitBallot.isPending
              ? t('voting.saving')
              : hasExistingBallot
                ? t('voting.update')
                : t('voting.submit')}
          </button>
        </div>
      ) : null}

      <Link
        to={`/matches/${ballot.match.id}`}
        className="text-sm font-black text-united-red hover:text-red-800"
      >
        {t('voting.backToMatch')}
      </Link>
    </div>
  );
}
