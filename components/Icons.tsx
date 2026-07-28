'use client';

import React from 'react';

/**
 * Salvazion exclusive icon system
 * Soft mint palette — easy on the eyes, dark-mode friendly.
 * Motif: soft strokes + subtle constellation nodes (brand DNA).
 */

interface IconProps {
  size?: number;
  className?: string;
  active?: boolean;
  /** Override active color (e.g. pillar white / blue / green) */
  color?: string;
}

/** Soft brand colors — CSS vars so themes recolor icons */
const C = {
  active: 'var(--icon-active, #8FD99A)',
  idle: 'var(--icon-idle, #8AAB8E)',
  dim: 'var(--sage-dim, #6B8F6E)',
  fillActive: 'var(--surface-active, rgba(143, 217, 154, 0.18))',
  fillIdle: 'var(--border-soft, rgba(138, 171, 142, 0.08))',
};

function tone(active?: boolean, color?: string) {
  if (active && color) return color;
  return active ? C.active : C.idle;
}

function baseClass(active?: boolean, className = '') {
  return [
    'transition-all duration-200 shrink-0',
    active ? 'opacity-100' : 'opacity-85',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

function Node({
  cx,
  cy,
  r = 1.1,
  active,
  color,
}: {
  cx: number | string;
  cy: number | string;
  r?: number | string;
  active?: boolean;
  color?: string;
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={tone(active, color)}
      opacity={active ? 0.95 : 0.7}
    />
  );
}

/** Shared circular frame — exclusive Salvazion mark */
function Frame({ active, color }: { active?: boolean; color?: string }) {
  const s = tone(active, color);
  return (
    <circle
      cx="12"
      cy="12"
      r="10.25"
      stroke={s}
      strokeWidth="1.15"
      fill={active ? (color ? `${color}22` : C.fillActive) : C.fillIdle}
      opacity={active ? 1 : 0.9}
    />
  );
}

export function HomeIcon({ size = 24, className = '', active }: IconProps) {
  const s = tone(active);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} />
      <path
        d="M8.2 12.2 12 8.8l3.8 3.4"
        stroke={s}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 11.8V15.6h5.8v-3.8"
        stroke={s}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6 15.6v-2.2h2.8v2.2"
        stroke={s}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Node cx="12" cy="7.2" active={active} r={1} />
    </svg>
  );
}

export function BibleIcon({ size = 24, className = '', active, color }: IconProps) {
  const s = tone(active, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} color={color} />
      {/* open book */}
      <path
        d="M12 8.2c-1.6-1-3.4-1.4-5.2-1.2v7.6c1.8-.2 3.6.2 5.2 1.2 1.6-1 3.4-1.4 5.2-1.2V7c-1.8-.2-3.6.2-5.2 1.2z"
        stroke={s}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M12 8.4v7.4" stroke={s} strokeWidth="1.15" strokeLinecap="round" />
      {/* soft cross light */}
      <path d="M12 9.6v2.8M10.6 11h2.8" stroke={s} strokeWidth="1.15" strokeLinecap="round" opacity={0.85} />
      <Node cx="8.2" cy="8.5" active={active} color={color} r={0.85} />
      <Node cx="15.8" cy="8.5" active={active} color={color} r={0.85} />
    </svg>
  );
}

export function HealthIcon({ size = 24, className = '', active, color }: IconProps) {
  const s = tone(active, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} color={color} />
      {/* leaf / heart hybrid */}
      <path
        d="M12 16.6c-2.8-1.8-4.2-3.6-4.2-5.5A2.7 2.7 0 0 1 12 8.6a2.7 2.7 0 0 1 4.2 2.5c0 1.9-1.4 3.7-4.2 5.5z"
        stroke={s}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M12 10v3.2M10.4 11.6h3.2" stroke={s} strokeWidth="1.2" strokeLinecap="round" />
      <Node cx="12" cy="7.4" active={active} color={color} r={0.9} />
    </svg>
  );
}

export function FreedomIcon({ size = 24, className = '', active, color }: IconProps) {
  const s = tone(active, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} color={color} />
      {/* open key / liberty path */}
      <circle cx="9.2" cy="11.2" r="2.2" stroke={s} strokeWidth="1.3" />
      <path
        d="M11.2 11.2h5.6M15.2 11.2v1.6M16.8 11.2v1.2"
        stroke={s}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M8.2 14.8c.8.9 1.9 1.4 3.2 1.4 1.5 0 2.7-.7 3.5-1.6"
        stroke={s}
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity={0.8}
      />
      <Node cx="9.2" cy="11.2" active={active} color={color} r={0.85} />
    </svg>
  );
}

