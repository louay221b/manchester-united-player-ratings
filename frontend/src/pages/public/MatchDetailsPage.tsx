import { BarChart3, Star } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate, getLineupPlayers, getMatchById, UNITED_TEAM_NAME } from '../../data/mockData';

export function MatchDetailsPage() {
  const { matchId } = useParams();
  const match = matchId ? getMatchById(matchId) : undefined;

  if (!match) {
    return <PageHeader title="Match introuvable" description="La fiche demandee n existe pas encore." />;
  }

  const lineup = getLineupPlayers(match);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={match.competition}
        title={`${UNITED_TEAM_NAME} vs ${match.opponent}`}
        description={`${formatDate(match.date)} - ${match.venue}`}
        action={
          <>
            {match.status === 'voting-open' ? (
              <Link
                to={`/matches/${match.id}/vote`}
                className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Star size={18} aria-hidden="true" />
                Voter
              </Link>
            ) : null}
            {match.status === 'completed' ? (
              <Link
                to={`/matches/${match.id}/results`}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
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
          <p className="text-sm font-medium text-zinc-500">Affiche</p>
          <p className="mt-2 text-2xl font-bold text-zinc-950">
            {UNITED_TEAM_NAME} vs {match.opponent}
          </p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-medium text-zinc-500">Statut</p>
          <div className="mt-3">
            <StatusBadge status={match.status} />
          </div>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-medium text-zinc-500">Score</p>
          <p className="mt-2 text-2xl font-bold text-zinc-950">
            {match.status === 'upcoming' ? '-' : `${match.unitedScore} - ${match.opponentScore}`}
          </p>
        </article>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-xl font-bold text-zinc-950">Composition Manchester United</h2>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {lineup.map((player) => (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="rounded-lg border border-zinc-200 p-4 hover:border-united-red hover:bg-red-50/40"
            >
              <p className="font-semibold text-zinc-950">
                #{player.shirtNumber} {player.name}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {player.position} - {player.nationality}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
