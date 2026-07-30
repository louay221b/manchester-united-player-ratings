import { PlayerAvatar } from './players/PlayerAvatar';

interface ApiPlayerAvatarProps {
  player: {
    firstName: string;
    lastName: string;
    displayName: string;
    photoUrl: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function ApiPlayerAvatar({ player, size = 'md' }: ApiPlayerAvatarProps) {
  return (
    <PlayerAvatar
      photoUrl={player.photoUrl}
      firstName={player.firstName}
      lastName={player.lastName}
      size={size}
    />
  );
}
