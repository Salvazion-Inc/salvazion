'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
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
  agendaBlockHeightPx,
  agendaBlockLayout,
  hrefForCalendarEvent,
  seedDefaultDay,
  todayStr,
  DAY_START_MIN,
  DAY_END_MIN,
  SNAP_MIN,
  DEFAULT_BLOCK_MIN,
  type CalendarEvent,
  type CalendarPillar,
  type AgendaBlockDef,
} from '@/lib/calendar/engine';
import {
  pillarPalette,
  agendaEventPhase,
  agendaEventProgress,
  agendaEventRemainingMin,
} from '@/lib/calendar/colors';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';
import { useFlashToast } from '@/components/ui/FlashToast';
import AgendaActivityFace from '@/components/calendar/AgendaActivityFace';

type Props = {
  date: string;
  onChange?: () => void;
};

type EditDraft = {
  id: string;
  time: string;
  durationMin: number;
};

function isDraftDirty(draft: EditDraft, events: CalendarEvent[]): boolean {
  const ev = events.find((e) => e.id === draft.id);
  if (!ev) return false;
  return (
    (ev.time || '00:00') !== draft.time ||
    (ev.durationMin || DEFAULT_BLOCK_MIN) !== draft.durationMin
  );
}

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
  const { t, lang } = useI18n();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [attachTime, setAttachTime] = useState('08:00');
  const [attachDur, setAttachDur] = useState(DEFAULT_BLOCK_MIN);
  const [filter, setFilter] = useState<CalendarPillar | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [now, setNow] = useState(() => new Date());
  const nowBlockRef = useRef<HTMLDivElement | null>(null);
  const didScrollRef = useRef(false);
  const { flash, toast: saveToast } = useFlashToast();

  const sync = useCallback(() => {
    setEvents(getEventsForDate(date));
    onChange?.();
  }, [date, onChange]);

  useEffect(() => {
    setPicked(null);
    setExpandedId(null);
    setEditDraft(null);
    didScrollRef.current = false;
    seedDefaultDay(date);
    setEvents(getEventsForDate(date));
  }, [date]);

  // Live clock so the "Ahora" block tracks the user's local time.
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 15_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

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
    flash(t('common.changesSaved'));
  };

  const openEditor = (ev: CalendarEvent) => {
    setExpandedId(ev.id);
    setEditDraft({
      id: ev.id,
      time: ev.time || '00:00',
      durationMin: ev.durationMin || DEFAULT_BLOCK_MIN,
    });
  };

  const closeEditor = (opts?: { discard?: boolean }) => {
    if (
      opts?.discard !== true &&
      editDraft &&
      isDraftDirty(editDraft, events)
    ) {
      // Keep open if dirty and not explicitly discarding
      return;
    }
    setExpandedId(null);
    setEditDraft(null);
  };

  const toggleEditor = (ev: CalendarEvent) => {
    if (expandedId === ev.id) {
      if (editDraft && isDraftDirty(editDraft, events)) {
        // Closing with unsaved edits — use Cancel or Guardar
        flash(t('common.unsavedChanges'));
        return;
      }
      closeEditor({ discard: true });
      return;
    }
    if (
      expandedId &&
      editDraft &&
      isDraftDirty(editDraft, events) &&
      expandedId !== ev.id
    ) {
      flash(t('common.unsavedChanges'));
      return;
    }
    openEditor(ev);
  };

  const patchDraft = (patch: Partial<Omit<EditDraft, 'id'>>) => {
    setEditDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const moveDraftBy = (deltaMin: number) => {
    setEditDraft((d) => {
      if (!d) return d;
      const next = snapMinutes(
        Math.max(
          DAY_START_MIN,
          Math.min(
            DAY_END_MIN - SNAP_MIN,
            timeToMinutes(d.time || '00:00') + deltaMin
          )
        )
      );
      return { ...d, time: minutesToTime(next) };
    });
  };

  const bumpDraftDuration = (deltaMin: number) => {
    setEditDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        durationMin: Math.max(SNAP_MIN, d.durationMin + deltaMin),
      };
    });
  };

  const saveDraft = () => {
    if (!editDraft) return;
    const ev = events.find((e) => e.id === editDraft.id);
    if (!ev) return;
    const timeChanged = (ev.time || '00:00') !== editDraft.time;
    const durChanged =
      (ev.durationMin || DEFAULT_BLOCK_MIN) !== editDraft.durationMin;
    if (!timeChanged && !durChanged) {
      flash(t('common.saved'));
      setExpandedId(null);
      setEditDraft(null);
      return;
    }
    if (timeChanged) moveEventToTime(editDraft.id, editDraft.time);
    if (durChanged) {
      updateEvent(editDraft.id, {
        durationMin: Math.max(SNAP_MIN, editDraft.durationMin),
      });
    }
    sync();
    flash(t('common.changesSaved'));
    setExpandedId(null);
    setEditDraft(null);
  };

  /** Explicit yes / no completion (not only toggle). */
  const setDone = (id: string, done: boolean) => {
    const before = events.find((e) => e.id === id);
    if (!before) return;
    if (!!before.completed === done) return;
    const wasDoneBefore = events.filter((e) => e.completed).length;
    const updated = toggleEventComplete(id);
    if (updated?.completed && before && !before.completed) {
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
    } else {
      flash(t('common.updated'));
    }
    sync();
  };

  const remove = (id: string) => {
    removeEvent(id);
    if (expandedId === id) {
      setExpandedId(null);
      setEditDraft(null);
    }
    sync();
    flash(t('common.updated'));
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
  const pickedPal = pickedDef ? pillarPalette(pickedDef.pillar) : null;
  const isToday = date === todayStr();

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) =>
        (a.time || '99:99').localeCompare(b.time || '99:99')
      ),
    [events]
  );

  const currentEventId = useMemo(() => {
    if (!isToday) return null;
    for (const ev of sortedEvents) {
      const end = endTimeOf(ev);
      if (agendaEventPhase(ev.time, end, now) === 'now') return ev.id;
    }
    return null;
  }, [isToday, sortedEvents, now]);

  // Scroll current block into view once per day selection.
  useEffect(() => {
    if (!currentEventId || didScrollRef.current) return;
    const el = nowBlockRef.current;
    if (!el) return;
    didScrollRef.current = true;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [currentEventId, sortedEvents.length]);

  const clockLabel = useMemo(() => {
    try {
      return now.toLocaleTimeString(lang === 'es' ? 'es' : 'en', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
    }
  }, [now, lang]);

  const filters: { id: CalendarPillar | 'all'; label: string; color?: string }[] = [
    { id: 'all', label: t('agenda.all') },
    { id: 'salvation', label: 'S', color: pillarPalette('salvation').solid },
    { id: 'health', label: 'H', color: pillarPalette('health').solid },
    { id: 'freedom', label: 'F', color: pillarPalette('freedom').solid },
  ];

  return (
    <div className="space-y-3">
      {saveToast}
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
      {picked && pickedDef && pickedPal && (
        <div
          className="card-soft p-3 space-y-2.5 border"
          style={{ borderColor: pickedPal.border }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">
              {t('calendar.attachTitle')}
            </p>
            <p
              className="text-sm font-semibold"
              style={{
                // Attach panel sits on dark chrome — use solid (light), not plate ink
                color: pickedPal.lightPlate ? pickedPal.solid : pickedPal.text,
              }}
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

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={attachToCalendar}
            >
              {t('calendar.attach')}
            </button>
            <button
              type="button"
              className="btn-secondary"
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
            const layout = agendaBlockLayout(durMin);
            const blockH = agendaBlockHeightPx(durMin);
            const isNow = isToday && currentEventId === ev.id;
            const phase = isToday
              ? agendaEventPhase(ev.time, end, now)
              : 'future';
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
            const draft =
              expanded && editDraft?.id === ev.id ? editDraft : null;
            const dirty = draft ? isDraftDirty(draft, events) : false;
            const displayTime = draft?.time ?? ev.time ?? '00:00';
            const displayDur =
              draft?.durationMin ?? ev.durationMin ?? DEFAULT_BLOCK_MIN;
            const displayEnd = draft
              ? endTimeOf({
                  ...ev,
                  time: draft.time,
                  durationMin: draft.durationMin,
                })
              : end;

            return (
              <div
                key={ev.id}
                ref={isNow ? nowBlockRef : undefined}
                role="listitem"
                className={`rounded-xl border overflow-hidden transition-all relative ${
                  isNow ? 'now-block' : ''
                } ${done && !isNow ? 'opacity-80' : ''} ${
                  phase === 'past' && !isNow ? 'opacity-75' : ''
                }`}
                style={
                  {
                    // CSS var drives glow / badge accent from pillar color
                    '--now-glow': pal.solid,
                    // Salvation = light plate + dark ink (Oración, Devocional…)
                    background: isNow
                      ? pal.lightPlate
                        ? `linear-gradient(135deg, ${pal.soft} 0%, color-mix(in srgb, ${pal.solid} 72%, #c8d0c8) 100%)`
                        : `linear-gradient(135deg, ${pal.soft} 0%, color-mix(in srgb, ${pal.solid} 22%, #0a120c) 100%)`
                      : pal.soft,
                    borderColor: isNow
                      ? pal.lightPlate
                        ? 'color-mix(in srgb, #121412 28%, #F5F7F5)'
                        : pal.solid
                      : expanded || dirty
                        ? pal.solid
                        : pal.border,
                    borderWidth: isNow || dirty ? 1.5 : 1,
                    boxShadow: isNow
                      ? undefined
                      : expanded || dirty
                        ? `0 0 0 1px ${pal.solid}33`
                        : undefined,
                    transform: isNow ? 'scale(1.01)' : undefined,
                  } as CSSProperties
                }
                data-duration-min={durMin}
                data-layout={layout}
                data-phase={isToday ? phase : undefined}
                data-pillar={ev.pillar}
                aria-current={isNow ? 'true' : undefined}
              >
                {/* Height scales with duration; compact = single-line type face */}
                <div
                  className={`transition-[height,min-height] duration-500 relative ${
                    layout === 'compact'
                      ? 'px-2 py-1'
                      : layout === 'cozy'
                        ? 'px-2.5 py-1.5'
                        : 'px-2.5 py-2'
                  }`}
                  style={{
                    height: blockH,
                    minHeight: blockH,
                    paddingBottom: isNow && layout !== 'compact' ? 10 : undefined,
                  }}
                >
                  <AgendaActivityFace
                    layout={layout}
                    title={labelFor(ev)}
                    timeLabel={isNow && !draft ? clockLabel : displayTime}
                    rangeLabel={
                      layout === 'compact'
                        ? undefined
                        : isNow && !draft
                          ? `${ev.time || '00:00'}–${end}`
                          : `→ ${displayEnd}`
                    }
                    durationMin={displayDur}
                    pillar={ev.pillar}
                    pal={pal}
                    done={done}
                    isNow={isNow}
                    openHref={hrefForCalendarEvent(ev)}
                    openLabel={t('agenda.openActivity', { title: labelFor(ev) })}
                    onEdit={() => toggleEditor(ev)}
                    editLabel={t('agenda.editSchedule')}
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
                          borderColor: isNow
                            ? pal.lightPlate
                              ? 'color-mix(in srgb, #121412 30%, transparent)'
                              : pal.solid
                            : pal.border,
                          boxShadow: isNow
                            ? `0 0 10px color-mix(in srgb, ${pal.solid} 25%, transparent)`
                            : undefined,
                        }}
                        role="group"
                        aria-label={t('calendar.fulfilled')}
                      >
                        <button
                          type="button"
                          onClick={() => setDone(ev.id, true)}
                          style={{
                            background: done
                              ? pal.lightPlate
                                ? '#121412'
                                : pal.solid
                              : 'transparent',
                            color: done
                              ? pal.lightPlate
                                ? '#F5F7F5'
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
                          style={{
                            borderColor: pal.border,
                            background: !done
                              ? pal.lightPlate
                                ? 'rgba(18, 20, 18, 0.12)'
                                : 'rgba(0,0,0,0.35)'
                              : 'transparent',
                            color: !done
                              ? pal.lightPlate
                                ? pal.text
                                : pal.control
                              : pal.muted,
                          }}
                          aria-pressed={!done}
                          title={t('calendar.noPending')}
                        >
                          {t('calendar.no')}
                        </button>
                      </div>
                    }
                  />

                  {/* Elapsed progress inside current block */}
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
                </div>

                {expanded && draft && (
                  <div
                    className="px-2.5 pb-2.5 pt-1 space-y-2 border-t"
                    style={{ borderColor: `${pal.border}` }}
                  >
                    <Link
                      href={hrefForCalendarEvent(ev)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                      style={{ color: pal.lightPlate ? pal.solid : pal.text }}
                    >
                      {t('agenda.openActivity', { title: labelFor(ev) })}
                      <span aria-hidden>→</span>
                    </Link>
                    {dirty && (
                      <p
                        className="text-[10px] font-medium"
                        style={{ color: pal.text }}
                      >
                        {t('common.unsavedChanges')}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className="flex items-center gap-1 text-[10px]"
                        style={{ color: pal.muted }}
                      >
                        <span>{t('calendar.time')}</span>
                        <select
                          value={draft.time}
                          onChange={(e) =>
                            patchDraft({ time: e.target.value })
                          }
                          className="min-h-[30px] rounded-md border bg-[var(--true-black)] px-1.5 text-[11px] text-[var(--off-white)]"
                          style={{ borderColor: pal.border }}
                        >
                          {!TIME_OPTIONS.includes(draft.time) && (
                            <option value={draft.time}>{draft.time}</option>
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
                          value={draft.durationMin}
                          onChange={(e) =>
                            patchDraft({
                              durationMin: Number(e.target.value),
                            })
                          }
                          className="min-h-[30px] rounded-md border bg-[var(--true-black)] px-1.5 text-[11px] text-[var(--off-white)]"
                          style={{ borderColor: pal.border }}
                        >
                          {!DURATION_OPTIONS.includes(draft.durationMin) && (
                            <option value={draft.durationMin}>
                              {formatDurationHours(draft.durationMin)}
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
                    <div className="btn-toolbar">
                      <button
                        type="button"
                        className="btn-outline-sm"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() => moveDraftBy(-SNAP_MIN)}
                        aria-label="-15 min"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn-outline-sm"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() => moveDraftBy(SNAP_MIN)}
                        aria-label="+15 min"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="btn-outline-sm"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() => bumpDraftDuration(-15)}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="btn-outline-sm"
                        style={{ borderColor: pal.border, color: pal.text }}
                        onClick={() => bumpDraftDuration(15)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="btn-ghost text-red-400/85 ml-auto"
                        onClick={() => remove(ev.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        className="btn-secondary text-sm py-2"
                        onClick={() => closeEditor({ discard: true })}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        className="btn-primary text-sm py-2"
                        onClick={saveDraft}
                        disabled={!dirty}
                        style={
                          dirty
                            ? undefined
                            : { opacity: 0.55, cursor: 'not-allowed' }
                        }
                      >
                        {dirty ? t('common.saveChanges') : t('common.saved')}
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
        borderColor: selected
          ? pal.lightPlate
            ? 'color-mix(in srgb, #121412 40%, #F5F7F5)'
            : pal.solid
          : pal.border,
        color: pal.text,
        boxShadow: selected
          ? `0 0 0 1px ${pal.lightPlate ? 'rgba(18,20,18,0.25)' : pal.solid + '44'}`
          : undefined,
      }}
    >
      {label}
    </button>
  );
}
