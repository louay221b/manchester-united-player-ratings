import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { getStatsWithPlayers } from '../../data/mockData';

export function SeasonLeaderboardPage() {
  const rows = getStatsWithPlayers();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saison active"
        title="Classement de la saison"
        description="Vue publique des moyennes et distinctions calculees avec les donnees temporaires."
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Rang</th>
                <th className="table-head">Joueur</th>
                <th className="table-head">Matchs joues</th>
                <th className="table-head">Matchs notes</th>
                <th className="table-head">Votes recus</th>
                <th className="table-head">Note moyenne</th>
                <th className="table-head">Hommes du match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {rows.map((stats, index) => (
                <tr key={stats.playerId}>
                  <td className="table-cell font-bold text-zinc-950">{index + 1}</td>
                  <td className="table-cell font-semibold text-zinc-950">
                    <Link to={`/players/${stats.playerId}`} className="hover:text-united-red">
                      {stats.player.name}
                    </Link>
                  </td>
                  <td className="table-cell">{stats.matchesPlayed}</td>
                  <td className="table-cell">{stats.matchesRated}</td>
                  <td className="table-cell">{stats.totalVotes.toLocaleString('fr-FR')}</td>
                  <td className="table-cell text-lg font-bold text-united-red">
                    {stats.averageRating.toFixed(1)}
                  </td>
                  <td className="table-cell">{stats.manOfTheMatchAwards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
