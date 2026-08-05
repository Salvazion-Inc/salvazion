'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { PILLAR_COLORS, type PillarId } from '@/lib/theme/pillars';
import { useI18n } from '@/components/I18nProvider';

const HUB_TITLES: Record<PillarId, string> = {
  salvation: 'Salvation Hub',
  health: 'Health Hub',
  freedom: 'Freedom Hub',
};

type Props = {
  pillar: PillarId;
  score: number;
  /** Optional line under the hub title (e.g. name · stage) */
  subtitle?: string;
  /** Extra controls under the score ring (tabs, links) */
  children?: ReactNode;
  /** Right-side actions next to title (e.g. collapse, devotional) */
  actions?: ReactNode;
  className?: string;
  sticky?: boolean;
  /** Use div when already inside a <header> (e.g. Bible sticky chrome). */
  as?: 'header' | 'div';
};

/**
 * Shared pillar hub chrome: back + "X Hub" title + circular score.
 */
export default function PillarHubHeader({
  pillar,
  score,
  subtitle,
  children,
  actions,
  className = '',
  sticky = false,
  as = 'header',
}: Props) {
  const { t } = useI18n();
  const pal = PILLAR_COLORS[pillar];
  const title = HUB_TITLES[pillar];
  const capped = Math.min(Math.max(0, score), 150);
  const ringPct = Math.min(capped, 100);
  // circumference ≈ 2 * π * 42
  const dash = ringPct * 2.64;
  const Root = as === 'div' ? 'div' : 'header';

  return (
    <Root
      className={`page-header px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3 ${
        sticky ? 'sticky top-0 z-40' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3 max-w-lg mx-auto">
        <div className="flex items-start gap-2.5 min-w-0">
          <Link
            href="/hub/dashboard"
            className="back-btn shrink-0 mt-0.5"
            aria-label={t('common.back')}
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1
              className="font-display text-xl font-bold leading-tight tracking-tight truncate whitespace-nowrap"
              style={{ color: pal.text }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="text-[11px] text-[var(--sage)]/85 mt-0.5 truncate text-pretty">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="shrink-0 flex items-center gap-1.5">{actions}</div> : null}
      </div>

      <div className="flex justify-center mb-1 max-w-lg mx-auto">
        <div
          className="relative w-[7.25rem] h-[7.25rem] flex items-center justify-center"
          role="img"
          aria-label={`${title}: ${Math.round(capped)}`}
        >
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden
          >
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={pal.solid}
              strokeWidth="6"
              opacity="0.18"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={pal.solid}
              strokeWidth="6"
              strokeDasharray={`${dash} 264`}
              strokeLinecap="round"
              className="transition-all duration-700"
              style={{
                filter: `drop-shadow(0 0 8px color-mix(in srgb, ${pal.solid} 45%, transparent))`,
              }}
            />
          </svg>
          <div className="text-center z-10">
            <div className="font-display text-3xl font-bold text-white tabular-nums tracking-tighter leading-none">
              {Math.round(capped)}
            </div>
            <div
              className="text-[9px] uppercase tracking-widest mt-1 font-medium"
              style={{ color: pal.muted }}
            >
              Score
            </div>
          </div>
        </div>
      </div>

      {children ? (
        <div className="max-w-lg mx-auto w-full">{children}</div>
      ) : null}
    </Root>
  );
}

export { HUB_TITLES };
