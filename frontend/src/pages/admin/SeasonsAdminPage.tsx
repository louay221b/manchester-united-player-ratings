import { PageHeader } from '../../components/PageHeader';
import { seasons } from '../../data/mockData';

export function SeasonsAdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des saisons"
        description="Liste temporaire des saisons disponibles pour preparer le futur modele de donnees."
      />

      <section className="panel overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="table-head">Saison</th>
              <th className="table-head">Statut</th>
              <th className="table-head">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {seasons.map((season) => (
              <tr key={season.id}>
                <td className="table-cell font-semibold text-zinc-950">{season.name}</td>
                <td className="table-cell capitalize">{season.status}</td>
                <td className="table-cell">
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700"
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
