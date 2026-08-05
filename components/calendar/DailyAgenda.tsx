'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import {
  ensureDayAgenda,
  toggleEventComplete,
  scoreActionForEventType,
  todayStr,
  eventTitleKey,
  endTimeOf,
  agendaBlockHeightPx,
  agendaBlockLayout,
  getDayCompletionStats,
  hrefForCalendarEvent,
  DEFAULT_BLOCK_MIN,
  type CalendarEvent,
  type CalendarPillar,
} from '@/lib/calendar/engine';
import {
  pillarPalette,
  agendaAmbientDarken,
  agendaEventPhase,
  agendaBlockDarken,
  agendaEventProgress,
  agendaEventRemainingMin,
  agendaShellStyle,
  mixTowardBlack,
  localDayProgress,
} from '@/lib/calendar/colors';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';
import AgendaActivityFace from '@/components/calendar/AgendaActivityFace';
import { useFlashToast } from '@/components/ui/FlashToast';

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
  const { flash, toast: softToast } = useFlashToast(2800);
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
    const wasDoneBefore = events.filter((e) => e.completed).length;
    const updated = toggleEventComplete(id);
    if (!updated) return;

    if (updated.completed && before && !before.completed) {
      const action = scoreActionForEventType(updated.type);
      if (action) logAction(action);

      const stats = getDayCompletionStats(date);
      const title = labelFor(updated);
      if (wasDoneBefore === 0) {
        flash(
          t('agenda.softFirstDone', {
            title,
            percent: stats.percent,
          }),
          { tone: 'soft', durationMs: 3200 }
        );
      } else if (action) {
        flash(
          t('agenda.softScored', {
            title,
            percent: stats.percent,
          }),
          { tone: 'soft', durationMs: 2800 }
        );
      } else {
        flash(
          t('agenda.softDiscipline', {
            title,
            percent: stats.percent,
            done: stats.done,
            total: stats.total,
          }),
          { tone: 'soft', durationMs: 2600 }
        );
      }
    }

    // Always notify parent so score rings + discipline charts refresh
    onScored?.();
    reload();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {softToast}
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
            const pillar = ev.pillar as CalendarPillar;
            const pal = pillarPalette(pillar);
            const end = endTimeOf(ev);
            const durMin = ev.durationMin || DEFAULT_BLOCK_MIN;
            const layout = agendaBlockLayout(durMin);
            const blockH = agendaBlockHeightPx(durMin);
            const phase = agendaEventPhase(ev.time, end, now);
            const isNow = phase === 'now';
            const darken = agendaBlockDarken(pillar, ambient, phase);
            // Salvation keeps a light plate + dark ink; others tint + light text
            const bg = mixTowardBlack(pal.soft, darken);
            const border = mixTowardBlack(pal.border, darken * 0.75);
            const solid = mixTowardBlack(pal.solid, darken * 0.25);
            // Palette for face: keep plate identity; soften muted via mix on non-plate
            const facePal = {
              ...pal,
              solid,
              soft: bg,
              border,
              text: pal.lightPlate
                ? mixTowardBlack(pal.text, Math.min(darken * 0.25, 0.12))
                : mixTowardBlack(pal.text, darken * 0.35),
              muted: pal.lightPlate
                ? mixTowardBlack(pal.muted, Math.min(darken * 0.2, 0.1))
                : mixTowardBlack(pal.muted, darken * 0.4),
            };
            const progress = isNow
              ? agendaEventProgress(ev.time, end, now)
              : 0;
            const remainingMin = isNow
              ? agendaEventRemainingMin(ev.time, end, now)
              : 0;
            const remainingLabel = (() => {
              if (remainingMin >= 60) {
                const h = Math.floor(remainingMin / 60);
                const m = remainingMin % 60;
                return m > 0 ? `${h}h ${m}m` : `${h}h`;
              }
              return `${remainingMin} min`;
            })();
            // "Ahora" gradient: for white Salvation plate, stay light (dark ink)
            const nowBg = pal.lightPlate
              ? `linear-gradient(135deg, ${bg} 0%, color-mix(in srgb, ${pal.solid} 70%, #c8d0c8) 100%)`
              : `linear-gradient(135deg, ${bg} 0%, color-mix(in srgb, ${pal.solid} 18%, #0a120c) 100%)`;
            return (
              <li
                key={ev.id}
                className={`rounded-lg border transition-[background,border-color,opacity,height,min-height] duration-700 relative ${
                  layout === 'compact'
                    ? 'px-2 py-1'
                    : layout === 'cozy'
                      ? 'px-2.5 py-1.5'
                      : 'px-2.5 py-2'
                } ${
                  ev.completed
                    ? 'opacity-70'
                    : phase === 'past'
                      ? 'opacity-85'
                      : 'opacity-100'
                } ${isNow ? 'now-block' : ''}`}
                style={
                  {
                    '--now-glow': pal.solid,
                    background: isNow ? nowBg : bg,
                    borderColor: isNow
                      ? mixTowardBlack(pal.solid, ambient * 0.12)
                      : border,
                    borderWidth: isNow ? 1.5 : 1,
                    height: blockH,
                    minHeight: blockH,
                    paddingBottom: isNow && layout !== 'compact' ? 10 : undefined,
                  } as CSSProperties
                }
                data-phase={phase}
                data-layout={layout}
                data-duration-min={durMin}
                data-pillar={pillar}
                aria-current={isNow ? 'true' : undefined}
              >
                <AgendaActivityFace
                  layout={layout}
                  title={labelFor(ev)}
                  timeLabel={isNow ? clockLabel : ev.time || '00:00'}
                  rangeLabel={
                    layout === 'compact'
                      ? undefined
                      : isNow
                        ? `${ev.time || '00:00'}–${end}`
                        : `→ ${end}`
                  }
                  durationMin={durMin}
                  pillar={pillar}
                  pal={facePal}
                  done={!!ev.completed}
                  isNow={isNow}
                  openHref={hrefForCalendarEvent(ev)}
                  openLabel={t('agenda.openActivity', { title: labelFor(ev) })}
                  nowBadge={
                    isNow ? (
                      <span
                        className="now-block-badge"
                        style={{ '--now-glow': pal.solid } as CSSProperties}
                      >
                        <i className="now-block-badge-dot" aria-hidden />
                        {t('agenda.now')}
                        {remainingMin > 0 && layout !== 'compact' && (
                          <span className="font-semibold normal-case tracking-normal opacity-80">
                            · {remainingLabel}
                          </span>
                        )}
                      </span>
                    ) : null
                  }
                  actions={
                    <div
                      className="btn-pair"
                      style={{
                        borderColor: isNow ? solid : border,
                        boxShadow: isNow
                          ? `0 0 10px color-mix(in srgb, ${pal.solid} 25%, transparent)`
                          : undefined,
                      }}
                      role="group"
                      aria-label={t('calendar.fulfilled')}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!ev.completed) toggle(ev.id);
                        }}
                        style={{
                          background: ev.completed ? pal.solid : 'transparent',
                          color: ev.completed
                            ? '#111'
                            : pal.lightPlate
                              ? pal.muted
                              : facePal.muted,
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
                        style={{
                          borderColor: border,
                          background: !ev.completed
                            ? pal.lightPlate
                              ? 'rgba(18, 20, 18, 0.12)'
                              : 'rgba(0,0,0,0.3)'
                            : 'transparent',
                          color: !ev.completed
                            ? pal.lightPlate
                              ? pal.text
                              : pal.control
                            : facePal.muted,
                        }}
                        aria-pressed={!ev.completed}
                      >
                        {t('calendar.no')}
                      </button>
                    </div>
                  }
                />
                {isNow && (
                  <div className="now-block-progress" aria-hidden>
                    <i
                      style={{
                        width: `${Math.round(progress * 100)}%`,
                        background: pal.lightPlate
                          ? 'linear-gradient(90deg, #3a3f3a, #121412)'
                          : `linear-gradient(90deg, ${pal.solid}, color-mix(in srgb, ${pal.solid} 70%, #fff))`,
                      }}
                    />
                  </div>
                )}
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
