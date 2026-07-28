import { BarChart3, CalendarDays, Star } from 'lucide-react';
import { Link } from 'react-router';

import { MatchCard } from '../../components/MatchCard';
import { PageHeader } from '../../components/PageHeader';
import { PlayerCard } from '../../components/PlayerCard';
import { StatCard } from '../../components/StatCard';
import {
  activeSeason,
  getSeasonPlayerStats,
  matches,
  UNITED_TEAM_NAME,
  votes,
} from '../../data/mockData';

export function HomePage() {
  const openMatch = matches.find((match) => match.voteStatus === 'open') ?? matches[0];
  const featuredMatches = matches.slice(0, 2);
  const leaders = getSeasonPlayerStats().slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="panel-dark overflow-hidden">
        <div className="grid gap-8 p-6 md:grid-cols-[1fr_320px] md:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-200">
              Donnees temporaires
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-normal text-white md:text-5xl">
              {UNITED_TEAM_NAME} Player Ratings
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              Une base frontend pour noter les joueurs apres chaque match, consulter les resultats
              et suivre une hierarchie de saison calculee depuis les moyennes par match.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/matches/${openMatch.id}/vote`}
                className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
              >
                <Star size={18} aria-hidden="true" />
                Noter le match
              </Link>
              <Link
                to="/ranking"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-black text-white hover:border-white"
              >
                <BarChart3 size={18} aria-hidden="true" />
                Classement
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm font-bold text-zinc-400">Saison active</p>
            <p className="mt-2 text-2xl font-black text-white">{activeSeason.name}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-3xl font-black text-white">{matches.length}</p>
                <p className="text-sm text-zinc-400">matchs</p>
              </div>
              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-3xl font-black text-white">{votes.length}</p>
                <p className="text-sm text-zinc-400">votes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Votes ouverts" value={matches.filter((match) => match.voteStatus === 'open').length} />
        <StatCard label="Joueurs suivis" value={leaders.length} helper="Top public affiche" />
        <StatCard label="Saison" value={activeSeason.name.replace('Saison ', '')} helper="Fixture locale" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <PageHeader
            eyebrow="Matchs"
            title="Affiches recentes"
            description="Manchester United reste l equipe principale, seul l adversaire change."
          />
          <div className="grid gap-4">
            {featuredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-united-red" aria-hidden="true" />
            <h2 className="text-xl font-black text-zinc-950">Top saison</h2>
          </div>
          <div className="grid gap-3">
            {leaders.map((stat) => (
              <PlayerCard key={stat.player.id} player={stat.player} stats={stat} />
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
