import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { formatRating, getSeasonPlayerStats } from '../../data/mockData';

export function RankingPage() {
  const rows = getSeasonPlayerStats();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Classement"
        title="Classement de la saison"
        description="La moyenne saisonniere est la moyenne des notes moyennes obtenues match par match."
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Rang</th>
                <th className="table-head">Joueur</th>
                <th className="table-head">Poste</th>
                <th className="table-head">Matchs joues</th>
                <th className="table-head">Matchs notes</th>
                <th className="table-head">Votes</th>
                <th className="table-head">Moyenne saison</th>
                <th className="table-head">Homme du match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {rows.map((row) => (
                <tr key={row.player.id}>
                  <td className="table-cell text-lg font-black text-zinc-950">#{row.rank}</td>
                  <td className="table-cell">
                    <Link
                      to={`/players/${row.player.id}`}
                      className="flex items-center gap-3 font-black text-zinc-950 hover:text-united-red"
                    >
                      <PlayerAvatar player={row.player} size="sm" />
                      {row.player.displayName}
                    </Link>
                  </td>
                  <td className="table-cell">{row.player.position}</td>
                  <td className="table-cell">{row.matchesPlayed}</td>
                  <td className="table-cell">{row.matchesRated}</td>
                  <td className="table-cell">{row.totalVotes}</td>
                  <td className="table-cell text-lg font-black text-united-red">
                    {formatRating(row.seasonAverage)}
                  </td>
                  <td className="table-cell">{row.manOfTheMatchAwards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
