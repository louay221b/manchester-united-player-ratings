import { BarChart3, CalendarDays, Users } from 'lucide-react';
import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { matches, players, seasonStats } from '../../data/mockData';

export function AdminDashboardPage() {
  const totalVotes = seasonStats.reduce((sum, stats) => sum + stats.totalVotes, 0);
  const completedMatches = matches.filter((match) => match.status === 'completed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Tableau de bord"
        description="Vue de pilotage temporaire pour les saisons, joueurs, matchs et votes."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Joueurs" value={players.length} helper="Effectif mocke" />
        <StatCard label="Matchs" value={matches.length} helper={`${completedMatches} termines`} />
        <StatCard label="Votes saison" value={totalVotes.toLocaleString('fr-FR')} helper="Total mocke" />
        <StatCard label="Saison active" value="2026-2027" helper="Config temporaire" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link
          to="/admin/matches"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <CalendarDays className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-bold text-zinc-950">Gerer les matchs</span>
            <span className="mt-1 block text-sm text-zinc-500">
              Creer les fiches, scores et statuts de vote.
            </span>
          </span>
        </Link>
        <Link
          to="/admin/players"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <Users className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-bold text-zinc-950">Gerer les joueurs</span>
            <span className="mt-1 block text-sm text-zinc-500">
              Maintenir l effectif Manchester United.
            </span>
          </span>
        </Link>
        <Link
          to="/admin/season-stats"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <BarChart3 className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-bold text-zinc-950">Stats saison</span>
            <span className="mt-1 block text-sm text-zinc-500">
              Consulter les indicateurs de fin de saison.
            </span>
          </span>
        </Link>
      </section>
    </div>
  );
}
