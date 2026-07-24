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
};

interface IconProps {
  name: keyof typeof iconMap | string;
  size?: number;
  className?: string;
  active?: boolean;
}

export default function Icon({ name, size = 24, className = '', active = false }: IconProps) {
  const src = iconMap[name] || iconMap.home;
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`transition-all duration-200 ${active ? 'opacity-100 brightness-125 drop-shadow-[0_0_6px_#00F511]' : 'opacity-60'} ${className}`}
      style={{ filter: active ? 'drop-shadow(0 0 6px #00F511)' : undefined }}
    />
  );
}
