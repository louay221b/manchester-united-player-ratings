import { useState } from 'react';
import { Shield } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = '' }: BrandLogoProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const wrapperClass =
    `flex h-10 w-10 items-center justify-center rounded-lg bg-united-red text-white sm:h-12 sm:w-12 ${className}`.trim();

  if (hasLoadError) {
    return (
      <span className={wrapperClass} aria-label="Manchester United" role="img">
        <Shield className="h-6 w-6" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={wrapperClass}>
      <img
        src="/brand/manchester-united-logo.png"
        alt="Manchester United"
        width={48}
        height={48}
        className="h-10 w-10 object-contain sm:h-12 sm:w-12"
        onError={() => setHasLoadError(true)}
      />
    </span>
  );
}
