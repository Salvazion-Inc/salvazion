'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ROUTINE_BLOCKS,
  getEventsForDate,
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

/** Visual scale: block height ∝ duration (px per hour of the day). */
const PX_PER_HOUR = 56;
const DAY_TOTAL_MIN = DAY_END_MIN - DAY_START_MIN;
const DAY_HEIGHT_PX = (DAY_TOTAL_MIN / 60) * PX_PER_HOUR;
const MIN_BLOCK_PX = 28;

function blockLayout(ev: CalendarEvent): { top: number; height: number; startMin: number; durMin: number } {
  const startMin = Math.max(
    DAY_START_MIN,
    Math.min(DAY_END_MIN, timeToMinutes(ev.time || '00:00'))
  );
  const durMin = Math.max(SNAP_MIN, ev.durationMin || DEFAULT_BLOCK_MIN);
  const top = ((startMin - DAY_START_MIN) / 60) * PX_PER_HOUR;
  const height = Math.max(MIN_BLOCK_PX, (durMin / 60) * PX_PER_HOUR);
  return { top, height, startMin, durMin };
}

/**
 * Calendar routine board:
 * - Day from 00:00
 * - Blocks sized proportionally to duration (hours)
 * - Select block → attach to calendar (time + add)
 * - Seeds default day schedule when empty
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
    // Seed ideal default schedule for empty days
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

  const toggle = (id: string) => {
    const before = events.find((e) => e.id === id);
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

  const completed = events.filter((e) => e.completed).length;
  const pickedDef = picked ? ROUTINE_BLOCKS.find((b) => b.key === picked) : null;

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) =>
        (a.time || '99:99').localeCompare(b.time || '99:99')
      ),
    [events]
  );

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let h = 0; h <= 24; h += 1) marks.push(h);
    return marks;
  }, []);

  const filters: { id: CalendarPillar | 'all'; label: string; color?: string }[] = [
    { id: 'all', label: t('agenda.all') },
    { id: 'salvation', label: 'S', color: pillarPalette('salvation').solid },
    { id: 'health', label: 'H', color: pillarPalette('health').solid },
    { id: 'freedom', label: 'F', color: pillarPalette('freedom').solid },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[var(--sage)] leading-relaxed px-0.5">
        {t('calendar.dragHint')}
      </p>

      {/* Palette */}
      <div className="card-soft p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-semibold text-[var(--off-white)]">
            {t('calendar.palette')}
          </p>
          <div
            className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)]"
            role="group"
          >
            {filters.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className="min-w-[2.25rem] min-h-[36px] px-2.5 rounded-lg text-xs font-bold transition-all"
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

        <div className="flex flex-wrap gap-1.5">
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

      {/* Attach panel when block selected */}
      {picked && pickedDef && (
        <div
          className="card-soft p-4 space-y-3 border"
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

          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-[var(--sage)]">
              {t('calendar.time')}
              <select
                value={attachTime}
                onChange={(e) => setAttachTime(e.target.value)}
                className="min-h-[40px] rounded-lg border border-[var(--border-soft)] bg-[var(--true-black)] px-2 text-sm text-[var(--off-white)]"
              >
                {TIME_OPTIONS.map((tm) => (
                  <option key={tm} value={tm}>
                    {tm}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-[var(--sage)]">
              {t('calendar.duration')}
              <select
                value={attachDur}
                onChange={(e) => setAttachDur(Number(e.target.value))}
                className="min-h-[40px] rounded-lg border border-[var(--border-soft)] bg-[var(--true-black)] px-2 text-sm text-[var(--off-white)]"
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
              className="btn-primary flex-1 min-h-[44px]"
              onClick={attachToCalendar}
            >
              {t('calendar.attach')}
            </button>
            <button
              type="button"
              className="btn-secondary flex-1 min-h-[44px]"
              onClick={() => setPicked(null)}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-[var(--sage)] px-0.5">
        <span>
          {completed}/{events.length} {t('agenda.done')}
        </span>
        <span className="text-[10px] opacity-70">
          00:00 – 24:00 · {t('calendar.proportionalHint')}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="card-soft p-6 text-center">
          <p className="text-sm text-[var(--sage)]">{t('calendar.emptyDay')}</p>
        </div>
      ) : (
        <div className="card-soft overflow-hidden border border-[var(--border-soft)]">
          <div
            className="relative"
            style={{ height: DAY_HEIGHT_PX }}
            role="list"
            aria-label={t('calendar.planner')}
          >
            {/* Hour grid */}
            {hourMarks.map((h) => {
              const top = h * PX_PER_HOUR;
              return (
                <div
                  key={h}
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top }}
                >
                  <div className="flex items-start">
                    <span className="w-10 shrink-0 text-[9px] tabular-nums text-[var(--sage)]/55 pl-1.5 -translate-y-1.5">
                      {String(h).padStart(2, '0')}:00
                    </span>
                    <div className="flex-1 border-t border-[var(--border-soft)]/70" />
                  </div>
                </div>
              );
            })}

            {/* Proportional blocks */}
            {sortedEvents.map((ev) => {
              const pal = pillarPalette(ev.pillar);
              const end = endTimeOf(ev);
              const { top, height, durMin } = blockLayout(ev);
              const expanded = expandedId === ev.id;
              const short = height < 52;

              return (
                <div
                  key={ev.id}
                  role="listitem"
                  className={`absolute left-11 right-1.5 rounded-lg border overflow-hidden transition-[box-shadow,opacity] ${
                    ev.completed ? 'opacity-55' : ''
                  } ${expanded ? 'z-20 shadow-lg' : 'z-10'}`}
                  style={{
                    top,
                    height: expanded ? Math.max(height, 168) : height,
                    background: pal.soft,
                    borderColor: expanded ? pal.solid : pal.border,
                    boxShadow: expanded
                      ? `0 0 0 1px ${pal.solid}, 0 8px 24px rgba(0,0,0,0.45)`
                      : undefined,
                  }}
                >
                  <div
                    className={`h-full flex flex-col ${short && !expanded ? 'px-2 py-1' : 'p-2'}`}
                  >
                    <div className="flex items-start gap-1.5 min-h-0">
                      <button
                        type="button"
                        onClick={() => toggle(ev.id)}
                        className="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center text-[10px] font-bold"
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
                      >
                        {ev.completed ? '✓' : ''}
                      </button>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() =>
                          setExpandedId((id) => (id === ev.id ? null : ev.id))
                        }
                      >
                        <p
                          className={`text-[12px] font-semibold leading-tight truncate ${
                            ev.completed ? 'line-through opacity-70' : ''
                          }`}
                          style={{ color: pal.text }}
                        >
                          {labelFor(ev)}
                        </p>
                        <p
                          className="text-[9px] tabular-nums opacity-80 truncate"
                          style={{ color: pal.muted }}
                        >
                          {ev.time || '00:00'} – {end}
                          <span className="opacity-70">
                            {' '}
                            · {formatDurationHours(durMin)}
                          </span>
                        </p>
                      </button>
                    </div>

                    {expanded && (
                      <div className="mt-2 space-y-2 pt-1 border-t border-[var(--border-soft)]/60">
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            className="flex items-center gap-1 text-[10px]"
                            style={{ color: pal.muted }}
                          >
                            <span>{t('calendar.time')}</span>
                            <select
                              value={ev.time || '00:00'}
                              onChange={(e) => setTime(ev.id, e.target.value)}
                              className="min-h-[32px] rounded-lg border bg-[var(--true-black)] px-1.5 text-[11px] text-[var(--off-white)]"
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
                              className="min-h-[32px] rounded-lg border bg-[var(--true-black)] px-1.5 text-[11px] text-[var(--off-white)]"
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
                            className="min-h-[32px] min-w-[32px] rounded-lg border text-xs"
                            style={{ borderColor: pal.border, color: pal.text }}
                            onClick={() => moveBy(ev.id, -SNAP_MIN)}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="min-h-[32px] min-w-[32px] rounded-lg border text-xs"
                            style={{ borderColor: pal.border, color: pal.text }}
                            onClick={() => moveBy(ev.id, SNAP_MIN)}
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            className="min-h-[32px] min-w-[32px] rounded-lg border text-xs"
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
                            title="-0.25 h"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            className="min-h-[32px] min-w-[32px] rounded-lg border text-xs"
                            style={{ borderColor: pal.border, color: pal.text }}
                            onClick={() =>
                              setDuration(
                                ev.id,
                                (ev.durationMin || DEFAULT_BLOCK_MIN) + 15
                              )
                            }
                            title="+0.25 h"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="min-h-[32px] px-2.5 rounded-lg border text-[10px] text-red-300/90 ml-auto"
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
                </div>
              );
            })}
          </div>
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
      className={`text-[11px] px-2.5 py-2 rounded-full border font-medium transition-all min-h-[36px] ${
        selected ? 'ring-2 ring-offset-1 ring-offset-[#040404] scale-[1.03]' : ''
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
