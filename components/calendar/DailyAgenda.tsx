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
import {
  pillarPalette,
  agendaAmbientDarken,
  agendaEventPhase,
  agendaEventDarken,
  agendaShellStyle,
  mixTowardBlack,
  localDayProgress,
} from '@/lib/calendar/colors';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  onScored?: () => void;
  className?: string;
};

/**
 * Dashboard daily agenda — today's calendar timeline (chronological).
 * Background and slots darken automatically as local hours pass.
 */
export default function DailyAgenda({ onScored, className = '' }: Props) {
  const { t, lang } = useI18n();
  const date = todayStr();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [now, setNow] = useState(() => new Date());

  const reload = useCallback(() => {
    setEvents(ensureDayAgenda(date));
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Tick with the user's local clock so darkness tracks their timezone.
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 30_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const timeline = useMemo(
    () =>
      [...events].sort((a, b) =>
        (a.time || '99:99').localeCompare(b.time || '99:99')
      ),
    [events]
  );

  const ambient = useMemo(() => agendaAmbientDarken(now), [now]);
  const dayPct = useMemo(() => Math.round(localDayProgress(now) * 100), [now]);
  const shell = useMemo(() => agendaShellStyle(now), [now]);

  const clockLabel = useMemo(() => {
    try {
      return now.toLocaleTimeString(lang === 'es' ? 'es' : 'en', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
  }, [now, lang]);

  const dateLabel = useMemo(() => {
    try {
      return now.toLocaleDateString(lang === 'es' ? 'es' : 'en', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return now.toISOString().slice(0, 10);
    }
  }, [now, lang]);

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
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {t('agenda.section')}
            <span className="normal-case tracking-normal text-[var(--sage)]/80 font-normal">
              {' · '}
              <span className="capitalize">{dateLabel}</span>
            </span>
          </p>
          <h2 className="text-base font-semibold text-[var(--accent)]">
            {t('agenda.title')}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/75 mt-0.5">
            {t('agenda.dayCalendar')}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`text-xl font-bold tabular-nums leading-none ${
              pct >= 80 ? 'text-[#8FD99A]' : 'text-[var(--accent)]'
            }`}
          >
            {pct}
            <span className="text-[11px] opacity-80">%</span>
          </p>
          <p className="text-[10px] text-[var(--sage)] tabular-nums mt-0.5">
            {completed}/{total} {t('agenda.done')}
          </p>
          <p className="text-[10px] tabular-nums text-[var(--sage)]/80">
            {clockLabel}
          </p>
        </div>
      </div>

      {/* Completion + ambient darken track the local day */}
      <div
        className="h-1.5 rounded-full overflow-hidden border transition-[background,border-color] duration-1000"
        style={{
          background: mixTowardBlack('var(--surface)', ambient * 0.75),
          borderColor: mixTowardBlack('var(--border-soft)', ambient * 0.4),
        }}
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${t('agenda.done')} · ${dayPct}% ${t('agenda.dayProgress')}`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: mixTowardBlack('var(--accent-fill)', ambient * 0.3),
            opacity: 1 - ambient * 0.2,
          }}
        />
      </div>

      {timeline.length === 0 ? (
        <div
          className="card-soft p-4 text-center border"
          style={shell}
        >
          <p className="text-sm text-[var(--sage)]">{t('calendar.emptyDay')}</p>
          <Link href="/hub/calendar" className="text-[11px] text-[var(--accent)] mt-2 inline-block">
            {t('agenda.openCalendar')} →
          </Link>
        </div>
      ) : (
        <ul
          className="space-y-1.5 rounded-2xl p-2 border transition-[background,border-color] duration-1000"
          style={shell}
        >
          {timeline.map((ev) => {
            const pal = pillarPalette(ev.pillar as CalendarPillar);
            const end = endTimeOf(ev);
            const durMin = ev.durationMin || DEFAULT_BLOCK_MIN;
            const dur = formatDurationHours(durMin);
            const phase = agendaEventPhase(ev.time, end, now);
            const darken = agendaEventDarken(ambient, phase);
            const bg = mixTowardBlack(pal.soft, darken);
            const border = mixTowardBlack(pal.border, darken * 0.75);
            const text = mixTowardBlack(pal.text, darken * 0.35);
            const muted = mixTowardBlack(pal.muted, darken * 0.4);
            const solid = mixTowardBlack(pal.solid, darken * 0.25);
            return (
              <li
                key={ev.id}
                className={`rounded-lg px-2.5 py-1.5 border flex items-center gap-2 transition-[background,border-color,opacity] duration-700 min-h-[42px] ${
                  ev.completed ? 'opacity-70' : phase === 'past' ? 'opacity-85' : 'opacity-100'
                } ${phase === 'now' ? 'ring-1 ring-[var(--accent)]/35' : ''}`}
                style={{
                  background: bg,
                  borderColor: phase === 'now'
                    ? mixTowardBlack('var(--accent)', ambient * 0.2)
                    : border,
                }}
                data-phase={phase}
              >
                <span
                  className="w-1 self-stretch min-h-[26px] rounded-full shrink-0"
                  style={{ background: solid }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-[10px] tabular-nums font-semibold shrink-0"
                      style={{ color: muted }}
                    >
                      {ev.time || '00:00'}
                    </p>
                    {phase === 'now' && (
                      <span className="text-[9px] uppercase tracking-wider text-[var(--accent)]">
                        {t('agenda.now')}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[12px] font-semibold leading-snug truncate transition-colors duration-500 ${
                      ev.completed ? 'line-through opacity-70' : ''
                    }`}
                    style={{ color: text }}
                  >
                    {labelFor(ev)}
                  </p>
                  <p
                    className="text-[9px] tabular-nums transition-colors duration-500 opacity-80"
                    style={{ color: muted }}
                  >
                    {end} · {dur}
                  </p>
                </div>
                <div
                  className="flex shrink-0 rounded-md border overflow-hidden"
                  style={{ borderColor: border }}
                  role="group"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!ev.completed) toggle(ev.id);
                    }}
                    className="min-w-[1.9rem] min-h-[28px] px-1 text-[9px] font-bold"
                    style={{
                      background: ev.completed ? solid : 'transparent',
                      color: ev.completed
                        ? ev.pillar === 'salvation'
                          ? '#111'
                          : '#0a120c'
                        : muted,
                    }}
                    aria-pressed={!!ev.completed}
                  >
                    {t('calendar.yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (ev.completed) toggle(ev.id);
                    }}
                    className="min-w-[1.9rem] min-h-[28px] px-1 text-[9px] font-bold border-l"
                    style={{
                      borderColor: border,
                      background: !ev.completed
                        ? 'rgba(0,0,0,0.3)'
                        : 'transparent',
                      color: !ev.completed ? text : muted,
                    }}
                    aria-pressed={!ev.completed}
                  >
                    {t('calendar.no')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/hub/calendar"
        className="flex items-center justify-between card-soft px-3.5 py-3 min-h-[48px] hover:border-[var(--border-strong)] transition-all border"
        style={{
          background: mixTowardBlack(
            'color-mix(in srgb, var(--surface) 80%, transparent)',
            ambient * 0.55
          ),
          borderColor: mixTowardBlack('var(--border-soft)', ambient * 0.35),
        }}
      >
        <span className="text-xs text-[var(--sage)]">{t('agenda.editInCalendar')}</span>
        <span className="text-[var(--accent)] text-sm">→</span>
      </Link>
    </div>
  );
}
