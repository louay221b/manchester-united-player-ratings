import { useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { StatCard } from '../../components/StatCard';
import {
  formatRating,
  formatScore,
  getPlayerById,
  getPlayerSeasonStats,
  getRecentResultsForPlayer,
  UNITED_TEAM_NAME,
} from '../../data/mockData';

export function PlayerProfilePage() {
  const { playerId } = useParams();
  const player = playerId ? getPlayerById(playerId) : undefined;

  if (!player) {
    return (
      <PageHeader
        eyebrow="Joueur"
        title="Joueur introuvable"
        description="Le profil demande n existe pas dans les fixtures locales."
      />
    );
  }

  const stats = getPlayerSeasonStats(player.id);
  const recentResults = getRecentResultsForPlayer(player.id);

  return (
    <div className="space-y-6">
      <section className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <PlayerAvatar player={player} size="lg" />
        <div>
          <p className="eyebrow">{UNITED_TEAM_NAME}</p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">
            #{player.shirtNumber} {player.displayName}
          </h1>
          <p className="mt-2 text-zinc-600">
            {player.position} - {player.nationality} - pied {player.preferredFoot}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard label="Matchs joues" value={stats?.matchesPlayed ?? 0} />
        <StatCard label="Matchs notes" value={stats?.matchesRated ?? 0} />
        <StatCard label="Votes" value={stats?.totalVotes ?? 0} />
        <StatCard label="Moyenne saison" value={formatRating(stats?.seasonAverage ?? null)} />
        <StatCard label="Homme du match" value={stats?.manOfTheMatchAwards ?? 0} />
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-xl font-black text-zinc-950">Notes par match</h2>
        </div>
        <div className="divide-y divide-zinc-200">
          {recentResults.map(({ match, result }) => (
            <article key={match.id} className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_120px_120px]">
              <div>
                <p className="font-black text-zinc-950">
                  {UNITED_TEAM_NAME} vs {match.opponent}
                </p>
                <p className="text-sm text-zinc-500">{formatScore(match)}</p>
              </div>
              <p className="text-sm font-semibold text-zinc-600">{result.totalVotes} votes</p>
              <p className="text-xl font-black text-united-red">
                {formatRating(result.averageRating)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
