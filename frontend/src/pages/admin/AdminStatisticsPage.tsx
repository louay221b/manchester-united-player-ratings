import { PageHeader } from '../../components/PageHeader';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { formatRating, getSeasonPlayerStats } from '../../data/mockData';

export function AdminStatisticsPage() {
  const rows = getSeasonPlayerStats();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Statistiques de la saison"
        description="Vue admin des indicateurs demandes pour chaque joueur."
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
                <th className="table-head">Total votes</th>
                <th className="table-head">Moyenne saison</th>
                <th className="table-head">Titres homme du match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {rows.map((row) => (
                <tr key={row.player.id}>
                  <td className="table-cell font-black text-zinc-950">#{row.rank}</td>
                  <td className="table-cell">
                    <span className="flex items-center gap-3 font-black text-zinc-950">
                      <PlayerAvatar player={row.player} size="sm" />
                      {row.player.displayName}
                    </span>
                  </td>
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
