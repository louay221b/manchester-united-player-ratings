import { ArrowRight, BarChart3, Star } from 'lucide-react';
import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate, matches, UNITED_TEAM_NAME } from '../../data/mockData';

export function MatchesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendrier"
        title="Liste des matchs"
        description="Manchester United reste l equipe principale. Pour chaque fiche, seul l adversaire change."
      />

      <section className="grid gap-4">
        {matches.map((match) => (
          <article key={match.id} className="panel p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-zinc-950">
                    {UNITED_TEAM_NAME} vs {match.opponent}
                  </h2>
                  <StatusBadge status={match.status} />
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  {match.competition} - {formatDate(match.date)} - {match.venue}
                </p>
                {match.status !== 'upcoming' ? (
                  <p className="mt-3 text-2xl font-bold text-zinc-950">
                    {match.unitedScore} - {match.opponentScore}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/matches/${match.id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-united-red hover:text-united-red"
                >
                  Details
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                {match.status === 'voting-open' ? (
                  <Link
                    to={`/matches/${match.id}/vote`}
                    className="inline-flex items-center gap-2 rounded-md bg-united-red px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Voter
                    <Star size={16} aria-hidden="true" />
                  </Link>
                ) : null}
                {match.status === 'completed' ? (
                  <Link
                    to={`/matches/${match.id}/results`}
                    className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Resultats
                    <BarChart3 size={16} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
