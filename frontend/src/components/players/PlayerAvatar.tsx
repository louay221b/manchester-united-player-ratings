import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PlayerAvatarProps {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-24 w-24 text-3xl',
};

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export function PlayerAvatar({
  photoUrl,
  firstName,
  lastName,
  size = 'md',
  className = '',
}: PlayerAvatarProps) {
  const { t } = useTranslation();
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const displayName = `${firstName} ${lastName}`.trim();
  const initials = getInitials(firstName, lastName) || 'MU';
  const baseClass = `shrink-0 rounded-lg ${sizeClasses[size]} ${className}`.trim();

  if (photoUrl && failedPhotoUrl !== photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={t('imageUpload.playerPhotoAlt', { player: displayName })}
        className={`${baseClass} object-cover`}
        loading="lazy"
        onError={() => setFailedPhotoUrl(photoUrl)}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center bg-zinc-950 font-black text-white ${baseClass}`}
      aria-label={
        displayName
          ? t('imageUpload.playerInitialsAlt', { player: displayName })
          : t('imageUpload.playerInitialsGeneric')
      }
      role="img"
    >
      {initials}
    </span>
  );
}