export function SwapIcon({ size = 24, className = '', active }: IconProps) {
  const s = tone(active);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} />
      <path
        d="M8 10.2h7.2"
        stroke={s}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M13.4 7.8 16.2 10.2 13.4 12.6"
        stroke={s}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 13.8H8.8"
        stroke={s}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M10.6 11.4 7.8 13.8 10.6 16.2"
        stroke={s}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Node cx="12" cy="12" active={active} r={0.9} />
    </svg>
  );
}

export function ProfileIcon({ size = 24, className = '', active }: IconProps) {
  const s = tone(active);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} />
      <circle cx="12" cy="10" r="2.4" stroke={s} strokeWidth="1.3" />
      <path
        d="M7.6 16.4c.9-2 2.5-3 4.4-3s3.5 1 4.4 3"
        stroke={s}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* soft crown hint */}
      <path
        d="M9.6 7.2 11 8.2l1-1.1 1 1.1 1.4-1"
        stroke={s}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      <Node cx="12" cy="10" active={active} r={0.75} />
    </svg>
  );
}

export function DevotionalIcon({ size = 24, className = '', active }: IconProps) {
  const s = tone(active);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} />
      {/* soft flame */}
      <path
        d="M12 7.2c1.6 1.5 2.6 2.8 2.6 4.3a2.6 2.6 0 0 1-5.2 0c0-1.5 1-2.8 2.6-4.3z"
        stroke={s}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M12 10.2c.6.6 1 1.2 1 1.8a1 1 0 0 1-2 0c0-.6.4-1.2 1-1.8z"
        stroke={s}
        strokeWidth="1.1"
        strokeLinejoin="round"
        opacity={0.9}
      />
      <path d="M9.5 16.2h5" stroke={s} strokeWidth="1.2" strokeLinecap="round" />
      <Node cx="12" cy="7" active={active} r={0.85} />
    </svg>
  );
}

export function CalendarIcon({ size = 24, className = '', active }: IconProps) {
  const s = tone(active);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} />
      <rect
        x="7.2"
        y="8"
        width="9.6"
        height="8.4"
        rx="1.4"
        stroke={s}
        strokeWidth="1.3"
      />
      <path d="M7.2 10.6h9.6" stroke={s} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.4 6.8v2M14.6 6.8v2" stroke={s} strokeWidth="1.2" strokeLinecap="round" />
      <Node cx="9.6" cy="13.2" active={active} r={0.75} />
      <Node cx="12" cy="13.2" active={active} r={0.75} />
      <Node cx="14.4" cy="13.2" active={active} r={0.75} />
    </svg>
  );
}

export function BadgesIcon({ size = 24, className = '', active }: IconProps) {
  const s = tone(active);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} />
      <path
        d="M12 7.4 13.2 10h2.8l-2.2 1.8.8 2.8L12 13.2 9.4 14.6l.8-2.8L8 10h2.8L12 7.4z"
        stroke={s}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <Node cx="12" cy="11.2" active={active} r={0.85} />
    </svg>
  );
}

export function InviteIcon({ size = 24, className = '', active }: IconProps) {
  const s = tone(active);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} />
      <circle cx="10" cy="10.2" r="2.1" stroke={s} strokeWidth="1.25" />
      <path
        d="M6.8 15.4c.7-1.5 2-2.3 3.2-2.3 1.2 0 2.5.8 3.2 2.3"
        stroke={s}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M15.2 9.2h3.2M16.8 7.6v3.2" stroke={s} strokeWidth="1.25" strokeLinecap="round" />
      <Node cx="10" cy="10.2" active={active} r={0.75} />
    </svg>
  );
}

export function SearchIcon({ size = 24, className = '', active }: IconProps) {
  const s = tone(active);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} />
      <circle cx="11" cy="11" r="3.2" stroke={s} strokeWidth="1.3" />
      <path d="M13.4 13.4 16.2 16.2" stroke={s} strokeWidth="1.3" strokeLinecap="round" />
      <Node cx="11" cy="11" active={active} r={0.75} />
    </svg>
  );
}

/** Soft Solana / network mark for wallet surfaces */
export function NetworkIcon({ size = 24, className = '', active }: IconProps) {
  const s = tone(active);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={baseClass(active, className)}
      aria-hidden
    >
      <Frame active={active} />
      <Node cx="8.2" cy="9" active={active} />
      <Node cx="12" cy="7.5" active={active} />
      <Node cx="15.8" cy="9" active={active} />
      <Node cx="10" cy="13.5" active={active} />
      <Node cx="14" cy="13.5" active={active} />
      <Node cx="12" cy="16.2" active={active} r={0.95} />
      <path
        d="M8.2 9 12 7.5l3.8 1.5M8.2 9 10 13.5M15.8 9 14 13.5M10 13.5 12 16.2 14 13.5"
        stroke={s}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}
