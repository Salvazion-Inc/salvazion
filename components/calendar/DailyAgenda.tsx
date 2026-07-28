'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ensureDayAgenda,
  toggleEventComplete,
  scoreActionForEventType,
  todayStr,
  eventTitleKey,
  endTimeOf,
  formatDurationHours,
  DEFAULT_BLOCK_MIN,
  type CalendarEvent,
  type CalendarPillar,
} from '@/lib/calendar/engine';
import { pillarPalette } from '@/lib/calendar/colors';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  onScored?: () => void;
  className?: string;
};

/**
 * Dashboard daily agenda — today's calendar timeline (chronological).
 */
export default function DailyAgenda({ onScored, className = '' }: Props) {
  const { t } = useI18n();
  const date = todayStr();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const reload = useCallback(() => {
    setEvents(ensureDayAgenda(date));
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  const timeline = useMemo(
    () =>
      [...events].sort((a, b) =>
        (a.time || '99:99').localeCompare(b.time || '99:99')
      ),
    [events]
  );

  const completed = events.filter((e) => e.completed).length;
  const total = events.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const labelFor = (ev: CalendarEvent) => {
    const key = eventTitleKey(ev);
    return key ? t(key) : ev.title;
  };

  const toggle = (id: string) => {
    const before = events.find((e) => e.id === id);
    const updated = toggleEventComplete(id);
    if (!updated) return;
    if (updated.completed && before && !before.completed) {
      const action = scoreActionForEventType(updated.type);
      if (action) logAction(action);
      onScored?.();
    }
    reload();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {t('agenda.section')}
          </p>
          <h2 className="text-base font-semibold text-[var(--accent)]">
            {t('agenda.title')}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/75 mt-0.5">
            {t('agenda.dayCalendar')}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-[var(--accent)] tabular-nums">
            {completed}/{total}
          </p>
          <p className="text-[10px] text-[var(--sage)]">{pct}%</p>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border-soft)]">
        <div
          className="h-full rounded-full bg-[var(--accent-fill)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {timeline.length === 0 ? (
        <div className="card-soft p-4 text-center">
          <p className="text-sm text-[var(--sage)]">{t('calendar.emptyDay')}</p>
          <Link href="/hub/calendar" className="text-[11px] text-[var(--accent)] mt-2 inline-block">
            {t('agenda.openCalendar')} →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {timeline.map((ev) => {
            const pal = pillarPalette(ev.pillar as CalendarPillar);
            const end = endTimeOf(ev);
            const dur = formatDurationHours(ev.durationMin || DEFAULT_BLOCK_MIN);
            return (
              <li
                key={ev.id}
                className={`card-soft p-3 border flex items-start gap-2.5 ${
                  ev.completed ? 'opacity-60' : ''
                }`}
                style={{ background: pal.soft, borderColor: pal.border }}
              >
                <button
                  type="button"
                  onClick={() => toggle(ev.id)}
                  className="w-8 h-8 rounded-full border-2 shrink-0 flex items-center justify-center text-sm font-bold mt-0.5"
                  style={{
                    borderColor: pal.solid,
                    background: ev.completed ? pal.solid : 'transparent',
                    color: ev.completed
                      ? ev.pillar === 'salvation'
                        ? '#111'
                        : '#0a120c'
                      : pal.text,
                  }}
                  aria-pressed={!!ev.completed}
                  aria-label={labelFor(ev)}
                >
                  {ev.completed ? '✓' : ''}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: pal.solid }}
                      aria-hidden
                    />
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: pal.muted }}>
                      {t(
                        `nav.${
                          ev.pillar === 'salvation'
                            ? 'salvation'
                            : ev.pillar === 'health'
                              ? 'health'
                              : 'freedom'
                        }`
                      )}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold leading-snug ${
                      ev.completed ? 'line-through opacity-70' : ''
                    }`}
                    style={{ color: pal.text }}
                  >
                    {labelFor(ev)}
                  </p>
                  <p className="text-[11px] tabular-nums mt-0.5" style={{ color: pal.muted }}>
                    {ev.time || '00:00'} – {end}
                    <span className="opacity-80"> · {dur}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/hub/calendar"
        className="flex items-center justify-between card-soft px-3.5 py-3 min-h-[48px] hover:border-[var(--border-strong)] transition-all"
      >
        <span className="text-xs text-[var(--sage)]">{t('agenda.editInCalendar')}</span>
        <span className="text-[var(--accent)] text-sm">→</span>
      </Link>
    </div>
  );
}
