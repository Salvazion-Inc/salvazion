'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ROUTINE_BLOCKS,
  getEventsForDate,
  getDayCompletionStats,
  isDaySummaryWindow,
  placeBlock,
  removeEvent,
  updateEvent,
  moveEventToTime,
  toggleEventComplete,
  scoreActionForEventType,
  eventTitleKey,
  timeToMinutes,
  minutesToTime,
  snapMinutes,
  endTimeOf,
  formatDurationHours,
  seedDefaultDay,
  DAY_START_MIN,
  DAY_END_MIN,
  SNAP_MIN,
  DEFAULT_BLOCK_MIN,
  type CalendarEvent,
  type CalendarPillar,
  type AgendaBlockDef,
} from '@/lib/calendar/engine';
import { pillarPalette } from '@/lib/calendar/colors';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  date: string;
  onChange?: () => void;
};

function buildTimeOptions(): string[] {
  const opts: string[] = [];
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += SNAP_MIN) {
    opts.push(minutesToTime(m));
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 210, 240, 420];

/**
 * Compact routine board: slim blocks, clear Sí/No completion, day %.
 */
export default function RoutineBoard({ date, onChange }: Props) {
  const { t } = useI18n();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [attachTime, setAttachTime] = useState('08:00');
  const [attachDur, setAttachDur] = useState(DEFAULT_BLOCK_MIN);
  const [filter, setFilter] = useState<CalendarPillar | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sync = useCallback(() => {
    setEvents(getEventsForDate(date));
    onChange?.();
  }, [date, onChange]);

  useEffect(() => {
    setPicked(null);
    setExpandedId(null);
    seedDefaultDay(date);
    setEvents(getEventsForDate(date));
  }, [date]);

  const labelFor = (ev: CalendarEvent) => {
    const key = eventTitleKey(ev);
    return key ? t(key) : ev.title;
  };

  const selectBlock = (blockKey: string) => {
    const def = ROUTINE_BLOCKS.find((b) => b.key === blockKey);
    if (!def) return;
    if (picked === blockKey) {
      setPicked(null);
      return;
    }
    setPicked(blockKey);
    setAttachTime(def.defaultTime);
    setAttachDur(def.durationMin || DEFAULT_BLOCK_MIN);
  };

  const attachToCalendar = () => {
    if (!picked) return;
    placeBlock(date, picked, attachTime, attachDur);
    setPicked(null);
    sync();
  };

  const moveBy = (id: string, deltaMin: number) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    const next = snapMinutes(
      Math.max(
        DAY_START_MIN,
        Math.min(DAY_END_MIN - SNAP_MIN, timeToMinutes(ev.time || '00:00') + deltaMin)
      )
    );
    moveEventToTime(id, minutesToTime(next));
    sync();
  };

  const setTime = (id: string, time: string) => {
    moveEventToTime(id, time);
    sync();
  };

  const setDuration = (id: string, durationMin: number) => {
    updateEvent(id, { durationMin: Math.max(SNAP_MIN, durationMin) });
    sync();
  };

  /** Explicit yes / no completion (not only toggle). */
  const setDone = (id: string, done: boolean) => {
    const before = events.find((e) => e.id === id);
    if (!before) return;
    if (!!before.completed === done) return;
    const updated = toggleEventComplete(id);
    if (updated?.completed && before && !before.completed) {
      const action = scoreActionForEventType(updated.type);
      if (action) logAction(action);
    }
    sync();
  };

  const remove = (id: string) => {
    removeEvent(id);
    sync();
  };

  const palette = useMemo(
    () =>
      filter === 'all'
        ? ROUTINE_BLOCKS
        : ROUTINE_BLOCKS.filter((b) => b.pillar === filter),
    [filter]
  );

  const stats = useMemo(() => getDayCompletionStats(date), [date, events]);
  const showSummary = isDaySummaryWindow(date);
  const pickedDef = picked ? ROUTINE_BLOCKS.find((b) => b.key === picked) : null;

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) =>
        (a.time || '99:99').localeCompare(b.time || '99:99')
      ),
    [events]
  );

  const filters: { id: CalendarPillar | 'all'; label: string; color?: string }[] = [
    { id: 'all', label: t('agenda.all') },
    { id: 'salvation', label: 'S', color: pillarPalette('salvation').solid },
    { id: 'health', label: 'H', color: pillarPalette('health').solid },
    { id: 'freedom', label: 'F', color: pillarPalette('freedom').solid },
  ];

  return (
    <div className="space-y-3">
      {/* Day completion ring / bar */}
      <div
        className={`card-soft p-3.5 border ${
          showSummary && stats.total > 0
            ? 'border-[var(--border-strong)]'
            : 'border-[var(--border-soft)]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">
              {showSummary
                ? t('calendar.daySummary')
                : t('calendar.dayProgress')}
            </p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {stats.done}/{stats.total}{' '}
              <span className="text-[var(--sage)] font-normal text-xs">
                {t('calendar.plannedVsDone')}
              </span>
            </p>
          </div>
          <div
            className="w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 tabular-nums"
            style={{
              borderColor:
                stats.percent >= 80
                  ? '#8FD99A'
                  : stats.percent >= 50
                    ? '#4A9EFF'
                    : 'var(--border-soft)',
              boxShadow:
                stats.percent >= 80
                  ? '0 0 16px rgba(143,217,154,0.25)'
                  : undefined,
            }}
            aria-label={`${stats.percent}%`}
          >
            <span
              className={`text-lg font-bold ${
                stats.percent >= 80 ? 'text-[#8FD99A]' : 'text-white'
              }`}
            >
              {stats.percent}
              <span className="text-[10px] font-semibold opacity-80">%</span>
            </span>
          </div>
        </div>
        <div
          className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden"
          role="progressbar"
          aria-valuenow={stats.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stats.percent}%`,
              background:
                stats.percent >= 80
                  ? 'linear-gradient(90deg, #7BC98A, #8FD99A)'
                  : stats.percent >= 50
                    ? 'linear-gradient(90deg, #4A9EFF, #7BC98A)'
                    : 'linear-gradient(90deg, #6B8F6E, #4A9EFF)',
            }}
          />
        </div>
        {showSummary && stats.total > 0 && (
          <p className="text-[11px] text-[var(--sage)] mt-2 leading-relaxed">
            {stats.percent >= 100
              ? t('calendar.summaryPerfect')
              : stats.percent >= 70
                ? t('calendar.summaryGood', { percent: stats.percent })
                : t('calendar.summaryLow', { percent: stats.percent })}
          </p>
        )}
      </div>

      <p className="text-[11px] text-[var(--sage)] leading-relaxed px-0.5">
        {t('calendar.dragHint')}
      </p>

      {/* Palette */}
      <div className="card-soft p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-semibold text-[var(--off-white)]">
            {t('calendar.palette')}
          </p>
          <div
            className="flex gap-0.5 p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border-soft)]"
            role="group"
          >
            {filters.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className="min-w-[1.85rem] min-h-[30px] px-2 rounded-md text-[11px] font-bold transition-all"
                  style={
                    active
                      ? {
                          background: tab.color || 'var(--accent-fill)',
                          color: tab.id === 'salvation' ? '#111' : '#0a120c',
                        }
                      : {
                          color: tab.color || 'var(--sage)',
                          background: 'transparent',
                        }
                  }
                  aria-pressed={active}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {palette.map((b) => (
            <PaletteChip
              key={b.key}
              block={b}
              label={t(b.titleKey)}
              selected={picked === b.key}
              onPick={() => selectBlock(b.key)}
            />
          ))}
        </div>
      </div>

      {/* Attach panel */}
      {picked && pickedDef && (
        <div
          className="card-soft p-3 space-y-2.5 border"
          style={{ borderColor: pillarPalette(pickedDef.pillar).border }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">
              {t('calendar.attachTitle')}
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: pillarPalette(pickedDef.pillar).text }}
            >
              {t(pickedDef.titleKey)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="flex flex-col gap-0.5 text-[10px] text-[var(--sage)]">
              {t('calendar.time')}
              <select
                value={attachTime}
                onChange={(e) => setAttachTime(e.target.value)}
                className="min-h-[36px] rounded-lg border border-[var(--border-soft)] bg-[var(--true-black)] px-2 text-sm text-[var(--off-white)]"
              >
                {TIME_OPTIONS.map((tm) => (
                  <option key={tm} value={tm}>
                    {tm}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] text-[var(--sage)]">
              {t('calendar.duration')}
              <select
                value={attachDur}
                onChange={(e) => setAttachDur(Number(e.target.value))}
                className="min-h-[36px] rounded-lg border border-[var(--border-soft)] bg-[var(--true-black)] px-2 text-sm text-[var(--off-white)]"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {formatDurationHours(d)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1 min-h-[40px] text-sm"
              onClick={attachToCalendar}
            >
              {t('calendar.attach')}
            </button>
            <button
              type="button"
              className="btn-secondary flex-1 min-h-[40px] text-sm"
              onClick={() => setPicked(null)}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="card-soft p-5 text-center">
          <p className="text-sm text-[var(--sage)]">{t('calendar.emptyDay')}</p>
        </div>
      ) : (
        <div
          className="space-y-1.5"
          role="list"
          aria-label={t('calendar.planner')}
        >
          {sortedEvents.map((ev) => {
            const pal = pillarPalette(ev.pillar);
            const end = endTimeOf(ev);
            const expanded = expandedId === ev.id;
            const done = !!ev.completed;
            const durMin = ev.durationMin || DEFAULT_BLOCK_MIN;

            return (
              <div
                key={ev.id}
                role="listitem"
                className={`rounded-xl border overflow-hidden transition-all ${
                  done ? 'opacity-80' : ''
                }`}
                style={{
                  background: pal.soft,
                  borderColor: expanded ? pal.solid : pal.border,
                  boxShadow: expanded
                    ? `0 0 0 1px ${pal.solid}33`
                    : undefined,
                }}
              >
                {/* Compact row — fixed low height */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 min-h-[44px]">
                  {/* Pillar stripe */}
                  <span
                    className="w-1 self-stretch min-h-[28px] rounded-full shrink-0"
                    style={{ background: pal.solid }}
                    aria-hidden
                  />

                  {/* Time */}
                  <button
                    type="button"
                    className="shrink-0 text-left w-[4.25rem]"
                    onClick={() =>
                      setExpandedId((id) => (id === ev.id ? null : ev.id))
                    }
                  >
                    <p
                      className="text-[11px] font-semibold tabular-nums leading-tight"
                      style={{ color: pal.text }}
                    >
                      {ev.time || '00:00'}
                    </p>
                    <p
                      className="text-[9px] tabular-nums opacity-70 leading-tight"
                      style={{ color: pal.muted }}
                    >
                      {end} · {formatDurationHours(durMin)}
                    </p>
                  </button>

                  {/* Title */}
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() =>
                      setExpandedId((id) => (id === ev.id ? null : ev.id))
                    }
                  >
                    <p
                      className={`text-[12px] font-semibold leading-snug truncate ${
                        done ? 'line-through opacity-65' : ''
                      }`}
                      style={{ color: pal.text }}
                    >
                      {labelFor(ev)}
                    </p>
                  </button>

                  {/* Sí / No check */}
                  <div
                    className="flex shrink-0 rounded-lg border overflow-hidden"
                    style={{ borderColor: pal.border }}
                    role="group"
                    aria-label={t('calendar.fulfilled')}
                  >
                    <button
                      type="button"
                      onClick={() => setDone(ev.id, true)}
                      className="min-w-[2.15rem] min-h-[32px] px-1.5 text-[10px] font-bold transition"
                      style={{
                        background: done ? pal.solid : 'transparent',
                        color: done
                          ? ev.pillar === 'salvation'
                            ? '#111'
                            : '#0a120c'
                          : pal.muted,
                      }}
                      aria-pressed={done}
                      title={t('calendar.yesDone')}
                    >
                      {t('calendar.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDone(ev.id, false)}
                      className="min-w-[2.15rem] min-h-[32px] px-1.5 text-[10px] font-bold border-l transition"
                      style={{
                        borderColor: pal.border,
                        background: !done ? 'rgba(0,0,0,0.35)' : 'transparent',
                        color: !done ? pal.text : pal.muted,
                      }}
                      aria-pressed={!done}
                      title={t('calendar.noPending')}
                    >
                      {t('calendar.no')}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div
                    className="px-2.5 pb-2.5 pt-1 space-y-2 border-t"
                    style={{ borderColor: `${pal.border}` }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className="flex items-center gap-1 text-[10px]"
                        style={{ color: pal.muted }}
                      >
                        <span>{t('calendar.time')}</span>
                        <select
                          value={ev.time || '00:00'}
                          onChange={(e) => setTime(ev.id, e.target.value)}
                          className="min-h-[30px] rounded-md border bg-[var(--true-black)] px-1.5 text-[11px] text-[var(--off-white)]"
                          style={{ borderColor: pal.border }}
                        >
                          {!TIME_OPTIONS.includes(ev.time || '') && ev.time && (
                            <option value={ev.time}>{ev.time}</option>
                          )}
                          {TIME_OPTIONS.map((tm) => (
                            <option key={tm} value={tm}>
                              {tm}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label
                        className="flex items-center gap-1 text-[10px]"
                        style={{ color: pal.muted }}
                      >
                        <span>{t('calendar.duration')}</span>
                        <select
                          value={ev.durationMin || DEFAULT_BLOCK_MIN}
                          onChange={(e) =>
                            setDuration(ev.id, Number(e.target.value))
                          }
                          className="min-h-[30px] rounded-md border bg-[var(--true-black)] px-1.5 text-[11px] text-[var(--off-white)]"
                          style={{ borderColor: pal.border }}
                        >
                          {!DURATION_OPTIONS.includes(ev.durationMin || 0) && (
                            <option value={ev.durationMin || DEFAULT_BLOCK_MIN}>
                              {formatDurationHours(
                                ev.durationMin || DEFAULT_BLOCK_MIN
                              )}
                            </option>
                          )}
                          {DURATION_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {formatDurationHours(d)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <button
                        type="button"
                        className="min-h-[30px] min-w-[30px] rounded-md border text-xs"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() => moveBy(ev.id, -SNAP_MIN)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="min-h-[30px] min-w-[30px] rounded-md border text-xs"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() => moveBy(ev.id, SNAP_MIN)}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="min-h-[30px] min-w-[30px] rounded-md border text-xs"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() =>
                          setDuration(
                            ev.id,
                            Math.max(
                              SNAP_MIN,
                              (ev.durationMin || DEFAULT_BLOCK_MIN) - 15
                            )
                          )
                        }
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="min-h-[30px] min-w-[30px] rounded-md border text-xs"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() =>
                          setDuration(
                            ev.id,
                            (ev.durationMin || DEFAULT_BLOCK_MIN) + 15
                          )
                        }
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="min-h-[30px] px-2 rounded-md border text-[10px] text-red-300/90 ml-auto"
                        style={{ borderColor: 'rgba(248,113,113,0.35)' }}
                        onClick={() => {
                          remove(ev.id);
                          setExpandedId(null);
                        }}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaletteChip({
  block,
  label,
  selected,
  onPick,
}: {
  block: AgendaBlockDef;
  label: string;
  selected: boolean;
  onPick: () => void;
}) {
  const pal = pillarPalette(block.pillar);

  return (
    <button
      type="button"
      onClick={onPick}
      className={`text-[10px] px-2 py-1.5 rounded-full border font-medium transition-all min-h-[30px] ${
        selected ? 'ring-1 ring-offset-1 ring-offset-[#040404] scale-[1.02]' : ''
      }`}
      style={{
        background: pal.soft,
        borderColor: selected ? pal.solid : pal.border,
        color: pal.text,
      }}
    >
      {label}
    </button>
  );
}
