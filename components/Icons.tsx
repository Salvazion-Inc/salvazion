'use client';

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  active?: boolean;
}

const base = (active?: boolean) =>
  `transition-all duration-200 ${active ? 'text-[#00F511] drop-shadow-[0_0_6px_rgba(0,245,17,0.7)]' : 'text-[#B7F7AC]/70'}`;

export function HomeIcon({ size = 24, className = '', active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${base(active)} ${className}`}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M9 20v-6h6v6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="0.7" fill="currentColor" />
      <circle cx="16" cy="8" r="0.7" fill="currentColor" />
      <line x1="12" y1="12" x2="8" y2="8" strokeWidth="1" />
      <line x1="12" y1="12" x2="16" y2="8" strokeWidth="1" />
    </svg>
  );
}

export function BibleIcon({ size = 24, className = '', active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${base(active)} ${className}`}>
      <path d="M4 4h12a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z" />
      <path d="M18 6h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" />
      <path d="M8 8h6" />
      <path d="M8 12h6" />
      <path d="M8 16h4" />
      <circle cx="12" cy="4" r="1" fill="currentColor" />
    </svg>
  );
}

export function HealthIcon({ size = 24, className = '', active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${base(active)} ${className}`}>
      <path d="M12 21s-7-4.5-7-10a5 5 0 0 1 10 0c0 5.5-7 10-7 10z" />
      <path d="M12 8v4" />
      <path d="M10 10h4" />
      <circle cx="12" cy="6" r="0.8" fill="currentColor" />
      <circle cx="8" cy="14" r="0.6" fill="currentColor" />
      <circle cx="16" cy="14" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function FreedomIcon({ size = 24, className = '', active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${base(active)} ${className}`}>
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
      <path d="M12 17.5v2" />
      <circle cx="7" cy="7" r="0.7" fill="currentColor" />
      <circle cx="17" cy="7" r="0.7" fill="currentColor" />
    </svg>
  );
}

export function ProfileIcon({ size = 24, className = '', active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${base(active)} ${className}`}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
      {/* small crown */}
      <path d="M9.5 4.5l1 1.2 1.5-0.8 1.5 0.8 1-1.2" strokeWidth="1.2" />
      <circle cx="12" cy="14" r="0.7" fill="currentColor" />
    </svg>
  );
}

export function DevotionalIcon({ size = 24, className = '', active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`${base(active)} ${className}`}>
      <path d="M12 3v18" />
      <path d="M6 9h12" />
      <circle cx="12" cy="9" r="1.2" fill="currentColor" />
      <circle cx="6" cy="9" r="0.7" fill="currentColor" />
      <circle cx="18" cy="9" r="0.7" fill="currentColor" />
      <circle cx="12" cy="3" r="0.8" fill="currentColor" />
      <circle cx="12" cy="21" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function CalendarIcon({ size = 24, className = '', active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${base(active)} ${className}`}>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <circle cx="8" cy="14" r="0.8" fill="currentColor" />
      <circle cx="12" cy="14" r="0.8" fill="currentColor" />
      <circle cx="16" cy="14" r="0.8" fill="currentColor" />
      <circle cx="8" cy="18" r="0.8" fill="currentColor" />
      <circle cx="12" cy="18" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function BadgesIcon({ size = 24, className = '', active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${base(active)} ${className}`}>
      <path d="M12 2l2.5 5.5H21l-4.5 3.5 1.5 6L12 14.5 6 17l1.5-6L3 7.5h6.5z" />
      <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
