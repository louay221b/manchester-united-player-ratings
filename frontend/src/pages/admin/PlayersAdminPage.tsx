import { PageHeader } from '../../components/PageHeader';
import { players } from '../../data/mockData';

export function PlayersAdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des joueurs"
        description="Effectif temporaire de Manchester United, sans persistence pour cette premiere etape."
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Numero</th>
                <th className="table-head">Joueur</th>
                <th className="table-head">Poste</th>
                <th className="table-head">Nationalite</th>
                <th className="table-head">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="table-cell">#{player.shirtNumber}</td>
                  <td className="table-cell font-semibold text-zinc-950">{player.name}</td>
                  <td className="table-cell">{player.position}</td>
                  <td className="table-cell">{player.nationality}</td>
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
        </div>
      </section>
    </div>
  );
}
