'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  addMeal,
  type MealSlot,
} from '@/lib/health/biomarkers';
import { fileToCompressedDataUrl } from '@/lib/health/image-compress';
import {
  createMealPhotoDraft,
  deleteMealPhoto,
  emptyPyramid,
  loadMealPhotos,
  saveMealPhoto,
  type FoodPyramidShare,
  type MealPhotoEntry,
  type MealVisionAnalysis,
} from '@/lib/health/meal-vision';
import PhotoSourcePicker from '@/components/health/PhotoSourcePicker';

type Props = {
  lang?: 'es' | 'en' | 'pt';
  onApplied?: () => void;
};

const SLOTS: { id: MealSlot; es: string; en: string }[] = [
  { id: 'breakfast', es: 'Desayuno', en: 'Breakfast' },
  { id: 'lunch', es: 'Almuerzo', en: 'Lunch' },
  { id: 'dinner', es: 'Cena', en: 'Dinner' },
  { id: 'snack', es: 'Snack', en: 'Snack' },
];

const PYRAMID_LABELS: {
  key: keyof FoodPyramidShare;
  es: string;
  en: string;
  color: string;
}[] = [
  { key: 'grains', es: 'Cereales', en: 'Grains', color: '#C4A35A' },
  { key: 'vegetables', es: 'Verduras', en: 'Vegetables', color: '#7BC98A' },
  { key: 'fruits', es: 'Frutas', en: 'Fruits', color: '#E07A5F' },
  { key: 'protein', es: 'Proteínas', en: 'Protein', color: '#4A9EFF' },
  { key: 'dairy', es: 'Lácteos', en: 'Dairy', color: '#A8DADC' },
  { key: 'fats', es: 'Grasas', en: 'Fats', color: '#F2CC8F' },
  { key: 'sugars', es: 'Azúcares', en: 'Sugars', color: '#E63946' },
];

