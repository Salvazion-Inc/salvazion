'use client';

import React from 'react';

const iconMap: Record<string, string> = {
  home: '/icons/home.svg',
  bible: '/icons/bible.svg',
  health: '/icons/health.svg',
  freedom: '/icons/freedom.svg',
  profile: '/icons/profile.svg',
  devotional: '/icons/devotional.svg',
  calendar: '/icons/calendar.svg',
  badges: '/icons/badges.svg',
  swap: '/icons/swap.svg',
  invite: '/icons/invite.svg',
};

interface IconProps {
  name: keyof typeof iconMap | string;
  size?: number;
  className?: string;
  active?: boolean;
}

/**
 * Image-based Salvazion icons (soft mint set in /public/icons).
 * Prefer Icons.tsx React components for nav when possible.
 */
export default function Icon({ name, size = 24, className = '', active = false }: IconProps) {
  const src = iconMap[name] || iconMap.home;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`transition-all duration-200 shrink-0 ${
        active ? 'opacity-100' : 'opacity-80'
      } ${className}`}
      style={{
        // Soft lift only — no harsh neon bloom
        filter: active
          ? 'drop-shadow(0 0 4px rgba(143, 217, 154, 0.35))'
          : 'none',
      }}
    />
  );
}
