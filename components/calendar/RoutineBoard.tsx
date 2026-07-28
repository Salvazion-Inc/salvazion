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
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

const PX_PER_MIN = 1.15;
const TIMELINE_H = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN;

type Props = {
  date: string;
  onChange?: () => void;
};

/**
 * Drag-and-drop day board: palette of routine blocks → timeline.
 * Three pillar colors. Mobile-friendly (tap palette + tap hour, or drag).
 */
export default function RoutineBoard({ date, onChange }: Props) {
  const { t } = useI18n();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CalendarPillar | 'all'>('all');
  const boardRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(() => {
    setEvents(getEventsForDate(date));
    onChange?.();
  }, [date, onChange]);

  useEffect(() => {
    reload();
  }, [reload]);

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
    return snapMinutes(Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - SNAP_MIN, raw)));
  };

  const placeAt = (blockKey: string, minutes: number) => {
    placeBlock(date, blockKey, minutesToTime(minutes));
    setPicked(null);
    reload();
  };

  const onBoardClick = (e: React.MouseEvent) => {
    if (!picked) return;
    // ignore clicks on blocks
    if ((e.target as HTMLElement).closest('[data-event-id]')) return;
    placeAt(picked, yToMinutes(e.clientY));
  };

  const onBoardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const blockKey = e.dataTransfer.getData('application/x-salvazion-block');
    const eventId = e.dataTransfer.getData('application/x-salvazion-event');
    const mins = yToMinutes(e.clientY);
    if (blockKey) {
      placeAt(blockKey, mins);
      return;
    }
    if (eventId) {
      moveEventToTime(eventId, minutesToTime(mins));
      setDragId(null);
      reload();
    }
  };

  const onEventPointerDown = (ev: CalendarEvent, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDragId(ev.id);
    const startY = e.clientY;
    const startMin = timeToMinutes(ev.time || '09:00');

    const onMove = (pe: PointerEvent) => {
      const dy = pe.clientY - startY;
      const next = snapMinutes(startMin + dy / PX_PER_MIN);
      const clamped = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - (ev.durationMin || 30), next));
      // optimistic UI
      setEvents((prev) =>
        prev.map((x) =>
          x.id === ev.id ? { ...x, time: minutesToTime(clamped) } : x
        )
      );
    };
    const onUp = (pe: PointerEvent) => {
      target.releasePointerCapture(pe.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      const dy = pe.clientY - startY;
      const next = snapMinutes(startMin + dy / PX_PER_MIN);
      const clamped = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - (ev.durationMin || 30), next));
      moveEventToTime(ev.id, minutesToTime(clamped));
      setDragId(null);
      reload();
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
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

  const palette = filter === 'all'
    ? ROUTINE_BLOCKS
    : ROUTINE_BLOCKS.filter((b) => b.pillar === filter);

  const completed = events.filter((e) => e.completed).length;

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[var(--sage)] leading-relaxed px-0.5">
        {picked ? t('calendar.tapToPlace') : t('calendar.dragHint')}
      </p>

      {/* Palette */}
      <div className="card-soft p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[var(--off-white)]">
            {t('calendar.palette')}
          </p>
          <div className="segment-soft !p-0.5">
            {(
              [
                { id: 'all' as const, label: t('agenda.all') },
                { id: 'salvation' as const, label: 'S' },
                { id: 'health' as const, label: 'H' },
                { id: 'freedom' as const, label: 'F' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-active={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className="!px-2 !py-1 text-[10px] min-w-[1.75rem]"
                title={
                  tab.id === 'all'
                    ? t('agenda.all')
                    : t(`nav.${tab.id === 'salvation' ? 'salvation' : tab.id}`)
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
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
            className="text-[var(--accent)]"
            onClick={() => setPicked(null)}
          >
            {t('common.cancel')}
          </button>
        )}
      </div>

      {/* Timeline */}
      <div
        className={`card-soft overflow-hidden relative ${
          picked ? 'ring-1 ring-[var(--accent)]' : ''
        }`}
      >
        <div
          ref={boardRef}
          className="relative overflow-y-auto max-h-[min(58vh,520px)] select-none"
          style={{ minHeight: 280 }}
          onClick={onBoardClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onBoardDrop}
        >
          <div className="relative" style={{ height: TIMELINE_H }}>
            {/* Hour lines */}
            {hours.map((m) => {
              const top = (m - DAY_START_MIN) * PX_PER_MIN;
              const h = Math.floor(m / 60);
              return (
                <div
                  key={m}
                  className="absolute left-0 right-0 border-t border-[var(--border-soft)]"
                  style={{ top }}
                >
                  <span className="absolute left-1 -top-2 text-[9px] text-[var(--sage)]/70 tabular-nums w-8">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              );
            })}

            {/* Events */}
            {events.map((ev) => {
              const start = timeToMinutes(ev.time || '09:00');
              const dur = Math.max(SNAP_MIN, ev.durationMin || 30);
              // Sleep spanning midnight: clamp visible height in timeline
              const top = Math.max(0, (start - DAY_START_MIN) * PX_PER_MIN);
              const maxH = TIMELINE_H - top;
              const height = Math.min(maxH, Math.max(28, dur * PX_PER_MIN));
              const color =
                ev.pillar === 'salvation'
                  ? '#7BC98A'
                  : ev.pillar === 'health'
                    ? '#5BA88A'
                    : '#A8D4AE';

              return (
                <div
                  key={ev.id}
                  data-event-id={ev.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-salvazion-event', ev.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDragId(ev.id);
                  }}
                  onDragEnd={() => setDragId(null)}
                  onPointerDown={(e) => onEventPointerDown(ev, e)}
                  className={`absolute left-10 right-2 rounded-xl border px-2 py-1 cursor-grab active:cursor-grabbing touch-none ${
                    dragId === ev.id ? 'opacity-90 z-20 scale-[1.02]' : 'z-10'
                  } ${ev.completed ? 'opacity-60' : ''}`}
                  style={{
                    top,
                    height,
                    background: `color-mix(in srgb, ${color} 28%, #040404)`,
                    borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
                    boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 20%, transparent)`,
                  }}
                >
                  <div className="flex items-start gap-1.5 h-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(ev.id);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`mt-0.5 w-5 h-5 rounded-full border shrink-0 flex items-center justify-center text-[10px] ${
                        ev.completed
                          ? 'bg-[var(--accent-fill)] border-[var(--accent)] text-[#0a120c]'
                          : 'border-white/40'
                      }`}
                    >
                      {ev.completed ? '✓' : ''}
                    </button>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p
                        className={`text-[11px] font-semibold leading-tight truncate ${
                          ev.completed ? 'line-through text-white/50' : 'text-white'
                        }`}
                      >
                        {labelFor(ev)}
                      </p>
                      <p className="text-[9px] text-white/55 tabular-nums">
                        {ev.time || '--:--'}
                        {dur ? ` · ${dur}m` : ''}
                      </p>
                    </div>
                    <div
                      className="flex flex-col gap-0.5 shrink-0"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="text-[9px] text-white/70 px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = timeToMinutes(ev.time || '09:00');
                          moveEventToTime(ev.id, minutesToTime(cur - SNAP_MIN));
                          reload();
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="text-[9px] text-white/70 px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = timeToMinutes(ev.time || '09:00');
                          moveEventToTime(ev.id, minutesToTime(cur + SNAP_MIN));
                          reload();
                        }}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="text-[9px] text-red-300/80 px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEvent(ev.id);
                          reload();
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {/* duration resize handle */}
                  <div
                    className="absolute bottom-0 left-2 right-2 h-2 cursor-ns-resize"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const startY = e.clientY;
                      const startDur = ev.durationMin || 30;
                      const el = e.currentTarget;
                      el.setPointerCapture(e.pointerId);
                      const onMove = (pe: PointerEvent) => {
                        const dMin = snapMinutes(startDur + (pe.clientY - startY) / PX_PER_MIN);
                        const next = Math.max(SNAP_MIN, Math.min(8 * 60, dMin));
                        setEvents((prev) =>
                          prev.map((x) =>
                            x.id === ev.id ? { ...x, durationMin: next } : x
                          )
                        );
                      };
                      const onUp = (pe: PointerEvent) => {
                        el.releasePointerCapture(pe.pointerId);
                        el.removeEventListener('pointermove', onMove);
                        el.removeEventListener('pointerup', onUp);
                        const dMin = snapMinutes(startDur + (pe.clientY - startY) / PX_PER_MIN);
                        const next = Math.max(SNAP_MIN, Math.min(8 * 60, dMin));
                        updateEvent(ev.id, { durationMin: next });
                        reload();
                      };
                      el.addEventListener('pointermove', onMove);
                      el.addEventListener('pointerup', onUp);
                    }}
                  />
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
  const color =
    block.pillar === 'salvation'
      ? '#7BC98A'
      : block.pillar === 'health'
        ? '#5BA88A'
        : '#A8D4AE';

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-salvazion-block', block.key);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={onPick}
      className={`text-[11px] px-2.5 py-1.5 rounded-full border font-medium transition-all ${
        selected ? 'ring-2 ring-[var(--accent)] scale-[1.03]' : ''
      }`}
      style={{
        background: `color-mix(in srgb, ${color} 22%, #040404)`,
        borderColor: `color-mix(in srgb, ${color} 50%, transparent)`,
        color: '#D8E1D9',
      }}
    >
      {label}
    </button>
  );
}
