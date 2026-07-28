import { useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import {
  getMatchById,
  getMatchPlayers,
  getPlayerById,
  UNITED_TEAM_NAME,
} from '../../data/mockData';
import type { MatchPlayer, Player, PlayerPosition } from '../../types';

const positionOrder: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];
type LineupRow = { matchPlayer: MatchPlayer; player: Player };

export function AdminMatchLineupPage() {
  const { matchId } = useParams();
  const match = matchId ? getMatchById(matchId) : undefined;

  if (!match) {
    return (
      <PageHeader
        eyebrow="Administration"
        title="Composition introuvable"
        description="Le match demande n existe pas."
      />
    );
  }

  const rows = getMatchPlayers(match.id)
    .map((matchPlayer) => ({ matchPlayer, player: getPlayerById(matchPlayer.playerId) }))
    .filter((row): row is LineupRow => Boolean(row.player));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Composition"
        title={`${UNITED_TEAM_NAME} vs ${match.opponent}`}
        description="Joueurs rattaches au match avec poste, statut titulaire et minutes."
      />

      <section className="grid gap-4 lg:grid-cols-4">
        {positionOrder.map((position) => (
          <article key={position} className="panel overflow-hidden">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
              <h2 className="font-black text-zinc-950">{position}</h2>
            </div>
            <div className="divide-y divide-zinc-200">
              {rows
                .filter((row) => row.matchPlayer.position === position)
                .map((row) => (
                  <div key={row.matchPlayer.id} className="flex items-center gap-3 px-4 py-3">
                    <PlayerAvatar player={row.player} size="sm" />
                    <div>
                      <p className="font-black text-zinc-950">{row.player.displayName}</p>
                      <p className="text-sm text-zinc-500">
                        {row.matchPlayer.starter ? 'Titulaire' : 'Remplacant'} -{' '}
                        {row.matchPlayer.minutesPlayed} min
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
