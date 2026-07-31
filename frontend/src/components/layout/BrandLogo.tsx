import { useState } from 'react';
import { Shield } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: {
    wrapper: 'h-10 w-10',
    icon: 'h-5 w-5',
    image: 'h-10 w-10',
  },
  md: {
    wrapper: 'h-12 w-12 sm:h-14 sm:w-14',
    icon: 'h-6 w-6 sm:h-7 sm:w-7',
    image: 'h-12 w-12 sm:h-14 sm:w-14',
  },
};

export function BrandLogo({ className = '', size = 'md' }: BrandLogoProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const selectedSize = sizeClasses[size];
  const wrapperClass =
    `flex shrink-0 items-center justify-center rounded-lg bg-united-red text-white ${selectedSize.wrapper} ${className}`.trim();

  if (hasLoadError) {
    return (
      <span className={wrapperClass} aria-label="Manchester United" role="img">
        <Shield className={selectedSize.icon} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={wrapperClass}>
      <img
        src="/brand/icon-512.png"
        alt="Manchester United"
        width={56}
        height={56}
        className={`${selectedSize.image} object-contain`}
        onError={() => setHasLoadError(true)}
      />
    </span>
  );
}
