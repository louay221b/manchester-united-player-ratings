import { useState } from 'react';

interface ApiPlayerAvatarProps {
  player: {
    firstName: string;
    lastName: string;
    displayName: string;
    photoUrl: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
};

const getInitials = (player: ApiPlayerAvatarProps['player']) =>
  `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`.toUpperCase();

export function ApiPlayerAvatar({ player, size = 'md' }: ApiPlayerAvatarProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);

  if (player.photoUrl && failedPhotoUrl !== player.photoUrl) {
    return (
      <img
        src={player.photoUrl}
        alt={`Photo de ${player.displayName}`}
        className={`${sizes[size]} shrink-0 rounded-lg object-cover`}
        loading="lazy"
        onError={() => setFailedPhotoUrl(player.photoUrl)}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg bg-zinc-950 font-black text-white ${sizes[size]}`}
      aria-label={player.displayName}
    >
      {getInitials(player)}
    </span>
  );
}
