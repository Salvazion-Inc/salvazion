'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useI18n } from '@/components/I18nProvider';

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  right?: ReactNode;
  className?: string;
}

/**
 * Shared hub chrome — consistent back + title + optional action.
 * Sticky glass header with 44px+ touch targets (2026 mobile UX).
 */
export default function PageHeader({
  title,
  subtitle,
  backHref = '/hub/dashboard',
  backLabel,
  right,
  className = '',
}: Props) {
  const { t } = useI18n();
  const back = backLabel || t('common.back');

  return (
    <header
      className={`page-header sticky top-0 z-40 px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 ${className}`}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            href={backHref}
            className="back-btn shrink-0"
            aria-label={back}
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg font-semibold text-[var(--accent)] tracking-tight truncate leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-[11px] sm:text-xs text-[var(--sage)]/85 mt-0.5 line-clamp-2 leading-snug text-pretty">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {right ? (
          <div className="shrink-0 flex items-center gap-2">{right}</div>
        ) : null}
      </div>
    </header>
  );
}
