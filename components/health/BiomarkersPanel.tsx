'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BiomarkerReport,
  biomarkerStatusColor,
  computeBiomarkerReport,
  type BiomarkerCategory,
} from '@/lib/health/sensor-biomarkers';
import {
  getCombinedHealthIndicators,
  toDaySensorIndicators,
  type CombinedHealthIndicators,
} from '@/lib/health/wearables';

type Props = {
  isFemale?: boolean;
  lang?: 'es' | 'en' | 'pt';
  /** Bump to force recompute after sensors / logs change */
  refreshKey?: number;
  /**
   * Health tab that owns this panel — only markers for this category.
   * Required so biomarkers are never duplicated across tabs.
   */
  category: BiomarkerCategory;
};

const CATEGORY_META: Record<
  BiomarkerCategory,
  {
    titleEs: string;
    titleEn: string;
    titlePt: string;
    blurbEs: string;
    blurbEn: string;
    blurbPt: string;
    indexEs: string;
    indexEn: string;
    indexPt: string;
  }
> = {
  exercise: {
    titleEs: 'Biomarcadores · Ejercicio',
    titleEn: 'Biomarkers · Exercise',
    titlePt: 'Biomarcadores · Exercício',
    blurbEs:
      'Actividad, sol y movimiento desde wearables + teléfono y hábitos. No sustituyen analítica clínica.',
    blurbEn:
      'Activity, outdoor light and movement from wearables + phone and habits. Not lab results.',
    blurbPt:
      'Atividade, sol e movimento de wearables + telefone e hábitos. Não substituem analítica clínica.',
    indexEs: 'Índice ejercicio',
    indexEn: 'Exercise index',
    indexPt: 'Índice exercício',
  },
  nutrition: {
    titleEs: 'Biomarcadores · Alimentación',
    titleEn: 'Biomarkers · Nutrition',
    titlePt: 'Biomarcadores · Alimentação',
    blurbEs:
      'Hidratación y calidad de comidas según tus registros. Orientan hábitos; no reemplazan nutrición clínica.',
    blurbEn:
      'Hydration and meal quality from your logs. Habit guidance — not clinical nutrition advice.',
    blurbPt:
      'Hidratação e qualidade das refeições segundo os seus registros. Orientam hábitos; não substituem nutrição clínica.',
    indexEs: 'Índice alimentación',
    indexEn: 'Nutrition index',
    indexPt: 'Índice alimentação',
  },
  sleep: {
    titleEs: 'Biomarcadores · Sueño',
    titleEn: 'Biomarkers · Sleep',
    titlePt: 'Biomarcadores · Sono',
    blurbEs:
      'Recuperación y ritmo circadiano desde sueño del wearable, reposo del teléfono y registros.',
    blurbEn:
      'Recovery and circadian rhythm from wearable sleep, phone rest, and your logs.',
    blurbPt:
      'Recuperação e ritmo circadiano a partir do sono do wearable, repouso do telefone e registros.',
    indexEs: 'Índice sueño',
    indexEn: 'Sleep index',
    indexPt: 'Índice sono',
  },
};

