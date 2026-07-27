'use client';

import { useState } from 'react';

interface BrandMarkIconProps {
  src: string;
  alt: string;
  /** Pixel size (square). Default 40. */
  size?: number;
  className?: string;
  /** Emoji shown if image fails */
  fallback?: string;
  /** Dimmed / locked look */
  muted?: boolean;
}

/**
 * Brand Imagine icons (badges, invite categories) — circular crop, soft mint glow.
 */
export default function BrandMarkIcon({
  src,
  alt,
  size = 40,
  className = '',
  fallback,
  muted = false,
}: BrandMarkIconProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--true-black)] ${
        muted ? 'opacity-50 grayscale-[0.35]' : 'lion-glow'
      } ${className}`}
      style={{ width: size, height: size }}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {failed || !src ? (
        <span className="text-lg leading-none" aria-hidden>
          {fallback || '✦'}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={() => setFailed(true)}
          draggable={false}
        />
      )}
    </span>
  );
}
