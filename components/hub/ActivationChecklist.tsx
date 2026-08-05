'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getDayCompletionStats, todayStr } from '@/lib/calendar/engine';
import { getLoggedActionTypesToday } from '@/lib/scoring/engine';
import { getCombinedHealthIndicators } from '@/lib/health/wearables';
import { useI18n } from '@/components/I18nProvider';

const STORAGE_DISMISS = 'salvazion_activation_dismissed';

type Props = {
  /** Bump when scores/agenda change so checks re-evaluate */
  refreshKey?: number;
  className?: string;
};

type CheckItem = {
  id: string;
  done: boolean;
  label: string;
  href: string;
  cta: string;
};

/**
 * Lightweight first-run activation (3 steps). Hides when all done or dismissed.
 * Replaces the orphaned Value Journey without a heavy tour.
 */
export default function ActivationChecklist({
  refreshKey = 0,
  className = '',
}: Props) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(true); // start hidden until client read
  const [tick, setTick] = useState(0);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_DISMISS) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    setTick((n) => n + 1);
  }, [refreshKey]);

  const items: CheckItem[] = useMemo(() => {
    void tick;
    const stats = getDayCompletionStats(todayStr());
    const logged = getLoggedActionTypesToday();
    const body = getCombinedHealthIndicators();
    const hasDevice =
      body.sources.phone ||
      body.sources.wearable ||
      body.steps > 0 ||
      body.activeMinutes > 0;

    const salvationDone =
      logged.has('bible_chapter') ||
      logged.has('pray_5min') ||
      logged.has('devotional_complete');

    return [
      {
        id: 'agenda',
        done: stats.done > 0,
        label: t('dashboard.activateAgenda'),
        href: '/hub/dashboard',
        cta: t('dashboard.activateAgendaCta'),
      },
      {
        id: 'salvation',
        done: salvationDone,
        label: t('dashboard.activateSalvation'),
        href: '/hub/bible',
        cta: t('dashboard.activateSalvationCta'),
      },
      {
        id: 'health',
        done: hasDevice || logged.has('hit_15min') || logged.has('sleep_ideal'),
        label: t('dashboard.activateHealth'),
        href: '/hub/health',
        cta: t('dashboard.activateHealthCta'),
      },
    ];
  }, [t, tick]);

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_DISMISS, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  // Auto-dismiss when complete
  useEffect(() => {
    if (allDone && !dismissed) {
      try {
        localStorage.setItem(STORAGE_DISMISS, '1');
      } catch {
        /* ignore */
      }
      setDismissed(true);
    }
  }, [allDone, dismissed]);

  if (dismissed || allDone) return null;

  return (
    <section
      className={`card-soft p-3.5 border border-[var(--border-soft)] space-y-2.5 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {t('dashboard.activateSection')}
          </p>
          <h2 className="text-sm font-semibold text-white">
            {t('dashboard.activateTitle')}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/75 mt-0.5">
            {t('dashboard.activateHint', { n: doneCount, total: items.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-[10px] text-[var(--sage)]/70 hover:text-[var(--sage)] shrink-0"
        >
          {t('dashboard.activateSkip')}
        </button>
      </div>

      <div
        className="h-1 rounded-full bg-[var(--surface)] overflow-hidden"
        role="progressbar"
        aria-valuenow={doneCount}
        aria-valuemin={0}
        aria-valuemax={items.length}
      >
        <div
          className="h-full rounded-full bg-[var(--accent-fill)] transition-all"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            {item.done ? (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-[var(--sage)]">
                <span className="text-[#8FD99A] font-bold" aria-hidden>
                  ✓
                </span>
                <span className="line-through opacity-75">{item.label}</span>
              </div>
            ) : (
              <Link
                href={item.href}
                className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg border border-[var(--border-soft)] hover:border-[var(--border-strong)] transition-colors"
              >
                <span className="text-[12px] text-[var(--off-white)]">
                  {item.label}
                </span>
                <span className="text-[10px] text-[var(--accent)] shrink-0">
                  {item.cta} →
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