function PyramidBars({
  pyramid,
  es,
}: {
  pyramid: FoodPyramidShare;
  es: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {PYRAMID_LABELS.map((row) => {
        const v = pyramid[row.key] ?? 0;
        return (
          <div key={row.key} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[9px] text-[var(--sage)] truncate">
              {es ? row.es : row.en}
            </span>
            <div className="flex-1 h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, v)}%`,
                  background: row.color,
                }}
              />
            </div>
            <span className="w-8 text-right text-[9px] tabular-nums text-[var(--off-white)]/80">
              {Math.round(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function MealPhotoPanel({ lang = 'es', onApplied }: Props) {
  const es = lang !== 'en';
  const [entries, setEntries] = useState<MealPhotoEntry[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [slot, setSlot] = useState<MealSlot>('lunch');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MealPhotoEntry | null>(null);

  const reload = useCallback(() => {
    setEntries(loadMealPhotos());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const onPick = async (file: File) => {
    setError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, {
        maxEdge: 1280,
        quality: 0.82,
      });
      setPhoto(dataUrl);
      setResult(null);
    } catch {
      setError(es ? 'No se pudo leer la imagen' : 'Could not read image');
    }
  };

  const analyze = async () => {
    if (!photo) {
      setError(es ? 'Toma o sube una foto del plato' : 'Take or upload a meal photo');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/health/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'meal',
          lang: es ? 'es' : 'en',
          photo,
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
      const analysis = json.analysis as MealVisionAnalysis;
      if (!analysis.pyramid) analysis.pyramid = emptyPyramid();
      const entry = createMealPhotoDraft(photo, slot);
      entry.analysis = analysis;
      entry.model = json.model || null;
      const list = saveMealPhoto(entry);
      setEntries(list);
      setResult(entry);
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

  const applyToLog = (entry: MealPhotoEntry) => {
    const a = entry.analysis;
    if (!a) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    addMeal({
      slot: entry.slot,
      time,
      quality: a.quality || 'mixed',
      estimatedKcal: a.estimatedKcal ?? undefined,
    });
    const next = { ...entry, appliedToLog: true };
    setEntries(saveMealPhoto(next));
    setResult(next);
    onApplied?.();
  };

  const a = result?.analysis;

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
        <span>◈</span>
        {es ? 'Foto de comida · Grok' : 'Meal photo · Grok'}
      </h2>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-3.5">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {es
            ? 'Fotografía tu plato. Grok estima alimentos, calorías, macros y cómo se ubica en la pirámide alimenticia clásica (estilo USDA/Kennedy). Estimación educativa.'
            : 'Photograph your plate. Grok estimates foods, calories, macros, and classic food-pyramid placement (USDA/Kennedy-style). Educational estimate.'}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {SLOTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlot(s.id)}
              className={`pill-soft text-[10px] ${
                slot === s.id ? 'pill-soft-active' : ''
              }`}
            >
              {es ? s.es : s.en}
            </button>
          ))}
        </div>

        <PhotoSourcePicker
          lang={es ? 'es' : 'en'}
          facing="environment"
          hasPhoto={!!photo}
          disabled={busy}
          onFile={(file) => void onPick(file)}
          onClear={() => {
            setPhoto(null);
            setResult(null);
          }}
          title={photo ? undefined : es ? 'Foto del plato' : 'Meal photo'}
          subtitle={
            es
              ? 'Misma experiencia que tu foto de perfil: cámara o carpetas'
              : 'Same as profile photo: camera or folders'
          }
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={es ? 'Comida' : 'Meal'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-[12px] text-[var(--sage)]/70 px-4 text-center leading-relaxed">
              {es ? 'Toca para añadir foto del plato' : 'Tap to add a meal photo'}
            </span>
          )}
        </PhotoSourcePicker>

        <button
          type="button"
          disabled={busy || !photo}
          onClick={() => void analyze()}
          className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
        >
          {busy
            ? es
              ? 'Analizando con Grok…'
              : 'Analyzing with Grok…'
            : es
              ? 'Analizar nutrientes y pirámide'
              : 'Analyze nutrients & pyramid'}
        </button>

        {error && (
          <p className="text-[11px] text-red-400 text-center" role="alert">
            {error}
          </p>
        )}

        {a && result && (
          <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
                  {es ? 'Resultado' : 'Result'}
                  {result.model ? ` · ${result.model}` : ''}
                </p>
                <p className="text-2xl font-bold tabular-nums text-white mt-0.5">
                  {a.estimatedKcal != null ? a.estimatedKcal : '—'}
                  <span className="text-sm font-semibold opacity-70 ml-1">
                    kcal
                  </span>
                </p>
              </div>
              <span className="text-[10px] text-[var(--sage)] shrink-0">
                {a.confidence} · {a.quality}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { k: 'P', v: a.macros.protein_g },
                  { k: 'C', v: a.macros.carbs_g },
                  { k: 'F', v: a.macros.fat_g },
                  { k: 'Fib', v: a.macros.fiber_g },
                ] as const
              ).map((m) => (
                <div
                  key={m.k}
                  className="rounded-lg border border-[var(--border-soft)] px-1.5 py-1.5 text-center"
                >
                  <p className="text-[9px] text-[var(--sage)]">{m.k}</p>
                  <p className="text-xs font-bold tabular-nums text-white">
                    {m.v != null ? `${m.v}g` : '—'}
                  </p>
                </div>
              ))}
            </div>

            {a.foods?.length > 0 && (
              <ul className="text-[11px] text-[var(--off-white)]/85 space-y-0.5">
                {a.foods.map((f, i) => (
                  <li key={`${f.name}-${i}`}>
                    • {f.name}
                    {f.portion ? (
                      <span className="text-[var(--sage)]"> · {f.portion}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70 mb-1.5">
                {es
                  ? 'Pirámide alimenticia (estilo Kennedy/USDA)'
                  : 'Food pyramid (Kennedy/USDA-style)'}
              </p>
              <PyramidBars pyramid={a.pyramid || emptyPyramid()} es={es} />
              {a.kennedyNote && (
                <p className="text-[11px] text-[var(--sage)] mt-2 leading-relaxed">
                  {a.kennedyNote}
                </p>
              )}
            </div>

            {a.microsSummary && (
              <p className="text-[11px] text-[var(--off-white)]/80 leading-relaxed">
                {a.microsSummary}
              </p>
            )}
            {a.advice && (
              <p className="text-[11px] text-[#8FD99A]/90 leading-relaxed">
                {a.advice}
              </p>
            )}

            <button
              type="button"
              disabled={result.appliedToLog}
              onClick={() => applyToLog(result)}
              className="btn-secondary w-full py-2 text-xs disabled:opacity-50"
            >
              {result.appliedToLog
                ? es
                  ? '✓ Añadido al registro de hoy'
                  : '✓ Added to today’s log'
                : es
                  ? 'Añadir a alimentación de hoy'
                  : 'Add to today’s nutrition log'}
            </button>
          </div>
        )}

        {entries.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-[var(--border-soft)]">
            <p className="text-[10px] text-[var(--sage)]/70">
              {es ? 'Historial de fotos' : 'Photo history'} ({entries.length})
            </p>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {entries.slice(0, 10).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-2 text-[11px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={e.photoDataUrl}
                    alt=""
                    className="w-8 h-8 rounded object-cover border border-[var(--border-soft)] shrink-0"
                  />
                  <button
                    type="button"
                    className="flex-1 text-left truncate text-[var(--off-white)]/85 hover:text-[var(--accent)]"
                    onClick={() => {
                      setResult(e);
                      setPhoto(e.photoDataUrl);
                      setSlot(e.slot);
                    }}
                  >
                    {e.date}
                    {e.analysis?.estimatedKcal != null
                      ? ` · ${e.analysis.estimatedKcal} kcal`
                      : ''}
                  </button>
                  <button
                    type="button"
                    className="text-red-400/80 text-[10px] shrink-0"
                    onClick={() => setEntries(deleteMealPhoto(e.id))}
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
