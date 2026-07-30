import { ArrowRight, BarChart3, Star } from 'lucide-react';
import { Link } from 'react-router';

import { OpponentLogo } from '../../components/OpponentLogo';
import { PageHeader } from '../../components/PageHeader';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useMatches } from '../../hooks/use-matches';
import { ApiError } from '../../lib/api';
import type { Match } from '../../types/match';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

const formatScore = (match: Match) => {
  if (match.manchesterUnitedScore === null || match.opponentScore === null) {
    return 'A venir';
  }

  return `${match.manchesterUnitedScore}-${match.opponentScore}`;
};

function ApiMatchCard({ match }: { match: Match }) {
  return (
    <article className="panel overflow-hidden">
      <div className="border-b border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">{match.competition}</p>
            <div className="mt-2 flex items-center gap-3">
              <OpponentLogo
                opponentName={match.opponentName}
                logoUrl={match.opponentLogoUrl}
                size="md"
              />
              <h2 className="text-xl font-black text-zinc-950">
                Manchester United vs {match.opponentName}
              </h2>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {formatDate(match.matchDate)} - {match.venue ?? 'Lieu a confirmer'}
            </p>
          </div>
          <VoteStatusBadge status={match.votingStatus} />
        </div>
        <p className="mt-4 text-3xl font-black text-zinc-950">{formatScore(match)}</p>
      </div>
      <div className="flex flex-wrap gap-2 bg-zinc-50 px-5 py-4">
        <Link
          to={`/matches/${match.id}`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-700 hover:border-united-red hover:text-united-red"
        >
          Details
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        {match.votingStatus === 'open' ? (
          <Link
            to={`/matches/${match.id}/vote`}
            className="inline-flex items-center gap-2 rounded-md bg-united-red px-3 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            Voter
            <Star size={16} aria-hidden="true" />
          </Link>
        ) : null}
        {match.resultsPublished ? (
          <Link
            to={`/matches/${match.id}/results`}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
          >
            Resultats
            <BarChart3 size={16} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function MatchesPage() {
  const matchesQuery = useMatches({ page: 1, limit: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendrier"
        title="Liste des matchs"
        description="Manchester United reste l equipe principale. Les votes s ouvrent quand un match est termine."
      />

      {matchesQuery.isLoading ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          Chargement des matchs...
        </div>
      ) : null}

      {matchesQuery.isError ? (
        <div className="space-y-3">
          <div className="panel p-6 text-sm font-semibold text-red-700">
            {getErrorMessage(matchesQuery.error, 'Impossible de charger les matchs.')}
          </div>
          <button
            type="button"
            onClick={() => void matchesQuery.refetch()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            Reessayer
          </button>
        </div>
      ) : null}

      {matchesQuery.isSuccess && matchesQuery.data.data.length === 0 ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">Aucun match cree.</div>
      ) : null}

      {matchesQuery.isSuccess && matchesQuery.data.data.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {matchesQuery.data.data.map((match) => (
            <ApiMatchCard key={match.id} match={match} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
