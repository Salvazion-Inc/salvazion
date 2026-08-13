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
import { tx3 } from '@/lib/i18n/locale';

type Props = {
  profile: Partial<UserProfile> | null;
  lang?: 'es' | 'en' | 'pt';
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
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
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
      lang,
    });
  }, [record, profile, lang]);

  const entryCount = bundle?.entry?.length ?? 0;

  const flashStatus = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 3200);
  };

  const handleAutofill = (overwrite: boolean) => {
    const next = autofillAnamnesis(profile || {}, {
      overwrite,
      lang,
    });
    setRecord(next);
    flashStatus(
      overwrite
        ? tx(
            'Anamnesis refreshed from health data',
            'Anamnesis actualizada con datos de salud',
            'Anamnese atualizada com dados de saúde'
          )
        : tx(
            'Empty fields filled from app data',
            'Campos vacíos rellenados con datos de la app',
            'Campos vazios preenchidos com dados do app'
          )
    );
    setTab('readable');
  };

  const handleSaveEdit = () => {
    if (!record) return;
    const next = saveAnamnesis(record);
    setRecord(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
    flashStatus(tx('Record saved', 'Ficha guardada', 'Ficha salva'));
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
      if (result === 'shared') flashStatus(tx('Shared', 'Compartido', 'Compartilhado'));
      else if (result === 'downloaded')
        flashStatus(tx('Downloaded (.txt)', 'Descargado (.txt)', 'Baixado (.txt)'));
      else if (result === 'copied')
        flashStatus(tx('Copied', 'Copiado', 'Copiado'));
      else flashStatus(tx('Export failed', 'No se pudo exportar', 'Não foi possível exportar'));
    } finally {
      setBusy(false);
    }
  };

  const handleShareFhir = async () => {
    if (!bundle) return;
    setBusy(true);
    try {
      const result = await shareOrDownloadFhir(bundle);
      if (result === 'shared') flashStatus(tx('FHIR shared', 'FHIR compartido', 'FHIR compartilhado'));
      else if (result === 'downloaded')
        flashStatus(tx('FHIR downloaded', 'FHIR descargado', 'FHIR baixado'));
      else if (result === 'copied')
        flashStatus(tx('JSON copied', 'JSON copiado', 'JSON copiado'));
      else flashStatus(tx('Export failed', 'No se pudo exportar', 'Não foi possível exportar'));
    } finally {
      setBusy(false);
    }
  };

  const handleCopyFhir = async () => {
    if (!bundle) return;
    try {
      await navigator.clipboard.writeText(fhirBundleToJson(bundle));
      flashStatus(tx('FHIR JSON copied', 'JSON FHIR copiado', 'JSON FHIR copiado'));
    } catch {
      flashStatus(tx('Copy unavailable', 'Copia no disponible', 'Cópia indisponível'));
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
        {tx('Clinical record · Anamnesis', 'Ficha clínica · Anamnesis', 'Ficha clínica · Anamnese')}
      </h2>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-3.5">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {tx(
            'Proximate and remote anamnesis from your profile and Health. Autofill, edit, and read in clinical format. Export text or FHIR.',
            'Anamnesis próxima y remota con datos de tu perfil y Health. Rellena con un toque, edita y léela en formato clínico. Exporta texto o FHIR.',
            'Anamnese próxima e remota com dados do seu perfil e Health. Preencha com um toque, edite e leia em formato clínico. Exporte texto ou FHIR.'
          )}
        </p>

        {/* Mode tabs */}
        <div className="segment-soft">
          {(
            [
              { id: 'readable' as const, es: 'Vista legible', en: 'Readable', pt: 'Vista legível' },
              { id: 'edit' as const, es: 'Editar', en: 'Edit', pt: 'Editar' },
              { id: 'fhir' as const, es: 'FHIR', en: 'FHIR', pt: 'FHIR' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              data-active={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {tx(item.en, item.es, item.pt)}
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
            {tx('Fill empty from Health', 'Rellenar vacíos con Health', 'Preencher vazios com Health')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  tx(
                    'Overwrite anamnesis fields with current app data?',
                    '¿Sobrescribir campos de anamnesis con datos actuales de la app?',
                    'Sobrescrever campos da anamnese com dados atuais do app?'
                  )
                )
              ) {
                handleAutofill(true);
              }
            }}
            className="btn-outline-sm text-[11px]"
          >
            {tx('Refresh all', 'Actualizar todo', 'Atualizar tudo')}
          </button>
        </div>

        {/* ── Readable clinical note ── */}
        {tab === 'readable' && (
          <div className="space-y-3">
            <article
              className="rounded-xl border border-[var(--border-soft)] bg-[#070907] px-3.5 py-3.5 max-h-[28rem] overflow-y-auto"
              aria-label={tx('Readable anamnesis', 'Anamnesis legible', 'Anamnese legível')}
            >
              <pre className="whitespace-pre-wrap break-words font-sans text-[12px] leading-relaxed text-[var(--off-white)]/90 tracking-normal">
                {readable}
              </pre>
            </article>

            {record.vitalsSnapshot ? (
              <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70 mb-1">
                  {tx('Metrics snapshot', 'Snapshot de métricas', 'Snapshot de métricas')}
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
                  ? tx('Preparing…', 'Preparando…', 'Preparando…')
                  : tx(
                      'Share / download record',
                      'Compartir / descargar ficha',
                      'Compartilhar / baixar ficha'
                    )}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(readable);
                    flashStatus(tx('Text copied', 'Texto copiado', 'Texto copiado'));
                  } catch {
                    flashStatus(tx('Copy unavailable', 'Copia no disponible', 'Cópia indisponível'));
                  }
                }}
                className="btn-secondary py-2.5 text-xs"
              >
                {tx('Copy readable text', 'Copiar texto legible', 'Copiar texto legível')}
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
                {tx('Proximate (present)', 'Próxima (actual)', 'Próxima (atual)')}
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
                {tx('Remote (history)', 'Remota (antecedentes)', 'Remota (antecedentes)')}
              </button>
            </div>

            {editSection === 'proximate' ? (
              <div className="space-y-3">
                <Field
                  label={tx('Chief complaint', 'Motivo de consulta', 'Motivo da consulta')}
                  value={p.chiefComplaint}
                  onChange={(v) => patchProx('chiefComplaint', v)}
                  rows={2}
                />
                <Field
                  label={tx('History of present illness', 'Enfermedad actual', 'Doença atual')}
                  value={p.presentIllness}
                  onChange={(v) => patchProx('presentIllness', v)}
                  rows={4}
                  hint={tx(
                    'Onset, course, relieving/worsening factors.',
                    'Inicio, evolución, factores que mejoran/empeoran.',
                    'Início, evolução, fatores que melhoram/pioram.'
                  )}
                />
                <Field
                  label={tx('Current symptoms', 'Síntomas actuales', 'Sintomas atuais')}
                  value={p.currentSymptoms}
                  onChange={(v) => patchProx('currentSymptoms', v)}
                  rows={3}
                />
                <Field
                  label={tx('Current sleep', 'Sueño actual', 'Sono atual')}
                  value={p.currentSleep}
                  onChange={(v) => patchProx('currentSleep', v)}
                  rows={3}
                />
                <Field
                  label={tx('Recent activity', 'Actividad reciente', 'Atividade recente')}
                  value={p.currentActivity}
                  onChange={(v) => patchProx('currentActivity', v)}
                  rows={3}
                />
                <Field
                  label={tx(
                    'Nutrition & hydration',
                    'Alimentación e hidratación',
                    'Alimentação e hidratação'
                  )}
                  value={p.currentNutrition}
                  onChange={(v) => patchProx('currentNutrition', v)}
                  rows={3}
                />
                <Field
                  label={tx('Mood / stress', 'Ánimo / estrés', 'Ânimo / estresse')}
                  value={p.moodStress}
                  onChange={(v) => patchProx('moodStress', v)}
                  rows={2}
                />
                <Field
                  label={tx('Notes', 'Notas', 'Notas')}
                  value={p.notes}
                  onChange={(v) => patchProx('notes', v)}
                  rows={2}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Field
                  label={tx(
                    'Past medical history',
                    'Antecedentes personales patológicos',
                    'Antecedentes pessoais patológicos'
                  )}
                  value={r.personalHistory}
                  onChange={(v) => patchRemote('personalHistory', v)}
                  rows={3}
                />
                <Field
                  label={tx('Surgical history', 'Antecedentes quirúrgicos', 'Antecedentes cirúrgicos')}
                  value={r.surgicalHistory}
                  onChange={(v) => patchRemote('surgicalHistory', v)}
                  rows={2}
                />
                <Field
                  label={
                    tx('Family history', 'Antecedentes familiares', 'Antecedentes familiares')
                  }
                  value={r.familyHistory}
                  onChange={(v) => patchRemote('familyHistory', v)}
                  rows={3}
                />
                <Field
                  label={tx('Allergies', 'Alergias', 'Alergias')}
                  value={r.allergies}
                  onChange={(v) => patchRemote('allergies', v)}
                  rows={2}
                />
                <Field
                  label={
                    tx('Current medications', 'Medicación habitual', 'Medicação habitual')
                  }
                  value={r.medications}
                  onChange={(v) => patchRemote('medications', v)}
                  rows={2}
                />
                <Field
                  label={tx('Toxic habits', 'Hábitos tóxicos', 'Hábitos tóxicos')}
                  value={r.toxicHabits}
                  onChange={(v) => patchRemote('toxicHabits', v)}
                  rows={2}
                />
                <Field
                  label={tx('Occupation', 'Ocupación', 'Ocupação')}
                  value={r.occupation}
                  onChange={(v) => patchRemote('occupation', v)}
                  rows={2}
                />
                <Field
                  label={tx(
                    'Usual physical activity',
                    'Actividad física habitual',
                    'Atividade física habitual'
                  )}
                  value={r.physicalActivity}
                  onChange={(v) => patchRemote('physicalActivity', v)}
                  rows={3}
                />
                {profile?.sex === 'female' && (
                  <Field
                    label={tx(
                      'Gynecologic / obstetric history',
                      'Antecedentes gineco-obstétricos',
                      'Antecedentes gineco-obstétricos'
                    )}
                    value={r.gynObstetric}
                    onChange={(v) => patchRemote('gynObstetric', v)}
                    rows={3}
                  />
                )}
                <Field
                  label={tx('Other', 'Otros', 'Outros')}
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
                ? tx('✓ Saved', '✓ Guardado', '✓ Salvo')
                : tx('Save anamnesis', 'Guardar anamnesis', 'Salvar anamnese')}
            </button>
          </div>
        )}

        {/* ── FHIR export (kept) ── */}
        {tab === 'fhir' && (
          <div className="space-y-3">
            <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
              {tx(
                'HL7 FHIR R4 Bundle with Patient, Composition, and Observations (sensors, sleep, hydration, cycle, sports).',
                'Bundle HL7 FHIR R4 con Patient, Composition y Observations (sensores, sueño, hidratación, ciclo, deportes).',
                'Bundle HL7 FHIR R4 com Patient, Composition e Observations (sensores, sono, hidratação, ciclo, esportes).'
              )}
            </p>

            <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 px-3 py-2.5 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-white font-medium">
                  {tx('Standard', 'Estándar', 'Padrão')}
                </p>
                <p className="text-[10px] text-[var(--sage)]">
                  HL7 FHIR R4 · application/fhir+json
                </p>
              </div>
              <p className="text-sm font-bold text-[var(--accent)] tabular-nums">
                {entryCount}{' '}
                <span className="text-[10px] font-normal text-[var(--sage)]">
                  {tx('resources', 'recursos', 'recursos')}
                </span>
              </p>
            </div>

            <ul className="text-[11px] text-[#D8E1D9]/75 space-y-1 list-disc pl-4">
              <li>Patient {profile?.name ? `(${profile.name})` : ''}</li>
              <li>Observations · biomarcadores / sensores</li>
              <li>
                {tx(
                  'Sleep, hydration, sports',
                  'Sueño, hidratación, deportes',
                  'Sono, hidratação, esportes'
                )}
              </li>
              {profile?.sex === 'female' && (
                <li>
                  {tx(
                    'Menstrual cycle (if logged)',
                    'Ciclo menstrual (si hay datos)',
                    'Ciclo menstrual (se houver dados)'
                  )}
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
                  ? tx('Preparing…', 'Preparando…', 'Preparando…')
                  : tx(
                      'Share / download FHIR',
                      'Compartir / descargar FHIR',
                      'Compartilhar / baixar FHIR'
                    )}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyFhir()}
                  className="btn-secondary flex-1 py-2.5 text-xs"
                >
                  {tx('Copy JSON', 'Copiar JSON', 'Copiar JSON')}
                </button>
                <button
                  type="button"
                  onClick={() => setFhirPreview((v) => !v)}
                  className="btn-secondary flex-1 py-2.5 text-xs"
                >
                  {fhirPreview
                    ? tx('Hide preview', 'Ocultar preview', 'Ocultar preview')
                    : tx('Preview', 'Vista previa', 'Prévia')}
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
          {tx(
            'Share only with trusted clinicians. Data leaves your device when you export. Does not replace professional medical evaluation.',
            'Comparte solo con profesionales de confianza. Los datos salen de tu dispositivo al exportar. No sustituye evaluación médica profesional.',
            'Compartilhe só com profissionais de confiança. Os dados saem do dispositivo ao exportar. Não substitui avaliação médica profissional.'
          )}
        </p>
      </div>
    </section>
  );
}
