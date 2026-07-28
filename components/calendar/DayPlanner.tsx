'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DAILY_AGENDA_BLOCKS,
  ensureDayAgenda,
  getEventsForDate,
  addEvent,
  removeEvent,
  updateEvent,
  toggleEventComplete,
  scoreActionForEventType,
  eventTitleKey,
  todayStr,
  type CalendarEvent,
  type CalendarPillar,
  type CalendarEventType,
} from '@/lib/calendar/engine';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

const PILLAR_IMG: Record<CalendarPillar, string> = {
  salvation: '/icons/agenda/salvation.jpg',
  health: '/icons/agenda/health.jpg',
  freedom: '/icons/agenda/freedom.jpg',
};

type Props = {
  date: string;
  onChange?: () => void;
  className?: string;
};

/**
 * Editable day planner — fill the day with Salvation · Health · Freedom blocks.
 */
export default function DayPlanner({ date, onChange, className = '' }: Props) {
  const { t } = useI18n();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = useCallback(() => {
    ensureDayAgenda(date);
    setEvents(getEventsForDate(date));
    onChange?.();
  }, [date, onChange]);

  useEffect(() => {
    reload();
  }, [reload]);

  const usedTypes = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) {
      if (e.type !== 'custom') s.add(e.type);
    }
    return s;
  }, [events]);

  const completed = events.filter((e) => e.completed).length;
  const total = events.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const labelFor = (ev: CalendarEvent) => {
    const key = eventTitleKey(ev);
    if (key) return t(key);
    // title may be block key
    const byKey = DAILY_AGENDA_BLOCKS.find((b) => b.key === ev.title);
    if (byKey) return t(byKey.titleKey);
    return ev.title;
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

  const addBlock = (type: CalendarEventType) => {
    const def = DAILY_AGENDA_BLOCKS.find((b) => b.type === type);
    if (!def) return;
    if (usedTypes.has(type)) return;
    addEvent({
      title: def.key,
      pillar: def.pillar,
      type: def.type,
      date,
      time: def.time || '09:00',
      durationMin: def.durationMin || 30,
      recurring: null,
      notes: def.titleKey,
    });
    setShowPalette(false);
    reload();
  };

  const addCustom = () => {
    addEvent({
      title: t('calendar.customBlock'),
      pillar: 'salvation',
      type: 'custom',
      date,
      time: '12:00',
      durationMin: 30,
      recurring: null,
    });
    setShowPalette(false);
    reload();
  };

  const availableBlocks = DAILY_AGENDA_BLOCKS.filter((b) => !usedTypes.has(b.type));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {t('calendar.planner')}
          </p>
          <p className="text-sm text-[var(--off-white)]">
            {completed}/{total} · {pct}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPalette((v) => !v)}
          className="btn-sm"
        >
          + {t('calendar.addBlock')}
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border-soft)]">
        <div
          className="h-full rounded-full bg-[var(--accent-fill)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {showPalette && (
        <div className="card-soft p-3 space-y-3 border border-[var(--border-strong)]">
          <p className="text-xs text-[var(--sage)]">{t('calendar.pickBlock')}</p>
          {(['salvation', 'health', 'freedom'] as CalendarPillar[]).map((pillar) => {
            const blocks = availableBlocks.filter((b) => b.pillar === pillar);
            if (!blocks.length) return null;
            return (
              <div key={pillar}>
                <p
                  className="text-[10px] uppercase tracking-wider mb-1.5"
                  style={{
                    color:
                      pillar === 'salvation'
                        ? 'var(--accent)'
                        : pillar === 'health'
                          ? 'var(--soft-green)'
                          : 'var(--accent-hover)',
                  }}
                >
                  {t(`nav.${pillar === 'salvation' ? 'salvation' : pillar}`)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {blocks.map((b) => (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => addBlock(b.type)}
                      className="chip-soft text-[11px] hover:border-[var(--border-strong)]"
                    >
                      + {t(b.titleKey)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <button type="button" onClick={addCustom} className="btn-secondary text-sm py-2">
            + {t('calendar.customBlock')}
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="card-soft p-6 text-center">
          <p className="text-sm text-[var(--sage)] mb-3">{t('calendar.emptyDay')}</p>
          <button type="button" onClick={() => setShowPalette(true)} className="btn-primary">
            {t('calendar.fillDay')}
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => {
            const def = DAILY_AGENDA_BLOCKS.find((b) => b.type === ev.type);
            const isEditing = editingId === ev.id;
            const pillarColor =
              ev.pillar === 'salvation'
                ? 'var(--accent)'
                : ev.pillar === 'health'
                  ? 'var(--soft-green)'
                  : 'var(--accent-hover)';

            return (
              <li
                key={ev.id}
                className={`card-soft p-3 border transition-all ${
                  ev.completed ? 'opacity-75' : ''
                }`}
                style={{
                  borderColor: `color-mix(in srgb, ${pillarColor} 35%, transparent)`,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggle(ev.id)}
                    className={`mt-0.5 w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      ev.completed
                        ? 'border-[var(--accent)] bg-[var(--accent-fill)] text-[#0a120c]'
                        : 'border-[var(--border-strong)]'
                    }`}
                    aria-pressed={!!ev.completed}
                  >
                    {ev.completed ? <span className="text-xs font-bold">✓</span> : null}
                  </button>

                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[var(--border-soft)] shrink-0">
                    <Image
                      src={PILLAR_IMG[ev.pillar]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {isEditing && ev.type === 'custom' ? (
                      <input
                        className="input-soft py-1.5 text-sm mb-1"
                        value={ev.title}
                        onChange={(e) => {
                          updateEvent(ev.id, { title: e.target.value });
                          setEvents(getEventsForDate(date));
                        }}
                      />
                    ) : (
                      <p
                        className={`text-sm font-medium ${
                          ev.completed
                            ? 'line-through text-[var(--sage)]'
                            : 'text-[var(--off-white)]'
                        }`}
                      >
                        {labelFor(ev)}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <label className="flex items-center gap-1 text-[10px] text-[var(--sage)]">
                        <span>{t('calendar.time')}</span>
                        <input
                          type="time"
                          value={ev.time || '09:00'}
                          onChange={(e) => {
                            updateEvent(ev.id, { time: e.target.value });
                            setEvents(getEventsForDate(date));
                          }}
                          className="bg-[var(--surface)] border border-[var(--border-soft)] rounded-lg px-1.5 py-1 text-[11px] text-[var(--off-white)]"
                        />
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-[var(--sage)]">
                        <span>min</span>
                        <input
                          type="number"
                          min={5}
                          max={240}
                          step={5}
                          value={ev.durationMin || 30}
                          onChange={(e) => {
                            updateEvent(ev.id, {
                              durationMin: Math.max(5, Number(e.target.value) || 30),
                            });
                            setEvents(getEventsForDate(date));
                          }}
                          className="w-14 bg-[var(--surface)] border border-[var(--border-soft)] rounded-lg px-1.5 py-1 text-[11px] text-[var(--off-white)]"
                        />
                      </label>
                      {ev.type === 'custom' && (
                        <select
                          value={ev.pillar}
                          onChange={(e) => {
                            updateEvent(ev.id, {
                              pillar: e.target.value as CalendarPillar,
                            });
                            setEvents(getEventsForDate(date));
                          }}
                          className="bg-[var(--surface)] border border-[var(--border-soft)] rounded-lg px-1.5 py-1 text-[11px]"
                        >
                          <option value="salvation">{t('nav.salvation')}</option>
                          <option value="health">{t('nav.health')}</option>
                          <option value="freedom">{t('nav.freedom')}</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    {def?.href && (
                      <Link
                        href={def.href}
                        className="text-[10px] text-[var(--accent)] px-1.5 py-1"
                      >
                        {t('agenda.open')}
                      </Link>
                    )}
                    {ev.type === 'custom' && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingId(isEditing ? null : ev.id)
                        }
                        className="text-[10px] text-[var(--sage)]"
                      >
                        {isEditing ? t('common.save') : t('common.edit')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        removeEvent(ev.id);
                        reload();
                      }}
                      className="text-[10px] text-red-400/80"
                      aria-label={t('common.delete')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {date === todayStr() && (
        <p className="text-[10px] text-center text-[var(--sage)]/70">
          {t('calendar.homeHint')}
        </p>
      )}
    </div>
  );
}
