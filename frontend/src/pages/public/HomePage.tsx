import { ArrowRight, BarChart3, Star, Trophy } from 'lucide-react';
import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  formatDate,
  getStatsWithPlayers,
  matches,
  UNITED_TEAM_NAME,
} from '../../data/mockData';

export function HomePage() {
  const votingMatch = matches.find((match) => match.status === 'voting-open') ?? matches[0];
  const latestMatch = matches.find((match) => match.status === 'completed') ?? matches[0];
  const leaders = getStatsWithPlayers().slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dossier temporaire"
        title={`${UNITED_TEAM_NAME} Player Ratings`}
        description="Un premier frontend pour noter les joueurs apres chaque match, consulter les resultats et suivre le classement de la saison."
        action={
          <Link
            to={`/matches/${votingMatch.id}/vote`}
            className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Star size={18} aria-hidden="true" />
            Noter le match
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Matchs suivis" value={matches.length} helper="Donnees temporaires" />
        <StatCard label="Votes ouverts" value="1" helper="Flux de vote pret cote frontend" />
        <StatCard label="Joueurs classes" value={leaders.length} helper="Stats saison consultables" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="panel overflow-hidden">
          <div className="border-b border-zinc-200 bg-united-black p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-united-gold">
              Match a noter
            </p>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-bold">{UNITED_TEAM_NAME}</h2>
                <p className="mt-2 text-xl text-zinc-200">vs {votingMatch.opponent}</p>
              </div>
              <StatusBadge status={votingMatch.status} />
            </div>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-zinc-500">Competition</p>
              <p className="mt-1 font-semibold text-zinc-950">{votingMatch.competition}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Date</p>
              <p className="mt-1 font-semibold text-zinc-950">{formatDate(votingMatch.date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Lieu</p>
              <p className="mt-1 font-semibold text-zinc-950">{votingMatch.venue}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-zinc-200 px-6 py-4">
            <Link
              to={`/matches/${votingMatch.id}`}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-united-red hover:text-united-red"
            >
              Details
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to={`/matches/${votingMatch.id}/vote`}
              className="inline-flex items-center gap-2 rounded-md bg-united-red px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Voter
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </article>

        <article className="panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Dernier resultat</p>
              <h2 className="mt-2 text-xl font-bold text-zinc-950">
                {UNITED_TEAM_NAME} vs {latestMatch.opponent}
              </h2>
            </div>
            <Trophy className="text-amber-500" size={30} aria-hidden="true" />
          </div>
          <p className="mt-5 text-4xl font-bold text-zinc-950">
            {latestMatch.unitedScore} - {latestMatch.opponentScore}
          </p>
          <p className="mt-2 text-sm text-zinc-500">{formatDate(latestMatch.date)}</p>
          <Link
            to={`/matches/${latestMatch.id}/results`}
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-united-red hover:text-united-red"
          >
            Voir les notes
            <BarChart3 size={16} aria-hidden="true" />
          </Link>
        </article>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="eyebrow">Top saison</p>
            <h2 className="mt-1 text-xl font-bold text-zinc-950">Meilleures moyennes</h2>
          </div>
          <Link to="/season" className="text-sm font-semibold text-united-red hover:text-red-700">
            Classement complet
          </Link>
        </div>
        <div className="divide-y divide-zinc-200">
          {leaders.map((stats, index) => (
            <Link
              key={stats.playerId}
              to={`/players/${stats.playerId}`}
              className="grid gap-3 px-5 py-4 hover:bg-zinc-50 sm:grid-cols-[48px_1fr_120px]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 font-bold text-zinc-700">
                {index + 1}
              </span>
              <span>
                <span className="block font-semibold text-zinc-950">{stats.player.name}</span>
                <span className="text-sm text-zinc-500">
                  {stats.matchesRated} matchs notes, {stats.totalVotes.toLocaleString('fr-FR')} votes
                </span>
              </span>
              <span className="text-2xl font-bold text-united-red">{stats.averageRating.toFixed(1)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
