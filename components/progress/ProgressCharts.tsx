'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getProgressHistory,
  type DayProgressPoint,
} from '@/lib/scoring/engine';
import {
  getDisciplineHistory,
  type DayDisciplinePoint,
} from '@/lib/calendar/engine';
import {
  getBodyHistory,
  type DayBodyPoint,
} from '@/lib/health/wearables';
import type { ComputedScores } from '@/lib/scoring/types';
import { useI18n } from '@/components/I18nProvider';
import { PILLAR_COLORS } from '@/lib/theme/pillars';

type Props = {
  scores: ComputedScores;
  className?: string;
};

/** discipline · score · pillars · body (device metrics) */
type ChartMode = 'discipline' | 'score' | 'pillars' | 'body';

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
 * Weekly progress — default: discipline % from calendar (no extra forms).
 * Tap cycles: Discipline → Score → Pillars → Discipline.
 */
export default function ProgressCharts({
  scores,
  className = '',
}: Props) {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<ChartMode>('discipline');

  // Parent passes a fresh scores object after agenda/wearable updates
  const history = useMemo(() => getProgressHistory(7), [scores]);

  const discipline = useMemo(() => getDisciplineHistory(7), [scores]);

  const body = useMemo(() => getBodyHistory(7), [scores]);

  const weeklyScore = useMemo(() => {
    if (!history.length) return 0;
    const sum = history.reduce((acc, h) => acc + h.global, 0);
    return Math.round(sum / history.length);
  }, [history]);

  const weeklyDiscipline = useMemo(() => {
    if (!discipline.length) return 0;
    const withPlan = discipline.filter((d) => d.total > 0);
    if (!withPlan.length) return 0;
    const sum = withPlan.reduce((acc, d) => acc + d.percent, 0);
    return Math.round(sum / withPlan.length);
  }, [discipline]);

  const bodyStepsAvg = useMemo(() => {
    const withData = body.filter((d) => d.steps > 0);
    if (!withData.length) return 0;
    return Math.round(
      withData.reduce((a, d) => a + d.steps, 0) / withData.length
    );
  }, [body]);

  const bodyEmpty = useMemo(
    () => !body.some((d) => d.hasData || d.steps > 0 || d.activeMinutes > 0),
    [body]
  );

  const scoreEmpty = useMemo(
    () =>
      history.every((h) => h.global === 0 && h.actionCount === 0) &&
      scores.todayActions.length === 0 &&
      scores.global === 0,
    [history, scores.todayActions.length, scores.global]
  );

  const disciplineEmpty = useMemo(
    () => !discipline.some((d) => d.done > 0 || d.percent > 0),
    [discipline]
  );

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

  const MODE_ORDER: ChartMode[] = ['discipline', 'score', 'pillars', 'body'];
  const cycle = () =>
    setMode((m) => {
      const i = MODE_ORDER.indexOf(m);
      return MODE_ORDER[(i + 1) % MODE_ORDER.length];
    });

  const title =
    mode === 'discipline'
      ? t('charts.weeklyDiscipline')
      : mode === 'score'
        ? t('charts.weeklyScore')
        : mode === 'body'
          ? t('charts.weeklyBody')
          : t('charts.pillarsWeek');

  const subtitle =
    mode === 'discipline'
      ? t('charts.disciplineHint')
      : mode === 'score'
        ? t('charts.weekTrend')
        : mode === 'body'
          ? t('charts.bodyHint')
          : t('charts.pillarsWeek');

  const heroValue =
    mode === 'discipline'
      ? weeklyDiscipline
      : mode === 'body'
        ? bodyStepsAvg
        : weeklyScore;
  const heroSuffix =
    mode === 'discipline' ? '%' : mode === 'body' ? '' : '';
  const heroLabel =
    mode === 'discipline'
      ? t('charts.disciplineAvg')
      : mode === 'body'
        ? t('charts.bodyStepsAvg')
        : t('charts.weeklyAvg');

  const cycleHint =
    mode === 'discipline'
      ? t('charts.tapForScore')
      : mode === 'score'
        ? t('charts.tapForPillars')
        : mode === 'pillars'
          ? t('charts.tapForBody')
          : t('charts.tapForDiscipline');

  return (
    <div className={`space-y-3 ${className}`}>
      <button
        type="button"
        onClick={cycle}
        className="w-full text-left flex items-end justify-between px-0.5 gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-[0.99] transition"
        aria-expanded={mode !== 'discipline'}
        aria-controls="weekly-score-chart"
        title={cycleHint}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {t('charts.section')}
          </p>
          <h2 className="text-base font-semibold text-[var(--accent)]">
            {title}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/75 mt-0.5">
            {subtitle}
            <span className="text-[var(--accent)]/80">
              {' '}
              · {t('charts.tapHint')}
            </span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-3xl font-bold text-white tabular-nums leading-none tracking-tighter">
            {heroValue}
            {heroSuffix && (
              <span className="text-lg opacity-80">{heroSuffix}</span>
            )}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-[var(--sage)] mt-1">
            {heroLabel}
          </p>
        </div>
      </button>

      {/* Mode chips for clarity */}
      <div
        className="flex gap-1 p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border-soft)]"
        role="tablist"
        aria-label={t('charts.section')}
      >
        {(
          [
            { id: 'discipline' as const, label: t('charts.modeDiscipline') },
            { id: 'score' as const, label: t('charts.modeScore') },
            { id: 'pillars' as const, label: t('charts.modePillars') },
            { id: 'body' as const, label: t('charts.modeBody') },
          ] as const
        ).map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(tab.id)}
              className="flex-1 min-h-[30px] px-2 rounded-md text-[10px] font-semibold transition-all"
              style={
                active
                  ? {
                      background: 'var(--accent-fill)',
                      color: '#0a120c',
                    }
                  : { color: 'var(--sage)', background: 'transparent' }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id="weekly-score-chart"
        className="card-soft p-4 overflow-hidden"
        role="region"
        aria-label={title}
      >
        {mode === 'pillars' ? (
          scoreEmpty ? (
            <ChartEmptyState
              message={t('charts.emptyScore')}
              primaryHref="/hub/dashboard"
              primaryLabel={t('charts.emptyAgendaCta')}
              secondaryHref="/hub/bible"
              secondaryLabel={t('charts.emptyBibleCta')}
            />
          ) : (
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
          )
        ) : mode === 'discipline' ? (
          disciplineEmpty ? (
            <ChartEmptyState
              message={t('charts.emptyDiscipline')}
              primaryHref="/hub/dashboard"
              primaryLabel={t('charts.emptyAgendaCta')}
              secondaryHref="/hub/calendar"
              secondaryLabel={t('charts.emptyCalendarCta')}
            />
          ) : (
            <>
              <DisciplineBars history={discipline} lang={lang} />
              <div className="flex justify-between mt-2 px-0.5">
                {discipline.map((h) => (
                  <span
                    key={h.date}
                    className="text-[9px] text-[var(--sage)]/70 w-8 text-center"
                  >
                    {weekdayLabel(h.date, lang)}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-[var(--sage)]/70 mt-2.5 leading-relaxed">
                {t('charts.disciplineFootnote')}
              </p>
            </>
          )
        ) : mode === 'body' ? (
          bodyEmpty ? (
            <ChartEmptyState
              message={t('charts.emptyBody')}
              primaryHref="/hub/health"
              primaryLabel={t('charts.emptyHealthCta')}
              secondaryHref="/hub/profile?settings=1&tab=wearables"
              secondaryLabel={t('charts.emptyWearableCta')}
            />
          ) : (
            <>
              <BodyWeekChart history={body} lang={lang} />
              <div className="flex justify-between mt-2 px-0.5">
                {body.map((h) => (
                  <span
                    key={h.date}
                    className="text-[9px] text-[var(--sage)]/70 w-8 text-center"
                  >
                    {weekdayLabel(h.date, lang)}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-soft)]">
                <BodyStat
                  label={t('health.devices.steps')}
                  value={
                    bodyStepsAvg > 0
                      ? String(bodyStepsAvg)
                      : '—'
                  }
                  hint={t('charts.bodyStepsAvg')}
                />
                <BodyStat
                  label={t('health.devices.active')}
                  value={(() => {
                    const withD = body.filter((d) => d.activeMinutes > 0);
                    if (!withD.length) return '—';
                    const avg = Math.round(
                      withD.reduce((a, d) => a + d.activeMinutes, 0) /
                        withD.length
                    );
                    return `${avg} min`;
                  })()}
                  hint={t('charts.weeklyAvg')}
                />
                <BodyStat
                  label={t('health.devices.sleep')}
                  value={(() => {
                    const withD = body.filter((d) => d.sleepHours != null);
                    if (!withD.length) return '—';
                    const avg =
                      withD.reduce((a, d) => a + (d.sleepHours || 0), 0) /
                      withD.length;
                    return `${avg.toFixed(1)} h`;
                  })()}
                  hint={t('charts.weeklyAvg')}
                />
              </div>
              <p className="text-[10px] text-[var(--sage)]/70 mt-2.5 leading-relaxed">
                {t('charts.bodyFootnote')}
              </p>
            </>
          )
        ) : scoreEmpty ? (
          <ChartEmptyState
            message={t('charts.emptyScore')}
            primaryHref="/hub/dashboard"
            primaryLabel={t('charts.emptyAgendaCta')}
            secondaryHref="/hub/bible"
            secondaryLabel={t('charts.emptyBibleCta')}
          />
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

function ChartEmptyState({
  message,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  message: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <div className="py-3 px-1 space-y-3 text-center">
      <p className="text-[12px] text-[var(--sage)] leading-relaxed max-w-[18rem] mx-auto">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href={primaryHref} className="btn-sm text-[11px]">
          {primaryLabel}
        </Link>
        <Link href={secondaryHref} className="btn-outline-sm text-[11px]">
          {secondaryLabel}
        </Link>
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

function DisciplineBars({
  history,
  lang,
}: {
  history: DayDisciplinePoint[];
  lang: string;
}) {
  const h = 96;
  const maxBar = 72;

  return (
    <div
      className="flex items-end justify-between gap-1.5 px-0.5"
      style={{ height: h }}
      role="img"
      aria-label={
        lang === 'es'
          ? 'Disciplina semanal del calendario'
          : 'Weekly calendar discipline'
      }
    >
      {history.map((d) => {
        const pct = Math.max(0, Math.min(100, d.percent));
        const barH = d.total === 0 ? 4 : Math.max(4, Math.round((pct / 100) * maxBar));
        const color =
          pct >= 80
            ? '#8FD99A'
            : pct >= 50
              ? 'var(--accent)'
              : pct > 0
                ? '#4A9EFF'
                : 'var(--border-soft)';
        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
          >
            {d.total > 0 && pct > 0 && (
              <span className="text-[8px] tabular-nums text-[var(--sage)]/80">
                {pct}
              </span>
            )}
            <div
              className="w-full max-w-[28px] rounded-t-md transition-all duration-500"
              style={{
                height: barH,
                background: color,
                opacity: d.total === 0 ? 0.35 : 0.95,
              }}
              title={`${d.done}/${d.total} · ${pct}%`}
            />
          </div>
        );
      })}
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
      <svg viewBox={`0 0 ${w} ${h}`} className="flex-1 h-7" aria-hidden>
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      </svg>
    </div>
  );
}

function BodyStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg px-2 py-1.5 border border-[var(--border-soft)] bg-[#040404]/40 text-center">
      <p className="text-[9px] uppercase tracking-wider text-[var(--sage)]/70">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums text-white mt-0.5">{value}</p>
      <p className="text-[8px] text-[var(--sage)]/60 mt-0.5">{hint}</p>
    </div>
  );
}

/** Steps bars for the week (device metrics). */
function BodyWeekChart({
  history,
  lang,
}: {
  history: DayBodyPoint[];
  lang: string;
}) {
  const maxSteps = Math.max(1000, ...history.map((d) => d.steps));
  const maxBar = 72;
  const h = 96;

  return (
    <div
      className="flex items-end justify-between gap-1.5 px-0.5"
      style={{ height: h }}
      role="img"
      aria-label={
        lang === 'es' ? 'Pasos semanales del cuerpo' : 'Weekly body steps'
      }
    >
      {history.map((d) => {
        const barH =
          d.steps > 0
            ? Math.max(4, Math.round((d.steps / maxSteps) * maxBar))
            : 3;
        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
          >
            {d.steps > 0 && (
              <span className="text-[7px] tabular-nums text-[var(--sage)]/80 leading-none">
                {d.steps >= 1000
                  ? `${(d.steps / 1000).toFixed(1)}k`
                  : d.steps}
              </span>
            )}
            <div
              className="w-full max-w-[28px] rounded-t-md transition-all duration-500"
              style={{
                height: barH,
                background: d.steps > 0 ? PILLAR_COLORS.health.solid : 'var(--border-soft)',
                opacity: d.steps > 0 ? 0.95 : 0.35,
              }}
              title={`${d.steps} steps · ${d.activeMinutes} min · sleep ${d.sleepHours ?? '—'}`}
            />
          </div>
        );
      })}
    </div>
  );
}
