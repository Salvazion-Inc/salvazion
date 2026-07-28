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
      className={`page-header sticky top-0 z-40 px-5 pt-5 pb-3 ${className}`}
    >
      <div className="max-w-lg mx-auto flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Link
            href={backHref}
            className="back-btn shrink-0 mt-0.5"
            aria-label={back}
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-[var(--accent)] tracking-tight truncate">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-xs text-[var(--sage)] mt-0.5 line-clamp-2">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  );
}
