'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getCombinedHealthIndicators,
  runPassiveHealthSync,
  type CombinedHealthIndicators,
} from '@/lib/health/wearables';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  /** Bump to re-read local indicators after forms change */
  refreshKey?: number;
  onAutoLogged?: () => void;
  className?: string;
};

/**
 * Compact “today from devices” strip — value without manual forms.
 * Auto-syncs OAuth (throttled) and shows phone + wearable combined metrics.
 */
export default function TodayFromDevices({
  refreshKey = 0,
  onAutoLogged,
  className = '',
}: Props) {
  const { t, lang } = useI18n();
  const [combined, setCombined] = useState<CombinedHealthIndicators | null>(
    null
  );
  const [syncing, setSyncing] = useState(false);
  const [autoNote, setAutoNote] = useState<string | null>(null);

  const readLocal = useCallback(() => {
    setCombined(getCombinedHealthIndicators());
  }, []);

  const runSync = useCallback(
    async (force = false) => {
      setSyncing(true);
      try {
        const result = await runPassiveHealthSync({
          lang: lang === 'en' || lang === 'pt' ? lang : 'es',
          force,
          onLog: (type) => {
            logAction(type);
          },
        });
        setCombined(result.combined);
        if (result.autoLogged.length) {
          setAutoNote(t('health.devices.autoLogged'));
          onAutoLogged?.();
          window.setTimeout(() => setAutoNote(null), 2800);
        }
      } finally {
        setSyncing(false);
      }
    },
    [lang, onAutoLogged, t]
  );

  useEffect(() => {
    readLocal();
    void runSync(false);
  }, [readLocal, runSync, refreshKey]);

  const c = combined;
  const hasAny =
    !!c &&
    (c.sources.phone ||
      c.sources.wearable ||
      c.steps > 0 ||
      c.activeMinutes > 0 ||
      c.sleepHours != null);

  const metrics: { label: string; value: string }[] = [];
  if (c) {
    metrics.push({
      label: t('health.devices.steps'),
      value: c.steps > 0 ? String(Math.round(c.steps)) : '—',
    });
    metrics.push({
      label: t('health.devices.active'),
      value: c.activeMinutes > 0 ? `${c.activeMinutes} min` : '—',
    });
    metrics.push({
      label: t('health.devices.sleep'),
      value:
        c.sleepHours != null ? `${c.sleepHours.toFixed(1)} h` : '—',
    });
    if (c.restingHr != null || c.avgHeartRate != null) {
      metrics.push({
        label: t('health.devices.hr'),
        value: String(c.restingHr ?? c.avgHeartRate),
      });
    }
  }

  return (
    <section
      className={`rounded-2xl border border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface)_90%,#0a0f14)] p-3.5 space-y-2.5 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {t('health.devices.section')}
          </p>
          <h2 className="text-sm font-semibold text-white leading-tight">
            {t('health.devices.title')}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/75 mt-0.5 leading-snug">
            {t('health.devices.hint')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runSync(true)}
          disabled={syncing}
          className="btn-outline-sm shrink-0"
        >
          {syncing ? t('health.devices.syncing') : t('health.devices.sync')}
        </button>
      </div>

      {autoNote && (
        <p className="text-[11px] text-[#8FD99A]" role="status">
          {autoNote}
        </p>
      )}

      {hasAny && metrics.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl px-2.5 py-2 border border-[var(--border-soft)] bg-[#040404]/50"
            >
              <p className="text-[9px] uppercase tracking-wider text-[var(--sage)]/70">
                {m.label}
              </p>
              <p className="text-base font-bold tabular-nums text-white mt-0.5">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-[var(--sage)] leading-relaxed">
          {t('health.devices.empty')}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
        <Link
          href="/hub/profile?settings=1&tab=wearables"
          className="text-[11px] text-[var(--accent)] hover:underline"
        >
          {t('health.devices.connect')} →
        </Link>
        {c?.sources.wearable || c?.sources.phone ? (
          <span className="text-[10px] text-[var(--sage)]/65">
            {c.sources.wearable && c.sources.phone
              ? t('health.devices.sourceBoth')
              : c.sources.wearable
                ? t('health.devices.sourceWearable')
                : t('health.devices.sourcePhone')}
          </span>
        ) : null}
      </div>
    </section>
  );
}
