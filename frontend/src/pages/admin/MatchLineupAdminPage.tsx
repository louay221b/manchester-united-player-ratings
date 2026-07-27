import { PageHeader } from '../../components/PageHeader';
import { getLineupPlayers, matches, UNITED_TEAM_NAME } from '../../data/mockData';
import type { Player, PlayerPosition } from '../../types/domain';

const positionOrder: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

export function MatchLineupAdminPage() {
  const match = matches.find((item) => item.status === 'voting-open') ?? matches[0];
  const lineup = getLineupPlayers(match);
  const groupedLineup = positionOrder.map((position) => ({
    position,
    players: lineup.filter((player) => player.position === position),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Composition d un match"
        description={`${UNITED_TEAM_NAME} vs ${match.opponent} - composition temporaire par poste.`}
      />

      <section className="grid gap-4 lg:grid-cols-4">
        {groupedLineup.map((group) => (
          <article key={group.position} className="panel overflow-hidden">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
              <h2 className="font-bold text-zinc-950">{group.position}</h2>
            </div>
            <div className="divide-y divide-zinc-200">
              {group.players.map((player: Player) => (
                <div key={player.id} className="px-4 py-3">
                  <p className="font-semibold text-zinc-950">
                    #{player.shirtNumber} {player.name}
                  </p>
                  <p className="text-sm text-zinc-500">{player.nationality}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
