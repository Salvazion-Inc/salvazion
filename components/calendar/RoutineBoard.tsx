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
  DAY_START_MIN,
  DAY_END_MIN,
  SNAP_MIN,
  type CalendarEvent,
  type CalendarPillar,
  type AgendaBlockDef,
} from '@/lib/calendar/engine';
import { pillarPalette } from '@/lib/calendar/colors';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  date: string;
  /** Notify parent counts changed — must NOT remount this board */
  onChange?: () => void;
};

/** 15-min time options for the day window */
function buildTimeOptions(): string[] {
  const opts: string[] = [];
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += SNAP_MIN) {
    opts.push(minutesToTime(m));
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

/**
 * Stable routine board — no remount-prone pointer capture.
 * Place: pick block → pick time. Move: time select or ▲▼.
 */
export default function RoutineBoard({ date, onChange }: Props) {
  const { t } = useI18n();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [filter, setFilter] = useState<CalendarPillar | 'all'>('all');

  const sync = useCallback(() => {
    setEvents(getEventsForDate(date));
    onChange?.();
  }, [date, onChange]);

  useEffect(() => {
    setPicked(null);
    setEvents(getEventsForDate(date));
  }, [date]);

  const labelFor = (ev: CalendarEvent) => {
    const key = eventTitleKey(ev);
    return key ? t(key) : ev.title;
  };

  const placeAtTime = (blockKey: string, time: string) => {
    placeBlock(date, blockKey, time);
    setPicked(null);
    sync();
  };

  const moveBy = (id: string, deltaMin: number) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    const next = snapMinutes(
      Math.max(
        DAY_START_MIN,
        Math.min(DAY_END_MIN - SNAP_MIN, timeToMinutes(ev.time || '09:00') + deltaMin)
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
    updateEvent(id, { durationMin });
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

  const filters: { id: CalendarPillar | 'all'; label: string; color?: string }[] = [
    { id: 'all', label: t('agenda.all') },
    { id: 'salvation', label: 'S', color: pillarPalette('salvation').solid },
    { id: 'health', label: 'H', color: pillarPalette('health').solid },
    { id: 'freedom', label: 'F', color: pillarPalette('freedom').solid },
  ];

  // Suggest next free-ish default when adding via quick-add
  const nextDefaultTime = () => {
    if (events.length === 0) return '08:00';
    const last = events[events.length - 1];
    const end =
      timeToMinutes(last.time || '08:00') + (last.durationMin || 30);
    return minutesToTime(
      snapMinutes(Math.min(DAY_END_MIN - 30, Math.max(DAY_START_MIN, end)))
    );
  };

  const quickAdd = (blockKey: string) => {
    const def = ROUTINE_BLOCKS.find((b) => b.key === blockKey);
    if (!def) return;
    // If already in pick mode for this block, place at default; else select for time strip
    if (picked === blockKey) {
      placeAtTime(blockKey, nextDefaultTime());
      return;
    }
    setPicked(blockKey);
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[var(--sage)] leading-relaxed px-0.5">
        {picked ? t('calendar.tapToPlace') : t('calendar.dragHint')}
      </p>

      {/* Palette + S/H/F */}
      <div className="card-soft p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-semibold text-[var(--off-white)]">
            {t('calendar.palette')}
          </p>
          <div
            className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)]"
            role="group"
            aria-label="Filter"
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
              onPick={() => quickAdd(b.key)}
            />
          ))}
        </div>

        {picked && (
          <button
            type="button"
            className="btn-primary text-sm py-2"
            onClick={() => placeAtTime(picked, nextDefaultTime())}
          >
            + {t(ROUTINE_BLOCKS.find((b) => b.key === picked)?.titleKey || '')} ·{' '}
            {nextDefaultTime()}
          </button>
        )}
      </div>

      {/* Time strip when placing */}
      {picked && (
        <div className="card-soft p-3">
          <p className="text-[11px] text-[var(--sage)] mb-2">{t('calendar.chooseTime')}</p>
          <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
            {TIME_OPTIONS.filter((_, i) => i % 2 === 0).map((time) => (
              <button
                key={time}
                type="button"
                className="min-h-[40px] rounded-lg border border-[var(--border-soft)] text-xs tabular-nums text-[var(--off-white)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-active)]"
                onClick={() => placeAtTime(picked, time)}
              >
                {time}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 text-xs text-[var(--sage)]"
            onClick={() => setPicked(null)}
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-[var(--sage)] px-0.5">
        <span>
          {completed}/{events.length} {t('agenda.done')}
        </span>
      </div>

      {/* Day list (stable, always works) */}
      {events.length === 0 ? (
        <div className="card-soft p-6 text-center">
          <p className="text-sm text-[var(--sage)] mb-1">{t('calendar.emptyDay')}</p>
          <p className="text-[11px] text-[var(--sage)]/70">{t('calendar.dragHint')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => {
            const pal = pillarPalette(ev.pillar);
            return (
              <li
                key={ev.id}
                className={`card-soft p-3 border ${ev.completed ? 'opacity-60' : ''}`}
                style={{
                  background: pal.soft,
                  borderColor: pal.border,
                }}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(ev.id)}
                    className="w-8 h-8 rounded-full border-2 shrink-0 flex items-center justify-center text-sm font-bold"
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

                  <div className="min-w-0 flex-1 space-y-2">
                    <p
                      className={`text-sm font-semibold ${
                        ev.completed ? 'line-through opacity-70' : ''
                      }`}
                      style={{ color: pal.text }}
                    >
                      {labelFor(ev)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1 text-[10px]" style={{ color: pal.muted }}>
                        <span>{t('calendar.time')}</span>
                        <select
                          value={ev.time || '09:00'}
                          onChange={(e) => setTime(ev.id, e.target.value)}
                          className="min-h-[36px] rounded-lg border bg-[var(--true-black)] px-2 text-xs text-[var(--off-white)]"
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

                      <label className="flex items-center gap-1 text-[10px]" style={{ color: pal.muted }}>
                        <span>min</span>
                        <select
                          value={ev.durationMin || 30}
                          onChange={(e) =>
                            setDuration(ev.id, Number(e.target.value))
                          }
                          className="min-h-[36px] rounded-lg border bg-[var(--true-black)] px-2 text-xs text-[var(--off-white)]"
                          style={{ borderColor: pal.border }}
                        >
                          {!DURATION_OPTIONS.includes(ev.durationMin || 0) && (
                            <option value={ev.durationMin || 30}>
                              {ev.durationMin || 30}
                            </option>
                          )}
                          {DURATION_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="min-h-[36px] min-w-[36px] rounded-lg border text-sm"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() => moveBy(ev.id, -SNAP_MIN)}
                        aria-label="-15 min"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="min-h-[36px] min-w-[36px] rounded-lg border text-sm"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() => moveBy(ev.id, SNAP_MIN)}
                        aria-label="+15 min"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="min-h-[36px] px-3 rounded-lg border text-xs text-red-300/90 ml-auto"
                        style={{ borderColor: 'rgba(248,113,113,0.35)' }}
                        onClick={() => remove(ev.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
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
        outlineColor: pal.solid,
      }}
    >
      {label}
    </button>
  );
}
