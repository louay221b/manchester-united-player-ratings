import { Link } from 'react-router';

import { PlayerAvatar } from './PlayerAvatar';
import type { Player, SeasonPlayerStats } from '../types';

interface PlayerCardProps {
  player: Player;
  stats?: SeasonPlayerStats;
}

export function PlayerCard({ player, stats }: PlayerCardProps) {
  return (
    <Link
      to={`/players/${player.id}`}
      className="panel flex items-center gap-4 p-4 hover:border-united-red hover:bg-red-50/40"
    >
      <PlayerAvatar player={player} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-zinc-950">
          #{player.shirtNumber} {player.displayName}
        </span>
        <span className="mt-1 block text-sm text-zinc-500">
          {player.position} - {player.nationality}
        </span>
      </span>
      {stats ? (
        <span className="text-right">
          <span className="block text-xl font-black text-united-red">
            {stats.seasonAverage?.toFixed(1) ?? '-'}
          </span>
          <span className="text-xs font-semibold uppercase text-zinc-500">moy.</span>
        </span>
      ) : null}
    </Link>
  );
}
