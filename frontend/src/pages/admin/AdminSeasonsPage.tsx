import { PageHeader } from '../../components/PageHeader';
import { competitions, seasons } from '../../data/mockData';

export function AdminSeasonsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des saisons"
        description="Liste locale des saisons et competitions associees."
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Saison</th>
                <th className="table-head">Periode</th>
                <th className="table-head">Competitions</th>
                <th className="table-head">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {seasons.map((season) => (
                <tr key={season.id}>
                  <td className="table-cell font-black text-zinc-950">{season.name}</td>
                  <td className="table-cell">
                    {season.startDate} - {season.endDate}
                  </td>
                  <td className="table-cell">
                    {season.competitionIds
                      .map((competitionId) =>
                        competitions.find((competition) => competition.id === competitionId)?.shortName,
                      )
                      .filter(Boolean)
                      .join(', ')}
                  </td>
                  <td className="table-cell">{season.active ? 'Active' : 'Archivee'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
