'use client';

import { useMemo, useState } from 'react';
import { UserProfile } from '@/lib/types';
import {
  buildFhirClinicalSummary,
  fhirBundleToJson,
  shareOrDownloadFhir,
} from '@/lib/health/fhir';

type Props = {
  profile: Partial<UserProfile> | null;
  lang?: 'es' | 'en';
  refreshKey?: number;
};

export default function ClinicalRecordPanel({
  profile,
  lang = 'es',
  refreshKey = 0,
}: Props) {
  const es = lang !== 'en';
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const bundle = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return buildFhirClinicalSummary(profile || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, refreshKey]);

  const entryCount = bundle?.entry?.length ?? 0;

  const handleShare = async () => {
    if (!bundle) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await shareOrDownloadFhir(bundle);
      if (result === 'shared') {
        setStatus(es ? 'Compartido' : 'Shared');
      } else if (result === 'downloaded') {
        setStatus(es ? 'Descargado (JSON FHIR)' : 'Downloaded (FHIR JSON)');
      } else if (result === 'copied') {
        setStatus(es ? 'Copiado al portapapeles' : 'Copied to clipboard');
      } else {
        setStatus(es ? 'No se pudo exportar' : 'Export failed');
      }
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleCopy = async () => {
    if (!bundle) return;
    try {
      await navigator.clipboard.writeText(fhirBundleToJson(bundle));
      setStatus(es ? 'JSON FHIR copiado' : 'FHIR JSON copied');
      setTimeout(() => setStatus(null), 2500);
    } catch {
      setStatus(es ? 'Copia no disponible' : 'Copy unavailable');
    }
  };

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
        <span>⎘</span>
        {es ? 'Ficha clínica interoperable' : 'Interoperable clinical record'}
      </h2>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-3">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {es
            ? 'Exporta un Bundle HL7 FHIR R4 con Patient, Composition y Observations (sensores, sueño, hidratación, ciclo, deportes). Compatible con sistemas que lean FHIR.'
            : 'Export an HL7 FHIR R4 Bundle with Patient, Composition, and Observations (sensors, sleep, hydration, cycle, sports). Readable by FHIR-aware systems.'}
        </p>

        <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 px-3 py-2.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-white font-medium">
              {es ? 'Estándar' : 'Standard'}
            </p>
            <p className="text-[10px] text-[var(--sage)]">HL7 FHIR R4 · application/fhir+json</p>
          </div>
          <p className="text-sm font-bold text-[var(--accent)] tabular-nums">
            {entryCount}{' '}
            <span className="text-[10px] font-normal text-[var(--sage)]">
              {es ? 'recursos' : 'resources'}
            </span>
          </p>
        </div>

        <ul className="text-[11px] text-[#D8E1D9]/75 space-y-1 list-disc pl-4">
          <li>Patient {profile?.name ? `(${profile.name})` : ''}</li>
          <li>Observations · biomarcadores / sensores</li>
          <li>Sueño, hidratación, deportes</li>
          {profile?.sex === 'female' && (
            <li>{es ? 'Ciclo menstrual (si hay datos)' : 'Menstrual cycle (if logged)'}</li>
          )}
        </ul>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={busy || !bundle}
            onClick={handleShare}
            className="btn-primary py-2.5 text-sm disabled:opacity-50"
          >
            {busy
              ? es
                ? 'Preparando…'
                : 'Preparing…'
              : es
                ? 'Compartir / descargar FHIR'
                : 'Share / download FHIR'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="btn-secondary flex-1 py-2.5 text-xs"
            >
              {es ? 'Copiar JSON' : 'Copy JSON'}
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen((v) => !v)}
              className="btn-secondary flex-1 py-2.5 text-xs"
            >
              {previewOpen
                ? es
                  ? 'Ocultar preview'
                  : 'Hide preview'
                : es
                  ? 'Vista previa'
                  : 'Preview'}
            </button>
          </div>
        </div>

        {previewOpen && bundle && (
          <pre className="text-[9px] leading-relaxed text-[var(--sage)] bg-[#040404] border border-[var(--border-soft)] rounded-xl p-3 max-h-48 overflow-auto whitespace-pre-wrap break-all">
            {fhirBundleToJson(bundle).slice(0, 3500)}
            {fhirBundleToJson(bundle).length > 3500 ? '\n…' : ''}
          </pre>
        )}

        {status && (
          <p className="text-center text-xs text-[var(--accent)]">{status}</p>
        )}

        <p className="text-[10px] text-[var(--sage)]/60 leading-relaxed">
          {es
            ? 'Comparte solo con profesionales de confianza. Los datos salen de tu dispositivo al exportar.'
            : 'Share only with trusted clinicians. Data leaves your device when you export.'}
        </p>
      </div>
    </section>
  );
}
