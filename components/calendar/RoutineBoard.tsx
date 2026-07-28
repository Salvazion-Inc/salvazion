'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const PX_PER_MIN = 1.2;
const TIMELINE_H = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN;

type Props = {
  date: string;
  onChange?: () => void;
};

type DragState = {
  id: string;
  mode: 'move' | 'resize';
  startY: number;
  startMin: number;
  startDur: number;
};

/**
 * Routine board: palette chips + vertical timeline.
 * Move blocks with drag handle; S/H/F filters; white / blue / green pillars.
 */
export default function RoutineBoard({ date, onChange }: Props) {
  const { t } = useI18n();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [filter, setFilter] = useState<CalendarPillar | 'all'>('all');
  const [drag, setDrag] = useState<DragState | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const liveRef = useRef(events);
  liveRef.current = events;

  const reload = useCallback(() => {
    setEvents(getEventsForDate(date));
    onChange?.();
  }, [date, onChange]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Global pointer listeners while dragging (reliable on mobile + desktop)
  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      e.preventDefault();
      const dy = e.clientY - d.startY;
      if (d.mode === 'move') {
        const next = snapMinutes(d.startMin + dy / PX_PER_MIN);
        const ev = liveRef.current.find((x) => x.id === d.id);
        const dur = ev?.durationMin || 30;
        const clamped = Math.max(
          DAY_START_MIN,
          Math.min(DAY_END_MIN - Math.min(dur, 120), next)
        );
        setEvents((prev) =>
          prev.map((x) =>
            x.id === d.id ? { ...x, time: minutesToTime(clamped) } : x
          )
        );
      } else {
        const next = Math.max(
          SNAP_MIN,
          Math.min(8 * 60, snapMinutes(d.startDur + dy / PX_PER_MIN))
        );
        setEvents((prev) =>
          prev.map((x) => (x.id === d.id ? { ...x, durationMin: next } : x))
        );
      }
    };

    const onUp = () => {
      const d = dragRef.current;
      if (d) {
        const cur = liveRef.current.find((x) => x.id === d.id);
        if (cur) {
          if (d.mode === 'move' && cur.time) {
            moveEventToTime(d.id, cur.time);
          } else if (d.mode === 'resize' && cur.durationMin != null) {
            updateEvent(d.id, { durationMin: cur.durationMin });
          }
        }
        setEvents(getEventsForDate(date));
        onChange?.();
      }
      dragRef.current = null;
      setDrag(null);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, date, onChange]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let m = DAY_START_MIN; m < DAY_END_MIN; m += 60) list.push(m);
    return list;
  }, []);

  const labelFor = (ev: CalendarEvent) => {
    const key = eventTitleKey(ev);
    return key ? t(key) : ev.title;
  };

  const yToMinutes = (clientY: number) => {
    const el = boardRef.current;
    if (!el) return DAY_START_MIN;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top + el.scrollTop;
    const raw = DAY_START_MIN + y / PX_PER_MIN;
    return snapMinutes(
      Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - SNAP_MIN, raw))
    );
  };

  const placeAt = (blockKey: string, minutes: number) => {
    placeBlock(date, blockKey, minutesToTime(minutes));
    setPicked(null);
    reload();
  };

  const onBoardPointerUp = (e: React.PointerEvent) => {
    if (!picked) return;
    if ((e.target as HTMLElement).closest('[data-event-id]')) return;
    if (dragRef.current) return;
    placeAt(picked, yToMinutes(e.clientY));
  };

  const startMove = (ev: CalendarEvent, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const state: DragState = {
      id: ev.id,
      mode: 'move',
      startY: e.clientY,
      startMin: timeToMinutes(ev.time || '09:00'),
      startDur: ev.durationMin || 30,
    };
    dragRef.current = state;
    setDrag(state);
  };

  const startResize = (ev: CalendarEvent, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const state: DragState = {
      id: ev.id,
      mode: 'resize',
      startY: e.clientY,
      startMin: timeToMinutes(ev.time || '09:00'),
      startDur: ev.durationMin || 30,
    };
    dragRef.current = state;
    setDrag(state);
  };

  const toggle = (id: string) => {
    const before = events.find((e) => e.id === id);
    const updated = toggleEventComplete(id);
    if (updated?.completed && before && !before.completed) {
      const action = scoreActionForEventType(updated.type);
      if (action) logAction(action);
    }
    reload();
  };

  const palette =
    filter === 'all'
      ? ROUTINE_BLOCKS
      : ROUTINE_BLOCKS.filter((b) => b.pillar === filter);

  const completed = events.filter((e) => e.completed).length;

  const filters: { id: CalendarPillar | 'all'; label: string; color?: string }[] =
    [
      { id: 'all', label: t('agenda.all') },
      { id: 'salvation', label: 'S', color: pillarPalette('salvation').solid },
      { id: 'health', label: 'H', color: pillarPalette('health').solid },
      { id: 'freedom', label: 'F', color: pillarPalette('freedom').solid },
    ];

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[var(--sage)] leading-relaxed px-0.5">
        {picked ? t('calendar.tapToPlace') : t('calendar.dragHint')}
      </p>

      {/* Palette + S/H/F */}
      <div className="card-soft p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[var(--off-white)]">
            {t('calendar.palette')}
          </p>
          <div className="flex gap-1 p-0.5 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)]">
            {filters.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className="min-w-[2rem] min-h-[32px] px-2.5 rounded-lg text-[11px] font-bold transition-all"
                  style={
                    active
                      ? {
                          background:
                            tab.color || 'var(--accent-fill)',
                          color:
                            tab.id === 'salvation' ? '#0a0a0a' : '#0a120c',
                        }
                      : {
                          color: tab.color || 'var(--sage)',
                          background: 'transparent',
                        }
                  }
                  aria-pressed={active}
                  title={
                    tab.id === 'all'
                      ? t('agenda.all')
                      : t(
                          `nav.${tab.id === 'salvation' ? 'salvation' : tab.id}`
                        )
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {palette.map((b) => (
            <PaletteChip
              key={b.key}
              block={b}
              label={t(b.titleKey)}
              selected={picked === b.key}
              onPick={() => setPicked((p) => (p === b.key ? null : b.key))}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--sage)] px-0.5">
        <span>
          {completed}/{events.length} {t('agenda.done')}
        </span>
        {picked && (
          <button
            type="button"
            className="text-[var(--accent)] font-medium"
            onClick={() => setPicked(null)}
          >
            {t('common.cancel')}
          </button>
        )}
      </div>

      {/* Timeline */}
      <div
        className={`card-soft overflow-hidden relative ${
          picked ? 'ring-1 ring-white/40' : ''
        }`}
      >
        <div
          ref={boardRef}
          className="relative overflow-y-auto max-h-[min(58vh,520px)] select-none touch-pan-y"
          style={{ minHeight: 300 }}
          onPointerUp={onBoardPointerUp}
        >
          <div className="relative" style={{ height: TIMELINE_H }}>
            {hours.map((m) => {
              const top = (m - DAY_START_MIN) * PX_PER_MIN;
              const h = Math.floor(m / 60);
              return (
                <div
                  key={m}
                  className="absolute left-0 right-0 border-t border-[var(--border-soft)] pointer-events-none"
                  style={{ top }}
                >
                  <span className="absolute left-1 -top-2 text-[9px] text-[var(--sage)]/70 tabular-nums w-8">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              );
            })}

            {/* Clickable hour strips when placing */}
            {picked &&
              hours.map((m) => {
                const top = (m - DAY_START_MIN) * PX_PER_MIN;
                return (
                  <button
                    key={`slot-${m}`}
                    type="button"
                    className="absolute left-9 right-1 z-[5] hover:bg-white/5"
                    style={{ top, height: 60 * PX_PER_MIN }}
                    aria-label={`${String(Math.floor(m / 60)).padStart(2, '0')}:00`}
                    onClick={(e) => {
                      e.stopPropagation();
                      placeAt(picked, m);
                    }}
                  />
                );
              })}

            {events.map((ev) => {
              const start = timeToMinutes(ev.time || '09:00');
              const dur = Math.max(SNAP_MIN, ev.durationMin || 30);
              const top = Math.max(0, (start - DAY_START_MIN) * PX_PER_MIN);
              const maxH = TIMELINE_H - top;
              const height = Math.min(maxH, Math.max(32, dur * PX_PER_MIN));
              const pal = pillarPalette(ev.pillar);
              const isDragging = drag?.id === ev.id;

              return (
                <div
                  key={ev.id}
                  data-event-id={ev.id}
                  className={`absolute left-9 right-2 rounded-xl border z-10 ${
                    isDragging ? 'z-30 shadow-lg scale-[1.02]' : ''
                  } ${ev.completed ? 'opacity-55' : ''}`}
                  style={{
                    top,
                    height,
                    background: pal.soft,
                    borderColor: pal.border,
                  }}
                >
                  <div className="flex items-stretch h-full gap-1 px-1.5 py-1">
                    {/* Drag handle */}
                    <button
                      type="button"
                      className="w-5 shrink-0 flex items-center justify-center text-[10px] opacity-70 cursor-grab active:cursor-grabbing touch-none"
                      style={{ color: pal.text }}
                      aria-label={t('calendar.move')}
                      onPointerDown={(e) => startMove(ev, e)}
                    >
                      ⋮⋮
                    </button>

                    <button
                      type="button"
                      onClick={() => toggle(ev.id)}
                      className={`mt-0.5 w-5 h-5 rounded-full border shrink-0 flex items-center justify-center text-[10px] ${
                        ev.completed
                          ? 'bg-white text-black border-white'
                          : 'border-white/35'
                      }`}
                      style={{ borderColor: ev.completed ? pal.solid : undefined }}
                    >
                      {ev.completed ? '✓' : ''}
                    </button>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p
                        className={`text-[11px] font-semibold leading-tight truncate ${
                          ev.completed ? 'line-through opacity-60' : ''
                        }`}
                        style={{ color: pal.text }}
                      >
                        {labelFor(ev)}
                      </p>
                      <p className="text-[9px] opacity-60 tabular-nums" style={{ color: pal.text }}>
                        {ev.time || '--:--'}
                        {dur ? ` · ${dur}m` : ''}
                      </p>
                    </div>

                    <div className="flex flex-col justify-between shrink-0 py-0.5">
                      <button
                        type="button"
                        className="text-[10px] px-1 opacity-70"
                        style={{ color: pal.text }}
                        onClick={() => {
                          const cur = timeToMinutes(ev.time || '09:00');
                          moveEventToTime(ev.id, minutesToTime(cur - SNAP_MIN));
                          reload();
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="text-[10px] px-1 opacity-70"
                        style={{ color: pal.text }}
                        onClick={() => {
                          const cur = timeToMinutes(ev.time || '09:00');
                          moveEventToTime(ev.id, minutesToTime(cur + SNAP_MIN));
                          reload();
                        }}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-red-300/90 px-1"
                        onClick={() => {
                          removeEvent(ev.id);
                          reload();
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Resize handle */}
                  <div
                    className="absolute bottom-0 left-3 right-3 h-3 cursor-ns-resize touch-none flex items-end justify-center"
                    onPointerDown={(e) => startResize(ev, e)}
                  >
                    <span
                      className="w-8 h-1 rounded-full opacity-50 mb-0.5"
                      style={{ background: pal.solid }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
      className={`text-[11px] px-2.5 py-1.5 rounded-full border font-medium transition-all min-h-[32px] ${
        selected ? 'ring-2 ring-offset-1 ring-offset-[#040404] scale-[1.04]' : ''
      }`}
      style={{
        background: pal.soft,
        borderColor: pal.border,
        color: pal.text,
        outlineColor: pal.solid,
      }}
    >
      {label}
    </button>
  );
}
