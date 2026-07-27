'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BiomarkerReport,
  biomarkerStatusColor,
  computeBiomarkerReport,
} from '@/lib/health/sensor-biomarkers';
import { loadDayIndicators } from '@/lib/health/phone-sensors';

type Props = {
  isFemale?: boolean;
  lang?: 'es' | 'en';
  /** Bump to force recompute after sensors / logs change */
  refreshKey?: number;
};

export default function BiomarkersPanel({
  isFemale = false,
  lang = 'es',
  refreshKey = 0,
}: Props) {
  const es = lang !== 'en';
  const [report, setReport] = useState<BiomarkerReport | null>(null);

  const recompute = useCallback(() => {
    const day = loadDayIndicators();
    setReport(computeBiomarkerReport({ isFemale, day }));
  }, [isFemale]);

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

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-sm font-semibold text-[var(--sage)] flex items-center gap-2">
          <span>◈</span>
          {es ? 'Biomarcadores (sensores + hábitos)' : 'Biomarkers (sensors + habits)'}
        </h2>
        <button
          type="button"
          onClick={recompute}
          className="text-[10px] pill-soft py-1 px-2.5"
        >
          {es ? 'Actualizar' : 'Refresh'}
        </button>
      </div>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-4">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {es
            ? 'Índices estimados desde sensores del celular (pasos, GPS, reposo) y tus registros. Orientan hábitos; no reemplazan analítica clínica.'
            : 'Estimates from phone sensors (steps, GPS, rest) and your logs. Habit guidance — not lab results.'}
        </p>

        {/* Composite */}
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
              {es ? 'Índice Salvazion Health' : 'Salvazion Health Index'}
            </p>
            <p className="text-xs text-[#D8E1D9]/85 mt-1 leading-relaxed">
              {report.highlights.map((h) => (es ? h.es : h.en)).join(' ')}
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
                    {es ? bm.labelEs : bm.labelEn}
                  </p>
                  <p className="text-[10px] text-[var(--sage)] mt-0.5">
                    {bm.source === 'phone_sensor'
                      ? es
                        ? 'Sensor'
                        : 'Sensor'
                      : bm.source === 'derived'
                        ? es
                          ? 'Derivado'
                          : 'Derived'
                        : es
                          ? 'Registro'
                          : 'Self-report'}
                    {bm.loinc ? ` · LOINC ${bm.loinc}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold tabular-nums ${biomarkerStatusColor(bm.status)}`}>
                    {bm.score != null ? `${bm.score}${bm.unit === '/100' ? '' : ''}` : '—'}
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
                {es ? bm.tipEs : bm.tipEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
