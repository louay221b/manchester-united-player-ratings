import { useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import {
  getMatchById,
  getPlayerById,
  matchRatings,
  seasonStats,
  UNITED_TEAM_NAME,
} from '../../data/mockData';

export function PlayerProfilePage() {
  const { playerId } = useParams();
  const player = playerId ? getPlayerById(playerId) : undefined;

  if (!player) {
    return <PageHeader title="Joueur introuvable" description="Le profil demande n existe pas." />;
  }

  const stats = seasonStats.find((item) => item.playerId === player.id);
  const recentRatings = matchRatings
    .filter((rating) => rating.playerId === player.id)
    .map((rating) => ({ ...rating, match: getMatchById(rating.matchId) }))
    .filter((rating) => rating.match);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={UNITED_TEAM_NAME}
        title={`#${player.shirtNumber} ${player.name}`}
        description={`${player.position} - ${player.nationality}`}
      />

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard label="Matchs joues" value={stats?.matchesPlayed ?? 0} />
        <StatCard label="Matchs notes" value={stats?.matchesRated ?? 0} />
        <StatCard label="Votes recus" value={(stats?.totalVotes ?? 0).toLocaleString('fr-FR')} />
        <StatCard label="Note moyenne" value={(stats?.averageRating ?? 0).toFixed(1)} />
        <StatCard label="Hommes du match" value={stats?.manOfTheMatchAwards ?? 0} />
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-xl font-bold text-zinc-950">Dernieres notes</h2>
        </div>
        <div className="divide-y divide-zinc-200">
          {recentRatings.map((rating) => (
            <article
              key={rating.matchId}
              className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_140px_140px]"
            >
              <div>
                <p className="font-semibold text-zinc-950">
                  {UNITED_TEAM_NAME} vs {rating.match?.opponent}
                </p>
                <p className="text-sm text-zinc-500">{rating.match?.competition}</p>
              </div>
              <p className="text-sm text-zinc-600">
                {rating.totalVotes.toLocaleString('fr-FR')} votes
              </p>
              <p className="text-xl font-bold text-united-red">{rating.averageRating.toFixed(1)}</p>
            </article>
          ))}
          {recentRatings.length === 0 ? (
            <p className="px-5 py-6 text-sm text-zinc-500">Aucune note recente pour ce joueur.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
