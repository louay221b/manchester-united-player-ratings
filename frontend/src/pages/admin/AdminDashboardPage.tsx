import { BarChart3, CalendarDays, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { activeSeason, getSeasonPlayerStats, matches, players, votes } from '../../data/mockData';

export function AdminDashboardPage() {
  const leader = getSeasonPlayerStats()[0];
  const openVotes = matches.filter((match) => match.voteStatus === 'open').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Tableau de bord"
        description="Vue temporaire pour piloter les saisons, les joueurs, les matchs et les votes."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Saison active" value={activeSeason.name.replace('Saison ', '')} />
        <StatCard label="Joueurs" value={players.length} />
        <StatCard label="Matchs" value={matches.length} />
        <StatCard label="Votes" value={votes.length} helper={`${openVotes} matchs ouverts`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <Link
          to="/admin/matches"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <CalendarDays className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">Matchs</span>
            <span className="mt-1 block text-sm text-zinc-500">Scores, statuts et adversaires.</span>
          </span>
        </Link>
        <Link
          to="/admin/players"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <Users className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">Joueurs</span>
            <span className="mt-1 block text-sm text-zinc-500">Effectif Manchester United.</span>
          </span>
        </Link>
        <Link
          to="/admin/statistics"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <BarChart3 className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">Statistiques</span>
            <span className="mt-1 block text-sm text-zinc-500">Moyennes de saison calculees.</span>
          </span>
        </Link>
        <article className="panel flex items-start gap-4 p-5">
          <Trophy className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">{leader?.player.displayName ?? '-'}</span>
            <span className="mt-1 block text-sm text-zinc-500">Leader actuel</span>
          </span>
        </article>
      </section>
    </div>
  );
}
