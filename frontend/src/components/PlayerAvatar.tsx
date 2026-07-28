import { getPlayerInitials } from '../data/mockData';
import type { Player } from '../types';

interface PlayerAvatarProps {
  player: Player;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-xl',
};

export function PlayerAvatar({ player, size = 'md' }: PlayerAvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg ${player.placeholderColor} ${sizes[size]} font-black text-white`}
      aria-label={player.displayName}
    >
      {getPlayerInitials(player)}
    </span>
  );
}