export default function BiomarkersPanel({
  isFemale = false,
  lang = 'es',
  refreshKey = 0,
  category,
}: Props) {
  const loc = <T extends { en: string; es: string; pt: string }>(m: T) =>
    lang === 'pt' ? m.pt : lang === 'es' ? m.es : m.en;
  const tx = (en: string, es: string, pt: string) => loc({ en, es, pt });
  const meta = CATEGORY_META[category];
  const [report, setReport] = useState<BiomarkerReport | null>(null);
  const [sources, setSources] = useState<CombinedHealthIndicators['sources'] | null>(
    null
  );

  const recompute = useCallback(() => {
    // Same truth as "Hoy desde dispositivos": phone + wearable merged
    const combined = getCombinedHealthIndicators();
    const day = toDaySensorIndicators(combined);
    setSources(combined.sources);
    setReport(computeBiomarkerReport({ isFemale, day, category }));
  }, [isFemale, category]);

  useEffect(() => {
    recompute();
  }, [recompute, refreshKey]);

  if (!report) {
    return (
      <section className="mb-6">
        <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] animate-pulse h-36" />
      </section>
    );
  }

  const sourceLabel =
    sources?.wearable && sources?.phone
      ? tx('Phone + wearable', 'Teléfono + wearable', 'Telefone + wearable')
      : sources?.wearable
        ? 'Wearable'
        : sources?.phone
          ? tx('Phone', 'Teléfono', 'Telefone')
          : tx('Habits / no device', 'Hábitos / sin dispositivo', 'Hábitos / sem dispositivo');

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-sm font-semibold text-[var(--sage)] flex items-center gap-2">
          <span>◈</span>
          {tx(meta.titleEn, meta.titleEs, meta.titlePt)}
        </h2>
        <button
          type="button"
          onClick={recompute}
          className="text-[10px] pill-soft py-1 px-2.5"
        >
          {tx('Refresh', 'Actualizar', 'Atualizar')}
        </button>
      </div>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-4">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {tx(meta.blurbEn, meta.blurbEs, meta.blurbPt)}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--sage)]/70">
          <span>
            {tx('Source', 'Fuente', 'Fonte')}: {sourceLabel}
          </span>
          {!sources?.wearable && !sources?.phone && (
            <Link
              href="/hub/profile?settings=1&tab=wearables"
              className="text-[var(--accent)] hover:underline"
            >
              {tx('Connect device →', 'Conectar dispositivo →', 'Conectar dispositivo →')}
            </Link>
          )}
        </div>

        {/* Category composite (only markers of this tab) */}
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 px-3.5 py-3">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#6B8F6E" strokeWidth="7" opacity="0.25" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#8FD99A"
                strokeWidth="7"
                strokeDasharray={`${Math.min(report.compositeScore, 100) * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className="text-lg font-bold text-white z-10 tabular-nums">
              {report.compositeScore}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
              {tx(meta.indexEn, meta.indexEs, meta.indexPt)}
            </p>
            <p className="text-xs text-[#D8E1D9]/85 mt-1 leading-relaxed">
              {report.highlights.map((h) => loc(h)).join(' ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {report.biomarkers.map((bm) => (
            <div
              key={bm.id}
              className="rounded-xl border border-[var(--border-soft)] px-3 py-2.5 bg-[#040404]/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">
                    {tx(bm.labelEn, bm.labelEs, bm.labelPt)}
                  </p>
                  <p className="text-[10px] text-[var(--sage)] mt-0.5">
                    {bm.source === 'phone_sensor'
                      ? tx('Sensor', 'Sensor', 'Sensor')
                      : bm.source === 'derived'
                        ? tx('Derived', 'Derivado', 'Derivado')
                        : tx('Self-report', 'Registro', 'Registro')}
                    {bm.loinc ? ` · LOINC ${bm.loinc}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold tabular-nums ${biomarkerStatusColor(bm.status)}`}>
                    {bm.score != null ? `${bm.score}` : '—'}
                    {bm.score != null && bm.unit === '/100' ? (
                      <span className="text-[10px] font-normal text-[var(--sage)]">/100</span>
                    ) : null}
                  </p>
                  <p className="text-[10px] text-[var(--sage)]/80 max-w-[9rem] truncate">
                    {bm.display}
                  </p>
                </div>
              </div>
              {bm.score != null && (
                <div className="h-1 rounded-full bg-[var(--surface-muted)] mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#7BC98A]/80 transition-all duration-500"
                    style={{ width: `${Math.min(100, bm.score)}%` }}
                  />
                </div>
              )}
              <p className="text-[10px] text-[#D8E1D9]/70 mt-1.5 leading-relaxed">
                {tx(bm.tipEn, bm.tipEs, bm.tipPt)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
