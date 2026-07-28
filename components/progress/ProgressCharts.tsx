'use client';

import { useMemo } from 'react';
import {
  getProgressHistory,
  getActionMixTotals,
  type DayProgressPoint,
} from '@/lib/scoring/engine';
import { getBadgeProgress, getEarnedBadgesDetailed } from '@/lib/badges/engine';
import type { ComputedScores } from '@/lib/scoring/types';
import { useI18n } from '@/components/I18nProvider';
import { PILLAR_COLORS } from '@/lib/calendar/colors';

type Props = {
  scores: ComputedScores;
  /** Compact = dashboard strip; full = profile / deeper view */
  variant?: 'compact' | 'full';
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
 * Beautiful brand-aligned progress charts (pure SVG — no chart library).
 * Progress · streaks · badges · action mix.
 */
export default function ProgressCharts({
  scores,
  variant = 'full',
  className = '',
}: Props) {
  const { t, lang } = useI18n();
  const history = useMemo(() => getProgressHistory(7), [scores.global, scores.todayActions.length]);
  const mix = useMemo(() => getActionMixTotals(), [scores.todayActions.length]);
  const badgeProg = useMemo(() => getBadgeProgress(), [scores.global]);
  const recentBadges = useMemo(
    () => getEarnedBadgesDetailed().slice(-3).reverse(),
    [badgeProg.earned]
  );

  const maxGlobal = Math.max(10, ...history.map((h) => h.global));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-end justify-between px-0.5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {t('charts.section')}
          </p>
          <h2 className="text-base font-semibold text-[var(--accent)]">
            {t('charts.title')}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/75 mt-0.5">
            {t('charts.subtitle')}
          </p>
        </div>
      </div>

      {/* 7-day global trend */}
      <div className="card-soft p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-[var(--off-white)]">
            {t('charts.weekTrend')}
          </p>
          <span className="text-[10px] text-[var(--sage)]">
            {t('charts.global')} · {scores.global}
          </span>
        </div>
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

      {/* Pillar bars + streak meters */}
      <div className="grid grid-cols-1 gap-3">
        <div className="card-soft p-4">
          <p className="text-xs font-medium text-[var(--off-white)] mb-3">
            {t('charts.pillarsToday')}
          </p>
          <PillarBars
            salvation={scores.salvation}
            health={scores.health}
            freedom={scores.freedom}
            labels={{
              salvation: t('nav.salvation'),
              health: t('nav.health'),
              freedom: t('nav.freedom'),
            }}
          />
        </div>

        <div className="card-soft p-4">
          <p className="text-xs font-medium text-[var(--off-white)] mb-3">
            {t('charts.streaks')}
          </p>
          <StreakRows
            streaks={scores.streaks}
            labels={{
              salvation: t('nav.salvation'),
              health: t('nav.health'),
              freedom: t('nav.freedom'),
            }}
            daysLabel={t('charts.days')}
          />
        </div>
      </div>

      {variant === 'full' && (
        <>
          <div className="card-soft p-4">
            <div className="flex items-start gap-4">
              <BadgeRing earned={badgeProg.earned} total={badgeProg.total} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--off-white)]">
                  {t('charts.badges')}
                </p>
                <p className="text-[11px] text-[var(--sage)] mt-0.5">
                  {badgeProg.earned}/{badgeProg.total} {t('charts.unlocked')}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent-fill)] transition-all duration-700"
                    style={{
                      width: `${badgeProg.total ? (badgeProg.earned / badgeProg.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            {recentBadges.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--border-soft)]">
                <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70 mb-2">
                  {t('charts.recentBadges')}
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recentBadges.map((b) => (
                    <div
                      key={b.id}
                      className="shrink-0 w-16 flex flex-col items-center gap-1"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.iconSrc}
                        alt=""
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover border border-[var(--border-strong)] lion-glow"
                      />
                      <p className="text-[9px] text-center text-[var(--off-white)]/85 leading-tight line-clamp-2">
                        {b.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card-soft p-4 flex flex-col items-center">
            <p className="text-xs font-medium text-[var(--off-white)] mb-2 self-start">
              {t('charts.mix')}
            </p>
            <MixDonut
              salvation={mix.salvation}
              health={mix.health}
              freedom={mix.freedom}
            />
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-2 text-[9px] text-[var(--sage)]">
              <span className="inline-flex items-center gap-1">
                <i
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: PILLAR_COLORS.salvation.solid }}
                />
                {t('nav.salvation')}
              </span>
              <span className="inline-flex items-center gap-1">
                <i
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: PILLAR_COLORS.health.solid }}
                />
                {t('nav.health')}
              </span>
              <span className="inline-flex items-center gap-1">
                <i
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: PILLAR_COLORS.freedom.solid }}
                />
                {t('nav.freedom')}
              </span>
            </div>
          </div>
        </>
      )}

      {variant === 'compact' && (
        <div className="card-soft p-3 flex items-center gap-4">
          <BadgeRing earned={badgeProg.earned} total={badgeProg.total} size={56} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--off-white)]">
              {t('charts.badges')}
            </p>
            <p className="text-[11px] text-[var(--sage)]">
              {badgeProg.earned}/{badgeProg.total} {t('charts.unlocked')}
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-fill)] transition-all duration-700"
                style={{
                  width: `${badgeProg.total ? (badgeProg.earned / badgeProg.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
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
      aria-label={lang === 'es' ? 'Tendencia semanal' : 'Weekly trend'}
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
      {/* grid */}
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
          <circle cx={c.x} cy={c.y} r="4" fill="var(--true-black)" stroke="var(--accent)" strokeWidth="2" />
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

function PillarBars({
  salvation,
  health,
  freedom,
  labels,
}: {
  salvation: number;
  health: number;
  freedom: number;
  labels: { salvation: string; health: string; freedom: string };
}) {
  const rows = [
    { key: 'salvation', v: salvation, color: PILLAR_COLORS.salvation.solid, label: labels.salvation },
    { key: 'health', v: health, color: PILLAR_COLORS.health.solid, label: labels.health },
    { key: 'freedom', v: freedom, color: PILLAR_COLORS.freedom.solid, label: labels.freedom },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-[var(--sage)]">{r.label}</span>
            <span className="font-semibold tabular-nums" style={{ color: r.color }}>
              {Math.round(r.v)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border-soft)]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, r.v)}%`,
                background: `linear-gradient(90deg, ${r.color}, color-mix(in srgb, ${r.color} 55%, white))`,
                boxShadow: `0 0 12px color-mix(in srgb, ${r.color} 35%, transparent)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StreakRows({
  streaks,
  labels,
  daysLabel,
}: {
  streaks: ComputedScores['streaks'];
  labels: { salvation: string; health: string; freedom: string };
  daysLabel: string;
}) {
  const rows = [
    { key: 'salvation' as const, label: labels.salvation, color: PILLAR_COLORS.salvation.solid },
    { key: 'health' as const, label: labels.health, color: PILLAR_COLORS.health.solid },
    { key: 'freedom' as const, label: labels.freedom, color: PILLAR_COLORS.freedom.solid },
  ];
  const max = Math.max(7, ...rows.map((r) => streaks[r.key]));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const d = streaks[r.key];
        return (
          <div key={r.key} className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--sage)] w-16 shrink-0 truncate">
              {r.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-[var(--surface)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (d / max) * 100)}%`,
                  background: r.color,
                }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-[var(--off-white)] w-12 text-right">
              {d}
              <span className="text-[var(--sage)] text-[9px]"> {daysLabel}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BadgeRing({
  earned,
  total,
  size = 88,
}: {
  earned: number;
  total: number;
  size?: number;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const pct = total ? earned / total : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--border-soft)"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${pct * c} ${c}`}
        transform="rotate(-90 50 50)"
        className="transition-all duration-700"
        style={{
          filter: 'drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 40%, transparent))',
        }}
      />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--off-white)"
        fontSize="18"
        fontWeight="700"
        fontFamily="var(--font-cosmic-octo), system-ui"
      >
        {earned}
      </text>
    </svg>
  );
}

function MixDonut({
  salvation,
  health,
  freedom,
}: {
  salvation: number;
  health: number;
  freedom: number;
}) {
  const total = Math.max(1, salvation + health + freedom);
  const segs = [
    { v: salvation / total, color: PILLAR_COLORS.salvation.solid },
    { v: health / total, color: PILLAR_COLORS.health.solid },
    { v: freedom / total, color: PILLAR_COLORS.freedom.solid },
  ];
  const r = 34;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={88} height={88} viewBox="0 0 100 100" className="shrink-0">
      {segs.map((s, i) => {
        const len = s.v * c;
        const el = (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
          />
        );
        offset += len;
        return el;
      })}
      <circle cx="50" cy="50" r="22" fill="var(--true-black)" />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--sage)"
        fontSize="9"
      >
        mix
      </text>
    </svg>
  );
}
