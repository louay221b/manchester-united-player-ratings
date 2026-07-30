import { Shield } from 'lucide-react';
import { useState } from 'react';

interface OpponentLogoProps {
  opponentName: string;
  logoUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
};

const iconSizes = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
};

export function OpponentLogo({ opponentName, logoUrl, size = 'md' }: OpponentLogoProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);

  if (logoUrl && failedLogoUrl !== logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`Logo de ${opponentName}`}
        className={`${sizes[size]} shrink-0 rounded-lg border border-zinc-200 bg-white object-contain p-1.5`}
        loading="lazy"
        onError={() => setFailedLogoUrl(logoUrl)}
      />
    );
  }

  return (
    <span
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-500`}
      aria-label={`Logo indisponible pour ${opponentName}`}
      role="img"
    >
      <Shield className={iconSizes[size]} aria-hidden="true" />
    </span>
  );
}
