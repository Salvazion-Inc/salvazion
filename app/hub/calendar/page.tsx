'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import RoutineBoard from '@/components/calendar/RoutineBoard';
import OutdoorClimatePanel from '@/components/calendar/OutdoorClimatePanel';
import {
  todayStr,
  weekDates,
  getEventsForDate,
  getDayCompletionStats,
  isDaySummaryWindow,
  duplicateToTomorrow,
  duplicateToWeek,
  clearDay,
  seedDefaultDay,
  resetToDefaultDay,
} from '@/lib/calendar/engine';
import { loadProfile } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';

export default function CalendarPage() {
  const { t, lang } = useI18n();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [week, setWeek] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [counts, setCounts] = useState({ done: 0, total: 0, percent: 0 });
  const [toast, setToast] = useState<string | null>(null);
  /** Bump to force RoutineBoard remount after clear/reset */
  const [boardEpoch, setBoardEpoch] = useState(0);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const refreshCounts = useCallback((date: string) => {
    const stats = getDayCompletionStats(date);
    setCounts(stats);
    // refresh week dots without remounting board
    setWeek(weekDates(new Date(date + 'T12:00:00')));
  }, []);

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    if (p?.name) setName(p.name);
    const d = todayStr();
    setSelectedDate(d);
    seedDefaultDay(d);
    setWeek(weekDates());
    refreshCounts(d);
  }, [refreshCounts]);

  useEffect(() => {
    if (!mounted) return;
    seedDefaultDay(selectedDate);
    refreshCounts(selectedDate);
  }, [selectedDate, mounted, refreshCounts]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--true-black)] flex items-center justify-center">
        <div className="text-[var(--accent)] animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  const dayLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString(
    lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es' : 'en',
    { weekday: 'long', day: 'numeric', month: 'short' }
  );

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
                {t('calendar.subtitle')} · {name || t('nav.home')}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={`text-lg font-bold tabular-nums leading-none ${
                counts.percent >= 80 ? 'text-[#8FD99A]' : 'text-white'
              }`}
            >
              {counts.percent}
              <span className="text-[11px] font-semibold opacity-80">%</span>
            </p>
            <p className="text-[10px] text-[var(--sage)]/80 mt-0.5 tabular-nums">
              {counts.done}/{counts.total} {t('agenda.done')}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {week.map((d) => {
            const dayNum = d.slice(8, 10);
            const isSelected = d === selectedDate;
            const isToday = d === todayStr();
            const st = getDayCompletionStats(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 w-11 py-1.5 rounded-xl text-center border transition-all min-h-[48px] ${
                  isSelected
                    ? 'border-[var(--border-strong)] bg-[var(--surface-active)]'
                    : 'border-[var(--border-soft)]'
                }`}
              >
                <p className="text-[10px] text-[var(--sage)]/80">
                  {new Date(d + 'T12:00:00').toLocaleDateString(
                    lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es' : 'en',
                    { weekday: 'narrow' }
                  )}
                </p>
                <p
                  className={`text-sm font-semibold leading-tight ${
                    isToday ? 'text-[var(--accent)]' : 'text-white'
                  }`}
                >
                  {dayNum}
                </p>
                {st.total > 0 && (
                  <p
                    className={`text-[9px] tabular-nums ${
                      st.percent >= 80 ? 'text-[#8FD99A]' : 'text-[var(--sage)]/70'
                    }`}
                  >
                    {st.percent}%
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 px-5 pt-3 pb-32 overflow-y-auto max-w-lg mx-auto w-full">
        <div className="flex items-end justify-between gap-2 mb-2.5">
          <h2 className="text-sm font-semibold capitalize text-white">{dayLabel}</h2>
          {isDaySummaryWindow(selectedDate) && counts.total > 0 && (
            <p className="text-[10px] text-[var(--accent)] font-medium shrink-0">
              {t('calendar.daySummary')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-3 text-[10px]">
          <span className="inline-flex items-center gap-1.5 text-[var(--sage)]">
            <i className="w-2.5 h-2.5 rounded-sm bg-[#F5F7F5] border border-white/30" />
            {t('nav.salvation')}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--sage)]">
            <i className="w-2.5 h-2.5 rounded-sm bg-[#4A9EFF]" />
            {t('nav.health')}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--sage)]">
            <i className="w-2.5 h-2.5 rounded-sm bg-[#7BC98A]" />
            {t('nav.freedom')}
          </span>
        </div>

        <OutdoorClimatePanel className="mb-4" />

        <div className="btn-toolbar mb-4">
          <button
            type="button"
            className="btn-outline-sm"
            onClick={() => {
              const n = duplicateToTomorrow(selectedDate);
              flash(t('calendar.copiedTomorrow', { n }));
              refreshCounts(selectedDate);
            }}
          >
            {t('calendar.copyTomorrow')}
          </button>
          <button
            type="button"
            className="btn-outline-sm"
            onClick={() => {
              const n = duplicateToWeek(selectedDate);
              flash(t('calendar.copiedWeek', { n }));
              refreshCounts(selectedDate);
            }}
          >
            {t('calendar.copyWeek')}
          </button>
          <button
            type="button"
            className="btn-outline-sm"
            onClick={() => {
              if (window.confirm(t('calendar.resetDefaultConfirm'))) {
                resetToDefaultDay(selectedDate);
                flash(t('calendar.resetDefaultDone'));
                setBoardEpoch((e) => e + 1);
                refreshCounts(selectedDate);
              }
            }}
          >
            {t('calendar.resetDefault')}
          </button>
          {counts.total > 0 && (
            <button
              type="button"
              className="btn-ghost text-red-400/80"
              onClick={() => {
                if (window.confirm(t('calendar.clearConfirm'))) {
                  clearDay(selectedDate);
                  setBoardEpoch((e) => e + 1);
                  refreshCounts(selectedDate);
                }
              }}
            >
              {t('calendar.clearDay')}
            </button>
          )}
        </div>

        {/* Remount only on date change or clear/reset — not on every edit */}
        <RoutineBoard
          key={`${selectedDate}-${boardEpoch}`}
          date={selectedDate}
          onChange={() => refreshCounts(selectedDate)}
        />
      </main>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] toast-soft whitespace-nowrap">
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
