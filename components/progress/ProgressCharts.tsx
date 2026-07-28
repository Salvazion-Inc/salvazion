'use client';

import { useMemo } from 'react';
import {
  getProgressHistory,
  type DayProgressPoint,
} from '@/lib/scoring/engine';
import type { ComputedScores } from '@/lib/scoring/types';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  scores: ComputedScores;
  className?: string;
};

function weekdayLabel(date: string, lang: string): string {
  try {
    return new Date(date + 'T12:00:00').toLocaleDateString(
      lang === 'es' ? 'es' : 'en',
      { weekday: 'short' }
    );
  } catch {
    return date.slice(5);
  }
}

/**
 * Brand-aligned weekly Salvazion Score chart (pure SVG — no chart library).
 */
export default function ProgressCharts({
  scores,
  className = '',
}: Props) {
  const { t, lang } = useI18n();
  const history = useMemo(
    () => getProgressHistory(7),
    [scores.global, scores.todayActions.length]
  );

  const weeklyScore = useMemo(() => {
    if (!history.length) return 0;
    const sum = history.reduce((acc, h) => acc + h.global, 0);
    return Math.round(sum / history.length);
  }, [history]);

  const maxGlobal = Math.max(10, ...history.map((h) => h.global), weeklyScore);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-end justify-between px-0.5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {t('charts.section')}
          </p>
          <h2 className="text-base font-semibold text-[var(--accent)]">
            {t('charts.weeklyScore')}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/75 mt-0.5">
            {t('charts.weekTrend')}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-3xl font-bold text-white tabular-nums leading-none tracking-tighter">
            {weeklyScore}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-[var(--sage)] mt-1">
            {t('charts.weeklyAvg')}
          </p>
        </div>
      </div>

      <div className="card-soft p-4 overflow-hidden">
        <WeekAreaChart history={history} maxY={maxGlobal} lang={lang} />
        <div className="flex justify-between mt-2 px-0.5">
          {history.map((h) => (
            <span
              key={h.date}
              className="text-[9px] text-[var(--sage)]/70 w-8 text-center"
            >
              {weekdayLabel(h.date, lang)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekAreaChart({
  history,
  maxY,
  lang,
}: {
  history: DayProgressPoint[];
  maxY: number;
  lang: string;
}) {
  const w = 280;
  const h = 96;
  const padX = 8;
  const padY = 10;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const n = history.length;
  const coords = history.map((pt, i) => {
    const x = padX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padY + innerH - (pt.global / maxY) * innerH;
    return { x, y, g: pt.global };
  });
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area =
    line +
    ` L ${coords[coords.length - 1]?.x ?? padX} ${padY + innerH}` +
    ` L ${coords[0]?.x ?? padX} ${padY + innerH} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-24"
      role="img"
      aria-label={lang === 'es' ? 'Salvazion Score semanal' : 'Weekly Salvazion Score'}
    >
      <defs>
        <linearGradient id="salvazion-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="salvazion-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--soft-green)" />
          <stop offset="50%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-hover)" />
        </linearGradient>
        <filter id="glow-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={w - padX}
          y1={padY + innerH * (1 - f)}
          y2={padY + innerH * (1 - f)}
          stroke="var(--border-soft)"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill="url(#salvazion-area)" />
      <path
        d={line}
        fill="none"
        stroke="url(#salvazion-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow-soft)"
      />
      {coords.map((c, i) => (
        <g key={i}>
          <circle
            cx={c.x}
            cy={c.y}
            r="4"
            fill="var(--true-black)"
            stroke="var(--accent)"
            strokeWidth="2"
          />
          {c.g > 0 && (
            <text
              x={c.x}
              y={c.y - 8}
              textAnchor="middle"
              fill="var(--sage)"
              fontSize="8"
            >
              {c.g}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
