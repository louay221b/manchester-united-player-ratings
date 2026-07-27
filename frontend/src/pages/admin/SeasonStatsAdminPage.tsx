import { PageHeader } from '../../components/PageHeader';
import { getStatsWithPlayers } from '../../data/mockData';

export function SeasonStatsAdminPage() {
  const rows = getStatsWithPlayers();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Statistiques de la saison"
        description="Vue admin prevue pour consulter, par joueur, les indicateurs demandes en fin de saison."
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Joueur</th>
                <th className="table-head">Matchs joues</th>
                <th className="table-head">Matchs notes</th>
                <th className="table-head">Total votes recus</th>
                <th className="table-head">Note moyenne saison</th>
                <th className="table-head">Titres homme du match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {rows.map((stats) => (
                <tr key={stats.playerId}>
                  <td className="table-cell font-semibold text-zinc-950">{stats.player.name}</td>
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
