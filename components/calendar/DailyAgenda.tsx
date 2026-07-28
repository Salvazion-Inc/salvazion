'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DAILY_AGENDA_BLOCKS,
  ensureDayAgenda,
  toggleEventComplete,
  scoreActionForEventType,
  todayStr,
  type CalendarEvent,
  type CalendarPillar,
} from '@/lib/calendar/engine';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

const PILLAR_META: Record<
  CalendarPillar,
  { image: string; color: string }
> = {
  salvation: {
    image: '/icons/agenda/salvation.jpg',
    color: 'var(--accent)',
  },
  health: {
    image: '/icons/agenda/health.jpg',
    color: 'var(--soft-green)',
  },
  freedom: {
    image: '/icons/agenda/freedom.jpg',
    color: 'var(--accent-hover)',
  },
};

type Props = {
  onScored?: () => void;
  className?: string;
};

/**
 * Home daily agenda — one-tap blocks for Salvation · Health · Freedom.
 */
export default function DailyAgenda({ onScored, className = '' }: Props) {
  const { t } = useI18n();
  const date = todayStr();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filter, setFilter] = useState<CalendarPillar | 'all'>('all');

  const reload = useCallback(() => {
    setEvents(ensureDayAgenda(date));
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  const byPillar = useMemo(() => {
    const groups: Record<CalendarPillar, CalendarEvent[]> = {
      salvation: [],
      health: [],
      freedom: [],
    };
    for (const e of events) {
      if (groups[e.pillar]) groups[e.pillar].push(e);
    }
    return groups;
  }, [events]);

  const completed = events.filter((e) => e.completed).length;
  const total = events.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const toggle = (id: string) => {
    const before = events.find((e) => e.id === id);
    const updated = toggleEventComplete(id);
    if (!updated) return;
    // Award score when marking complete (not when uncompleting)
    if (updated.completed && before && !before.completed) {
      const action = scoreActionForEventType(updated.type);
      if (action) logAction(action);
      onScored?.();
    }
    reload();
  };

  const pillars: CalendarPillar[] =
    filter === 'all' ? ['salvation', 'health', 'freedom'] : [filter];

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
            {t('agenda.subtitle')}
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

      <div className="segment-soft">
        {(
          [
            { id: 'all' as const, label: t('agenda.all') },
            { id: 'salvation' as const, label: t('nav.salvation') },
            { id: 'health' as const, label: t('nav.health') },
            { id: 'freedom' as const, label: t('nav.freedom') },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-active={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className="text-[11px]"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {pillars.map((pillar) => {
        const meta = PILLAR_META[pillar];
        const list = byPillar[pillar];
        if (!list.length) return null;
        const doneCount = list.filter((e) => e.completed).length;

        return (
          <section
            key={pillar}
            className="card-soft overflow-hidden"
            aria-labelledby={`agenda-${pillar}`}
          >
            <div className="flex items-center gap-3 p-3 border-b border-[var(--border-soft)]">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[var(--border-strong)] shrink-0 lion-glow">
                <Image
                  src={meta.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  id={`agenda-${pillar}`}
                  className="text-sm font-semibold"
                  style={{ color: meta.color }}
                >
                  {t(`nav.${pillar === 'salvation' ? 'salvation' : pillar}`)}
                </h3>
                <p className="text-[10px] text-[var(--sage)]">
                  {doneCount}/{list.length} {t('agenda.done')}
                </p>
              </div>
            </div>

            <ul className="divide-y divide-[var(--border-soft)]">
              {list.map((ev) => {
                const def = DAILY_AGENDA_BLOCKS.find((b) => b.type === ev.type);
                const label = def ? t(def.titleKey) : ev.title;
                const href = def?.href;

                return (
                  <li key={ev.id} className="flex items-center gap-2 px-3 py-2.5 min-h-[52px]">
                    <button
                      type="button"
                      onClick={() => toggle(ev.id)}
                      className={`w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        ev.completed
                          ? 'border-[var(--accent)] bg-[var(--accent-fill)] text-[#0a120c]'
                          : 'border-[var(--border-strong)] hover:border-[var(--accent)]'
                      }`}
                      aria-pressed={!!ev.completed}
                      aria-label={label}
                    >
                      {ev.completed ? (
                        <span className="text-xs font-bold">✓</span>
                      ) : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          ev.completed
                            ? 'text-[var(--sage)] line-through'
                            : 'text-[var(--off-white)]'
                        }`}
                      >
                        {label}
                      </p>
                      {ev.time && (
                        <p className="text-[10px] text-[var(--sage)]/80 mt-0.5">
                          {ev.time}
                          {ev.durationMin ? ` · ${ev.durationMin} min` : ''}
                        </p>
                      )}
                    </div>
                    {href ? (
                      <Link
                        href={href}
                        className="text-[11px] text-[var(--accent)] shrink-0 px-2 py-1.5 rounded-lg hover:bg-[var(--surface-active)]"
                      >
                        {t('agenda.open')}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
