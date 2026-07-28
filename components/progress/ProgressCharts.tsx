'use client';

import { useMemo, useState } from 'react';
import {
  getProgressHistory,
  type DayProgressPoint,
} from '@/lib/scoring/engine';
import type { ComputedScores } from '@/lib/scoring/types';
import { useI18n } from '@/components/I18nProvider';
import { PILLAR_COLORS } from '@/lib/theme/pillars';

type Props = {
  scores: ComputedScores;
  className?: string;
};

type ChartMode = 'global' | 'pillars';

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
 * Weekly Salvazion Score — tap to reveal Salvation / Health / Freedom charts.
 */
export default function ProgressCharts({
  scores,
  className = '',
}: Props) {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<ChartMode>('global');

  const history = useMemo(
    () => getProgressHistory(7),
    [scores.global, scores.todayActions.length]
  );

  const weeklyScore = useMemo(() => {
    if (!history.length) return 0;
    const sum = history.reduce((acc, h) => acc + h.global, 0);
    return Math.round(sum / history.length);
  }, [history]);

  const pillarAvgs = useMemo(() => {
    if (!history.length) {
      return { salvation: 0, health: 0, freedom: 0 };
    }
    const n = history.length;
    return {
      salvation: Math.round(history.reduce((a, h) => a + h.salvation, 0) / n),
      health: Math.round(history.reduce((a, h) => a + h.health, 0) / n),
      freedom: Math.round(history.reduce((a, h) => a + h.freedom, 0) / n),
    };
  }, [history]);

  const maxGlobal = Math.max(10, ...history.map((h) => h.global), weeklyScore);
  const maxPillar = Math.max(
    10,
    ...history.flatMap((h) => [h.salvation, h.health, h.freedom]),
    pillarAvgs.salvation,
    pillarAvgs.health,
    pillarAvgs.freedom
  );

  const expanded = mode === 'pillars';

  const toggle = () => setMode((m) => (m === 'global' ? 'pillars' : 'global'));

  return (
    <div className={`space-y-3 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className="w-full text-left flex items-end justify-between px-0.5 gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-[0.99] transition"
        aria-expanded={expanded}
        aria-controls="weekly-score-chart"
        title={expanded ? t('charts.tapForGlobal') : t('charts.tapForPillars')}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {t('charts.section')}
          </p>
          <h2 className="text-base font-semibold text-[var(--accent)]">
            {t('charts.weeklyScore')}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/75 mt-0.5">
            {expanded ? t('charts.pillarsWeek') : t('charts.weekTrend')}
            <span className="text-[var(--accent)]/80"> · {t('charts.tapHint')}</span>
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
      </button>

      <div
        id="weekly-score-chart"
        className="card-soft p-4 overflow-hidden"
        role="region"
        aria-label={
          expanded
            ? t('charts.pillarsWeek')
            : t('charts.weeklyScore')
        }
      >
        {expanded ? (
          <>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-[10px]">
              <LegendDot
                color={PILLAR_COLORS.salvation.solid}
                label={t('nav.salvation')}
                value={pillarAvgs.salvation}
              />
              <LegendDot
                color={PILLAR_COLORS.health.solid}
                label={t('nav.health')}
                value={pillarAvgs.health}
              />
              <LegendDot
                color={PILLAR_COLORS.freedom.solid}
                label={t('nav.freedom')}
                value={pillarAvgs.freedom}
              />
            </div>
            <PillarsWeekChart history={history} maxY={maxPillar} lang={lang} />
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
            <div className="mt-3 space-y-2.5 pt-2 border-t border-[var(--border-soft)]">
              <PillarSpark
                label={t('nav.salvation')}
                values={history.map((h) => h.salvation)}
                color={PILLAR_COLORS.salvation.solid}
                avg={pillarAvgs.salvation}
              />
              <PillarSpark
                label={t('nav.health')}
                values={history.map((h) => h.health)}
                color={PILLAR_COLORS.health.solid}
                avg={pillarAvgs.health}
              />
              <PillarSpark
                label={t('nav.freedom')}
                values={history.map((h) => h.freedom)}
                color={PILLAR_COLORS.freedom.solid}
                avg={pillarAvgs.freedom}
              />
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--sage)]">
      <i className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      <span style={{ color }}>{label}</span>
      <span className="tabular-nums text-[var(--off-white)]/85">{value}</span>
    </span>
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

function seriesPath(
  history: DayProgressPoint[],
  key: 'salvation' | 'health' | 'freedom',
  maxY: number,
  w: number,
  h: number,
  padX: number,
  padY: number
) {
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const n = history.length;
  const coords = history.map((pt, i) => {
    const x = padX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padY + innerH - (pt[key] / maxY) * innerH;
    return { x, y, v: pt[key] };
  });
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  return { coords, line };
}

function PillarsWeekChart({
  history,
  maxY,
  lang,
}: {
  history: DayProgressPoint[];
  maxY: number;
  lang: string;
}) {
  const w = 280;
  const h = 110;
  const padX = 8;
  const padY = 12;
  const series = [
    { key: 'salvation' as const, color: PILLAR_COLORS.salvation.solid },
    { key: 'health' as const, color: PILLAR_COLORS.health.solid },
    { key: 'freedom' as const, color: PILLAR_COLORS.freedom.solid },
  ];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-28"
      role="img"
      aria-label={
        lang === 'es'
          ? 'Tendencia semanal Salvation, Health y Freedom'
          : 'Weekly Salvation, Health and Freedom trend'
      }
    >
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={w - padX}
          y1={padY + (h - padY * 2) * (1 - f)}
          y2={padY + (h - padY * 2) * (1 - f)}
          stroke="var(--border-soft)"
          strokeWidth="1"
        />
      ))}
      {series.map((s) => {
        const { coords, line } = seriesPath(history, s.key, maxY, w, h, padX, padY);
        return (
          <g key={s.key}>
            <path
              d={line}
              fill="none"
              stroke={s.color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
            />
            {coords.map((c, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r="3"
                fill="var(--true-black)"
                stroke={s.color}
                strokeWidth="1.6"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function PillarSpark({
  label,
  values,
  color,
  avg,
}: {
  label: string;
  values: number[];
  color: string;
  avg: number;
}) {
  const w = 120;
  const h = 28;
  const maxY = Math.max(10, ...values);
  const n = values.length;
  const coords = values.map((v, i) => {
    const x = n <= 1 ? w / 2 : (i / (n - 1)) * w;
    const y = h - 2 - (v / maxY) * (h - 4);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  });
  const line = coords.join(' ');

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-[4.5rem] shrink-0">
        <p className="text-[10px] font-medium leading-tight" style={{ color }}>
          {label}
        </p>
        <p className="text-[11px] tabular-nums text-[var(--off-white)] font-semibold">
          {avg}
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="flex-1 h-7 min-w-0" aria-hidden>
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex gap-0.5 shrink-0 items-end h-7">
        {values.map((v, i) => (
          <div
            key={i}
            className="w-1.5 rounded-sm transition-all"
            style={{
              height: `${Math.max(8, (v / maxY) * 100)}%`,
              background: color,
              opacity: 0.35 + (v / maxY) * 0.65,
            }}
            title={`${v}`}
          />
        ))}
      </div>
    </div>
  );
}
