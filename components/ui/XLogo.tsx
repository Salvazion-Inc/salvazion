import type { ReactNode } from 'react';
import { Fragment } from 'react';

/**
 * Official X (Twitter) brand mark — use whenever the UI refers to the X platform.
 */
export default function XLogo({
  className = 'w-4 h-4',
  title = 'X',
}: {
  className?: string;
  /** Accessible name (default “X”) */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

/**
 * Inline “Read on 𝕏” style: text + logo, aligned to the baseline.
 */
export function WithXLogo({
  children,
  className = '',
  logoClassName = 'w-[0.9em] h-[0.9em] shrink-0',
}: {
  children: ReactNode;
  className?: string;
  logoClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {children}
      <XLogo className={logoClassName} />
    </span>
  );
}

/**
 * Replace standalone word “X” (the platform) with the brand logo in plain copy.
 * Does not touch @handles or words containing X.
 */
export function textWithXLogo(
  text: string,
  logoClassName = 'inline-block w-[0.9em] h-[0.9em] align-[-0.12em] mx-0.5'
): ReactNode {
  if (!text.includes('X')) return text;
  const parts = text.split(/(\bX\b)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part === 'X' ? (
      <XLogo key={`x-${i}`} className={logoClassName} />
    ) : (
      <Fragment key={`t-${i}`}>{part}</Fragment>
    )
  );
}
