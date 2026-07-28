import { PlayerAvatar } from '../../components/PlayerAvatar';
import { PageHeader } from '../../components/PageHeader';
import { players } from '../../data/mockData';

export function AdminPlayersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des joueurs"
        description="Effectif temporaire utilise par les pages publiques et les compositions."
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Joueur</th>
                <th className="table-head">Numero</th>
                <th className="table-head">Poste</th>
                <th className="table-head">Nationalite</th>
                <th className="table-head">Pied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="table-cell">
                    <span className="flex items-center gap-3 font-black text-zinc-950">
                      <PlayerAvatar player={player} size="sm" />
                      {player.displayName}
                    </span>
                  </td>
                  <td className="table-cell">#{player.shirtNumber}</td>
                  <td className="table-cell">{player.position}</td>
                  <td className="table-cell">{player.nationality}</td>
                  <td className="table-cell">{player.preferredFoot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
