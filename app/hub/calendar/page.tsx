'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import DayPlanner from '@/components/calendar/DayPlanner';
import {
  todayStr,
  weekDates,
  getEventsForDate,
  ensureDayAgenda,
} from '@/lib/calendar/engine';
import { loadProfile } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';

export default function CalendarPage() {
  const { t, lang } = useI18n();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [week, setWeek] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [tick, setTick] = useState(0);

  const refreshWeek = useCallback(() => {
    setWeek(weekDates(new Date(selectedDate + 'T12:00:00')));
    ensureDayAgenda(selectedDate);
    setTick((n) => n + 1);
  }, [selectedDate]);

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    if (p?.name) setName(p.name);
    refreshWeek();
  }, [refreshWeek]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--true-black)] flex items-center justify-center">
        <div className="text-[var(--accent)] animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  const dayLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString(
    lang === 'es' ? 'es' : 'en',
    { weekday: 'long', day: 'numeric', month: 'short' }
  );

  const dayEvents = getEventsForDate(selectedDate);
  const completed = dayEvents.filter((e) => e.completed).length;
  const total = dayEvents.length;

  return (
    <div className="min-h-screen bg-[var(--true-black)] text-[var(--off-white)] flex flex-col">
      <header className="page-header px-5 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/hub/dashboard" className="back-btn" aria-label={t('common.back')}>
              ←
            </Link>
            <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[var(--true-black)] shrink-0">
              <Image
                src="/logo-icon.png"
                alt="Salvazion"
                width={36}
                height={36}
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[var(--accent)] leading-tight">
                {t('calendar.title')}
              </h1>
              <p className="text-[10px] text-[var(--sage)]/80 truncate">
                {t('calendar.subtitle')} · {name || 'Phalanx'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-white tabular-nums">
              {completed}/{total}
            </p>
            <p className="text-[10px] text-[var(--sage)]/80">{t('agenda.done')}</p>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {week.map((d) => {
            const dayNum = d.slice(8, 10);
            const isSelected = d === selectedDate;
            const isToday = d === todayStr();
            const de = getEventsForDate(d);
            const doneCount = de.filter((e) => e.completed).length;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 w-11 py-2 rounded-xl text-center border transition-all ${
                  isSelected
                    ? 'border-[var(--border-strong)] bg-[var(--surface-active)]'
                    : 'border-[var(--border-soft)]'
                }`}
              >
                <p className="text-[10px] text-[var(--sage)]/80">
                  {new Date(d + 'T12:00:00').toLocaleDateString(
                    lang === 'es' ? 'es' : 'en',
                    { weekday: 'narrow' }
                  )}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    isToday ? 'text-[var(--accent)]' : 'text-white'
                  }`}
                >
                  {dayNum}
                </p>
                {de.length > 0 && (
                  <p className="text-[9px] text-[var(--sage)]/70">
                    {doneCount}/{de.length}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 overflow-y-auto max-w-lg mx-auto w-full">
        <h2 className="text-sm font-semibold capitalize text-white mb-3">{dayLabel}</h2>

        <div className="glass rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5 border border-[var(--border-soft)]">
          <div className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[var(--true-black)]">
            <Image
              src="/logo-icon.png"
              alt=""
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <p className="text-xs text-[var(--off-white)]/80 leading-relaxed">
            {total === 0
              ? t('calendar.coachEmpty')
              : completed === total
                ? t('calendar.coachDone')
                : t('calendar.coachProgress', { done: completed, total })}
          </p>
        </div>

        <DayPlanner
          key={`${selectedDate}-${tick}`}
          date={selectedDate}
          onChange={() => setTick((n) => n + 1)}
        />
      </main>

      <BottomNav />
    </div>
  );
}
