'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UserProfile } from '@/lib/types';
import { calculateAge } from '@/lib/store/profile';
import { fileToCompressedDataUrl } from '@/lib/health/image-compress';
import {
  bodyProgressSeries,
  createDraftSession,
  deleteBodySession,
  loadBodySessions,
  saveBodySession,
  type BodyCompositionSession,
  type BodyMassBreakdown,
  type BodyPhotoView,
} from '@/lib/health/body-composition';
import PhotoSourcePicker from '@/components/health/PhotoSourcePicker';

type Props = {
  profile: Partial<UserProfile> | null;
  lang?: 'es' | 'en';
  onAnalyzed?: () => void;
};

const VIEWS: { id: BodyPhotoView; es: string; en: string }[] = [
  { id: 'front', es: 'Frontal', en: 'Front' },
  { id: 'side', es: 'Lateral', en: 'Side' },
  { id: 'back', es: 'Posterior', en: 'Back' },
];

export default function BodyCompositionPanel({
  profile,
  lang = 'es',
  onAnalyzed,
}: Props) {
  const es = lang !== 'en';
  const [sessions, setSessions] = useState<BodyCompositionSession[]>([]);
  const [photos, setPhotos] = useState<
    Partial<Record<BodyPhotoView, string>>
  >({});
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<BodyCompositionSession | null>(null);

  const reload = useCallback(() => {
    const list = loadBodySessions();
    setSessions(list);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const progress = useMemo(() => bodyProgressSeries(), [sessions]);

  const onPick = async (view: BodyPhotoView, file: File) => {
    setError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, {
        maxEdge: 1280,
        quality: 0.8,
      });
      setPhotos((p) => ({ ...p, [view]: dataUrl }));
    } catch {
      setError(es ? 'No se pudo leer la imagen' : 'Could not read image');
    }
  };

  const analyze = async () => {
    if (!photos.front && !photos.side && !photos.back) {
      setError(
        es
          ? 'Sube al menos una foto (ideal: frontal, lateral y posterior).'
          : 'Upload at least one photo (ideal: front, side, back).'
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const h = heightCm ? Number(heightCm) : undefined;
      const w = weightKg ? Number(weightKg) : undefined;
      const age = profile?.birthDate
        ? calculateAge(profile.birthDate)
        : undefined;

      const res = await fetch('/api/health/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'body',
          lang: es ? 'es' : 'en',
          photos,
          heightCm: Number.isFinite(h) ? h : undefined,
          weightKg: Number.isFinite(w) ? w : undefined,
          sex: profile?.sex === 'female' || profile?.sex === 'male' ? profile.sex : undefined,
          age: age ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(
          json.message ||
            json.error ||
            (es ? 'Análisis fallido' : 'Analysis failed')
        );
      }
      const analysis = json.analysis as BodyMassBreakdown;
      const session = createDraftSession(photos, {
        heightCm: Number.isFinite(h!) ? h : undefined,
        weightKg: Number.isFinite(w!) ? w : undefined,
      });
      session.analysis = analysis;
      session.model = json.model || null;
      const list = saveBodySession(session);
      setSessions(list);
      setLatest(session);
      onAnalyzed?.();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : es
            ? 'Error al analizar'
            : 'Analysis error'
      );
    } finally {
      setBusy(false);
    }
  };

  const massRows = (a: BodyMassBreakdown) =>
    [
      {
        label: es ? 'Peso' : 'Weight',
        value: a.weightKg != null ? `${a.weightKg} kg` : '—',
      },
      {
        label: es ? 'Masa muscular' : 'Muscle mass',
        value: a.muscleMassKg != null ? `${a.muscleMassKg} kg` : '—',
      },
      {
        label: es ? 'Masa ósea' : 'Bone mass',
        value: a.boneMassKg != null ? `${a.boneMassKg} kg` : '—',
      },
      {
        label: es ? 'Masa residual' : 'Residual mass',
        value: a.residualMassKg != null ? `${a.residualMassKg} kg` : '—',
      },
      {
        label: es ? 'Grasa / piel' : 'Fat / skin',
        value: a.skinFatMassKg != null ? `${a.skinFatMassKg} kg` : '—',
      },
      {
        label: es ? '% grasa' : 'Body fat %',
        value: a.bodyFatPercent != null ? `${a.bodyFatPercent}%` : '—',
      },
      {
        label: 'BMI',
        value: a.bmi != null ? String(a.bmi) : '—',
      },
    ] as const;

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
        <span>◈</span>
        {es
          ? 'Cineantropometría por foto'
          : 'Photo cineanthropometry'}
      </h2>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-3.5">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {es
            ? 'Sube fotos en traje de baño: frontal, lateral y posterior. Grok estima peso y fraccionamiento (muscular, ósea, residual, grasa/piel) y guarda el progreso en el tiempo. Estimación educativa — no es DEXA.'
            : 'Upload swimsuit photos: front, side, and back. Grok estimates weight and mass fractionation (muscle, bone, residual, fat/skin) and tracks changes over time. Educational estimate — not DEXA.'}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {VIEWS.map((v) => (
            <div key={v.id} className="space-y-1.5">
              <p className="text-[10px] text-center text-[var(--sage)]">
                {es ? v.es : v.en}
              </p>
              <PhotoSourcePicker
                lang={es ? 'es' : 'en'}
                facing="environment"
                compact
                onFile={(file) => void onPick(v.id, file)}
              >
                <div className="relative w-full aspect-[3/4] rounded-xl border border-[var(--border-soft)] bg-[#040404] overflow-hidden flex items-center justify-center">
                  {photos[v.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photos[v.id]}
                      alt={es ? v.es : v.en}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-[var(--sage)]/55 px-1 text-center leading-tight">
                      {es ? 'Cámara / Galería' : 'Camera / Gallery'}
                    </span>
                  )}
                </div>
              </PhotoSourcePicker>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-[var(--sage)] space-y-1">
            {es ? 'Talla (cm)' : 'Height (cm)'}
            <input
              type="number"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="175"
              className="input-soft py-2 text-sm w-full"
            />
          </label>
          <label className="text-[10px] text-[var(--sage)] space-y-1">
            {es ? 'Peso (kg)' : 'Weight (kg)'}
            <input
              type="number"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="72"
              className="input-soft py-2 text-sm w-full"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void analyze()}
          className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
        >
          {busy
            ? es
              ? 'Analizando con Grok…'
              : 'Analyzing with Grok…'
            : es
              ? 'Analizar composición corporal'
              : 'Analyze body composition'}
        </button>

        {error && (
          <p className="text-[11px] text-red-400 text-center" role="alert">
            {error}
          </p>
        )}

        {(latest?.analysis || sessions[0]?.analysis) && (
          <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 p-3 space-y-2.5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
              {es ? 'Último análisis' : 'Latest analysis'}
              {(latest || sessions[0])?.model
                ? ` · ${(latest || sessions[0])?.model}`
                : ''}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {massRows(
                (latest?.analysis || sessions[0]!.analysis)!
              ).map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg border border-[var(--border-soft)] px-2.5 py-2"
                >
                  <p className="text-[9px] text-[var(--sage)]/70">{row.label}</p>
                  <p className="text-sm font-bold tabular-nums text-white">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
            {(() => {
              const a = (latest?.analysis || sessions[0]?.analysis)!;
              return (
                <>
                  {a.somatotypeHint && (
                    <p className="text-[11px] text-[var(--off-white)]/85">
                      <span className="text-[var(--sage)]">
                        {es ? 'Somatotipo: ' : 'Somatotype: '}
                      </span>
                      {a.somatotypeHint}
                    </p>
                  )}
                  {a.observations && (
                    <p className="text-[11px] text-[var(--sage)] leading-relaxed">
                      {a.observations}
                    </p>
                  )}
                  {a.recommendations && (
                    <p className="text-[11px] text-[#8FD99A]/90 leading-relaxed">
                      {a.recommendations}
                    </p>
                  )}
                  <p className="text-[10px] text-[var(--sage)]/60">
                    {es ? 'Confianza' : 'Confidence'}: {a.confidence}
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {progress.length > 1 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
              {es ? 'Progreso en el tiempo' : 'Progress over time'}
            </p>
            <div className="flex items-end gap-1 h-20 px-0.5">
              {progress.slice(-12).map((p, i) => {
                const maxW = Math.max(
                  50,
                  ...progress.map((x) => x.weightKg || 0)
                );
                const h =
                  p.weightKg != null
                    ? Math.max(6, Math.round((p.weightKg / maxW) * 72))
                    : 4;
                return (
                  <div
                    key={`${p.date}-${i}`}
                    className="flex-1 flex flex-col items-center gap-0.5"
                    title={`${p.date}: ${p.weightKg ?? '—'} kg`}
                  >
                    <div
                      className="w-full max-w-[18px] rounded-t bg-[#4A9EFF]/85"
                      style={{ height: h }}
                    />
                    <span className="text-[7px] text-[var(--sage)]/60 tabular-nums">
                      {p.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[var(--sage)]/65">
              {es
                ? 'Barras = peso estimado por sesión de fotos.'
                : 'Bars = estimated weight per photo session.'}
            </p>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-[var(--border-soft)]">
            <p className="text-[10px] text-[var(--sage)]/70">
              {es ? 'Historial' : 'History'} ({sessions.length})
            </p>
            <ul className="space-y-1 max-h-36 overflow-y-auto">
              {sessions.slice(0, 8).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 text-[11px] text-[var(--off-white)]/85"
                >
                  <button
                    type="button"
                    className="text-left min-w-0 truncate hover:text-[var(--accent)]"
                    onClick={() => setLatest(s)}
                  >
                    {s.date}
                    {s.analysis?.weightKg != null
                      ? ` · ${s.analysis.weightKg} kg`
                      : ''}
                    {s.analysis?.bodyFatPercent != null
                      ? ` · ${s.analysis.bodyFatPercent}%`
                      : ''}
                  </button>
                  <button
                    type="button"
                    className="text-red-400/80 shrink-0 text-[10px]"
                    onClick={() => setSessions(deleteBodySession(s.id))}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
