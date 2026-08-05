'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserProfile } from '@/lib/types';
import {
  buildFhirClinicalSummary,
  fhirBundleToJson,
  shareOrDownloadFhir,
} from '@/lib/health/fhir';
import {
  autofillAnamnesis,
  formatAnamnesisReadable,
  loadAnamnesis,
  saveAnamnesis,
  shareOrCopyAnamnesisText,
  type AnamnesisRecord,
  type ProximateAnamnesis,
  type RemoteAnamnesis,
} from '@/lib/health/anamnesis';

type Props = {
  profile: Partial<UserProfile> | null;
  lang?: 'es' | 'en';
  refreshKey?: number;
};

type PanelTab = 'readable' | 'edit' | 'fhir';
type EditSection = 'remote' | 'proximate';

function Field({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-[var(--sage)]">{label}</span>
      {hint ? (
        <span className="block text-[10px] text-[var(--sage)]/65 leading-snug">
          {hint}
        </span>
      ) : null}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="input-soft py-2.5 text-[12px] leading-relaxed resize-y min-h-[4.5rem]"
      />
    </label>
  );
}

export default function ClinicalRecordPanel({
  profile,
  lang = 'es',
  refreshKey = 0,
}: Props) {
  const es = lang !== 'en';
  const [tab, setTab] = useState<PanelTab>('readable');
  const [editSection, setEditSection] = useState<EditSection>('proximate');
  const [record, setRecord] = useState<AnamnesisRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [fhirPreview, setFhirPreview] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const reload = useCallback(() => {
    setRecord(loadAnamnesis());
  }, []);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  const bundle = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return buildFhirClinicalSummary(profile || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, refreshKey, record?.updatedAt]);

  const readable = useMemo(() => {
    if (!record) return '';
    return formatAnamnesisReadable({
      profile: profile || {},
      record,
      lang: es ? 'es' : 'en',
    });
  }, [record, profile, es]);

  const entryCount = bundle?.entry?.length ?? 0;

  const flashStatus = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 3200);
  };

  const handleAutofill = (overwrite: boolean) => {
    const next = autofillAnamnesis(profile || {}, {
      overwrite,
      lang: es ? 'es' : 'en',
    });
    setRecord(next);
    flashStatus(
      overwrite
        ? es
          ? 'Anamnesis actualizada con datos de salud'
          : 'Anamnesis refreshed from health data'
        : es
          ? 'Campos vacíos rellenados con datos de la app'
          : 'Empty fields filled from app data'
    );
    setTab('readable');
  };

  const handleSaveEdit = () => {
    if (!record) return;
    const next = saveAnamnesis(record);
    setRecord(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
    flashStatus(es ? 'Ficha guardada' : 'Record saved');
  };

  const patchRemote = (key: keyof RemoteAnamnesis, value: string) => {
    setRecord((r) =>
      r ? { ...r, remote: { ...r.remote, [key]: value } } : r
    );
  };

  const patchProx = (key: keyof ProximateAnamnesis, value: string) => {
    setRecord((r) =>
      r ? { ...r, proximate: { ...r.proximate, [key]: value } } : r
    );
  };

  const handleShareReadable = async () => {
    if (!readable) return;
    setBusy(true);
    try {
      const result = await shareOrCopyAnamnesisText(readable);
      if (result === 'shared') flashStatus(es ? 'Compartido' : 'Shared');
      else if (result === 'downloaded')
        flashStatus(es ? 'Descargado (.txt)' : 'Downloaded (.txt)');
      else if (result === 'copied')
        flashStatus(es ? 'Copiado' : 'Copied');
      else flashStatus(es ? 'No se pudo exportar' : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const handleShareFhir = async () => {
    if (!bundle) return;
    setBusy(true);
    try {
      const result = await shareOrDownloadFhir(bundle);
      if (result === 'shared') flashStatus(es ? 'FHIR compartido' : 'FHIR shared');
      else if (result === 'downloaded')
        flashStatus(es ? 'FHIR descargado' : 'FHIR downloaded');
      else if (result === 'copied')
        flashStatus(es ? 'JSON copiado' : 'JSON copied');
      else flashStatus(es ? 'No se pudo exportar' : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCopyFhir = async () => {
    if (!bundle) return;
    try {
      await navigator.clipboard.writeText(fhirBundleToJson(bundle));
      flashStatus(es ? 'JSON FHIR copiado' : 'FHIR JSON copied');
    } catch {
      flashStatus(es ? 'Copia no disponible' : 'Copy unavailable');
    }
  };

  if (!record) {
    return (
      <section className="mb-6">
        <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] animate-pulse h-40" />
      </section>
    );
  }

  const r = record.remote;
  const p = record.proximate;

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
        <span>⎘</span>
        {es ? 'Ficha clínica · Anamnesis' : 'Clinical record · Anamnesis'}
      </h2>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-3.5">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {es
            ? 'Anamnesis próxima y remota con datos de tu perfil y Health. Rellena con un toque, edita y léela en formato clínico. Exporta texto o FHIR.'
            : 'Proximate and remote anamnesis from your profile and Health. Autofill, edit, and read in clinical format. Export text or FHIR.'}
        </p>

        {/* Mode tabs */}
        <div className="segment-soft">
          {(
            [
              { id: 'readable' as const, es: 'Vista legible', en: 'Readable' },
              { id: 'edit' as const, es: 'Editar', en: 'Edit' },
              { id: 'fhir' as const, es: 'FHIR', en: 'FHIR' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              data-active={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {es ? item.es : item.en}
            </button>
          ))}
        </div>

        {/* Autofill bar */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleAutofill(false)}
            className="btn-sm text-[11px]"
          >
            {es ? 'Rellenar vacíos con Health' : 'Fill empty from Health'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  es
                    ? '¿Sobrescribir campos de anamnesis con datos actuales de la app?'
                    : 'Overwrite anamnesis fields with current app data?'
                )
              ) {
                handleAutofill(true);
              }
            }}
            className="btn-outline-sm text-[11px]"
          >
            {es ? 'Actualizar todo' : 'Refresh all'}
          </button>
        </div>

        {/* ── Readable clinical note ── */}
        {tab === 'readable' && (
          <div className="space-y-3">
            <article
              className="rounded-xl border border-[var(--border-soft)] bg-[#070907] px-3.5 py-3.5 max-h-[28rem] overflow-y-auto"
              aria-label={es ? 'Anamnesis legible' : 'Readable anamnesis'}
            >
              <pre className="whitespace-pre-wrap break-words font-sans text-[12px] leading-relaxed text-[var(--off-white)]/90 tracking-normal">
                {readable}
              </pre>
            </article>

            {record.vitalsSnapshot ? (
              <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70 mb-1">
                  {es ? 'Snapshot de métricas' : 'Metrics snapshot'}
                </p>
                <p className="text-[11px] text-[#D8E1D9]/85 leading-relaxed whitespace-pre-wrap">
                  {record.vitalsSnapshot}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleShareReadable()}
                className="btn-primary py-2.5 text-sm disabled:opacity-50"
              >
                {busy
                  ? es
                    ? 'Preparando…'
                    : 'Preparing…'
                  : es
                    ? 'Compartir / descargar ficha'
                    : 'Share / download record'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(readable);
                    flashStatus(es ? 'Texto copiado' : 'Text copied');
                  } catch {
                    flashStatus(es ? 'Copia no disponible' : 'Copy unavailable');
                  }
                }}
                className="btn-secondary py-2.5 text-xs"
              >
                {es ? 'Copiar texto legible' : 'Copy readable text'}
              </button>
            </div>
          </div>
        )}

        {/* ── Edit form ── */}
        {tab === 'edit' && (
          <div className="space-y-3">
            <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border-soft)]">
              <button
                type="button"
                onClick={() => setEditSection('proximate')}
                className="flex-1 min-h-[34px] rounded-md text-[11px] font-semibold transition-all"
                style={
                  editSection === 'proximate'
                    ? {
                        background: 'var(--accent-fill)',
                        color: '#0a120c',
                      }
                    : { color: 'var(--sage)' }
                }
              >
                {es ? 'Próxima (actual)' : 'Proximate (present)'}
              </button>
              <button
                type="button"
                onClick={() => setEditSection('remote')}
                className="flex-1 min-h-[34px] rounded-md text-[11px] font-semibold transition-all"
                style={
                  editSection === 'remote'
                    ? {
                        background: 'var(--accent-fill)',
                        color: '#0a120c',
                      }
                    : { color: 'var(--sage)' }
                }
              >
                {es ? 'Remota (antecedentes)' : 'Remote (history)'}
              </button>
            </div>

            {editSection === 'proximate' ? (
              <div className="space-y-3">
                <Field
                  label={es ? 'Motivo de consulta' : 'Chief complaint'}
                  value={p.chiefComplaint}
                  onChange={(v) => patchProx('chiefComplaint', v)}
                  rows={2}
                />
                <Field
                  label={es ? 'Enfermedad actual' : 'History of present illness'}
                  value={p.presentIllness}
                  onChange={(v) => patchProx('presentIllness', v)}
                  rows={4}
                  hint={
                    es
                      ? 'Inicio, evolución, factores que mejoran/empeoran.'
                      : 'Onset, course, relieving/worsening factors.'
                  }
                />
                <Field
                  label={es ? 'Síntomas actuales' : 'Current symptoms'}
                  value={p.currentSymptoms}
                  onChange={(v) => patchProx('currentSymptoms', v)}
                  rows={3}
                />
                <Field
                  label={es ? 'Sueño actual' : 'Current sleep'}
                  value={p.currentSleep}
                  onChange={(v) => patchProx('currentSleep', v)}
                  rows={3}
                />
                <Field
                  label={es ? 'Actividad reciente' : 'Recent activity'}
                  value={p.currentActivity}
                  onChange={(v) => patchProx('currentActivity', v)}
                  rows={3}
                />
                <Field
                  label={
                    es
                      ? 'Alimentación e hidratación'
                      : 'Nutrition & hydration'
                  }
                  value={p.currentNutrition}
                  onChange={(v) => patchProx('currentNutrition', v)}
                  rows={3}
                />
                <Field
                  label={es ? 'Ánimo / estrés' : 'Mood / stress'}
                  value={p.moodStress}
                  onChange={(v) => patchProx('moodStress', v)}
                  rows={2}
                />
                <Field
                  label={es ? 'Notas' : 'Notes'}
                  value={p.notes}
                  onChange={(v) => patchProx('notes', v)}
                  rows={2}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Field
                  label={
                    es
                      ? 'Antecedentes personales patológicos'
                      : 'Past medical history'
                  }
                  value={r.personalHistory}
                  onChange={(v) => patchRemote('personalHistory', v)}
                  rows={3}
                />
                <Field
                  label={
                    es
                      ? 'Antecedentes quirúrgicos'
                      : 'Surgical history'
                  }
                  value={r.surgicalHistory}
                  onChange={(v) => patchRemote('surgicalHistory', v)}
                  rows={2}
                />
                <Field
                  label={
                    es ? 'Antecedentes familiares' : 'Family history'
                  }
                  value={r.familyHistory}
                  onChange={(v) => patchRemote('familyHistory', v)}
                  rows={3}
                />
                <Field
                  label={es ? 'Alergias' : 'Allergies'}
                  value={r.allergies}
                  onChange={(v) => patchRemote('allergies', v)}
                  rows={2}
                />
                <Field
                  label={
                    es ? 'Medicación habitual' : 'Current medications'
                  }
                  value={r.medications}
                  onChange={(v) => patchRemote('medications', v)}
                  rows={2}
                />
                <Field
                  label={es ? 'Hábitos tóxicos' : 'Toxic habits'}
                  value={r.toxicHabits}
                  onChange={(v) => patchRemote('toxicHabits', v)}
                  rows={2}
                />
                <Field
                  label={es ? 'Ocupación' : 'Occupation'}
                  value={r.occupation}
                  onChange={(v) => patchRemote('occupation', v)}
                  rows={2}
                />
                <Field
                  label={
                    es
                      ? 'Actividad física habitual'
                      : 'Usual physical activity'
                  }
                  value={r.physicalActivity}
                  onChange={(v) => patchRemote('physicalActivity', v)}
                  rows={3}
                />
                {profile?.sex === 'female' && (
                  <Field
                    label={
                      es
                        ? 'Antecedentes gineco-obstétricos'
                        : 'Gynecologic / obstetric history'
                    }
                    value={r.gynObstetric}
                    onChange={(v) => patchRemote('gynObstetric', v)}
                    rows={3}
                  />
                )}
                <Field
                  label={es ? 'Otros' : 'Other'}
                  value={r.otherRemote}
                  onChange={(v) => patchRemote('otherRemote', v)}
                  rows={2}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveEdit}
              className="btn-primary py-2.5 text-sm w-full"
            >
              {savedFlash
                ? es
                  ? '✓ Guardado'
                  : '✓ Saved'
                : es
                  ? 'Guardar anamnesis'
                  : 'Save anamnesis'}
            </button>
          </div>
        )}

        {/* ── FHIR export (kept) ── */}
        {tab === 'fhir' && (
          <div className="space-y-3">
            <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
              {es
                ? 'Bundle HL7 FHIR R4 con Patient, Composition y Observations (sensores, sueño, hidratación, ciclo, deportes).'
                : 'HL7 FHIR R4 Bundle with Patient, Composition, and Observations (sensors, sleep, hydration, cycle, sports).'}
            </p>

            <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 px-3 py-2.5 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-white font-medium">
                  {es ? 'Estándar' : 'Standard'}
                </p>
                <p className="text-[10px] text-[var(--sage)]">
                  HL7 FHIR R4 · application/fhir+json
                </p>
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
              <li>
                {es
                  ? 'Sueño, hidratación, deportes'
                  : 'Sleep, hydration, sports'}
              </li>
              {profile?.sex === 'female' && (
                <li>
                  {es
                    ? 'Ciclo menstrual (si hay datos)'
                    : 'Menstrual cycle (if logged)'}
                </li>
              )}
            </ul>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy || !bundle}
                onClick={() => void handleShareFhir()}
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
                  onClick={() => void handleCopyFhir()}
                  className="btn-secondary flex-1 py-2.5 text-xs"
                >
                  {es ? 'Copiar JSON' : 'Copy JSON'}
                </button>
                <button
                  type="button"
                  onClick={() => setFhirPreview((v) => !v)}
                  className="btn-secondary flex-1 py-2.5 text-xs"
                >
                  {fhirPreview
                    ? es
                      ? 'Ocultar preview'
                      : 'Hide preview'
                    : es
                      ? 'Vista previa'
                      : 'Preview'}
                </button>
              </div>
            </div>

            {fhirPreview && bundle && (
              <pre className="text-[9px] leading-relaxed text-[var(--sage)] bg-[#040404] border border-[var(--border-soft)] rounded-xl p-3 max-h-48 overflow-auto whitespace-pre-wrap break-all">
                {fhirBundleToJson(bundle).slice(0, 3500)}
                {fhirBundleToJson(bundle).length > 3500 ? '\n…' : ''}
              </pre>
            )}
          </div>
        )}

        {status && (
          <p className="text-center text-xs text-[var(--accent)]" role="status">
            {status}
          </p>
        )}

        <p className="text-[10px] text-[var(--sage)]/60 leading-relaxed">
          {es
            ? 'Comparte solo con profesionales de confianza. Los datos salen de tu dispositivo al exportar. No sustituye evaluación médica profesional.'
            : 'Share only with trusted clinicians. Data leaves your device when you export. Does not replace professional medical evaluation.'}
        </p>
      </div>
    </section>
  );
}
