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
import { pickLang } from '@/lib/i18n/locale';

type Props = {
  lang?: 'es' | 'en' | 'pt';
  onApplied?: () => void;
};

const SLOTS: { id: MealSlot; es: string; en: string; pt: string }[] = [
  { id: 'breakfast', es: 'Desayuno', en: 'Breakfast', pt: 'Café da manhã' },
  { id: 'lunch', es: 'Almuerzo', en: 'Lunch', pt: 'Almoço' },
  { id: 'dinner', es: 'Cena', en: 'Dinner', pt: 'Jantar' },
  { id: 'snack', es: 'Snack', en: 'Snack', pt: 'Lanche' },
];

const PYRAMID_LABELS: {
  key: keyof FoodPyramidShare;
  es: string;
  en: string;
  pt: string;
  color: string;
}[] = [
  { key: 'grains', es: 'Cereales', en: 'Grains', pt: 'Cereais', color: '#C4A35A' },
  { key: 'vegetables', es: 'Verduras', en: 'Vegetables', pt: 'Vegetais', color: '#7BC98A' },
  { key: 'fruits', es: 'Frutas', en: 'Fruits', pt: 'Frutas', color: '#E07A5F' },
  { key: 'protein', es: 'Proteínas', en: 'Protein', pt: 'Proteínas', color: '#4A9EFF' },
  { key: 'dairy', es: 'Lácteos', en: 'Dairy', pt: 'Laticínios', color: '#A8DADC' },
  { key: 'fats', es: 'Grasas', en: 'Fats', pt: 'Gorduras', color: '#F2CC8F' },
  { key: 'sugars', es: 'Azúcares', en: 'Sugars', pt: 'Açúcares', color: '#E63946' },
];

function PyramidBars({
  pyramid,
  lang,
}: {
  pyramid: FoodPyramidShare;
  lang?: 'es' | 'en' | 'pt';
}) {
  return (
    <div className="space-y-1.5">
      {PYRAMID_LABELS.map((row) => {
        const v = pyramid[row.key] ?? 0;
        return (
          <div key={row.key} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[9px] text-[var(--sage)] truncate">
              {pickLang(lang, { en: row.en, es: row.es, pt: row.pt })}
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

export default function MealPhotoPanel({ lang = 'en', onApplied }: Props) {
  const tx = (en: string, es: string, pt: string) => pickLang(lang, { en, es, pt });
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
      setError(tx('Could not read image', 'No se pudo leer la imagen', 'Não foi possível ler a imagem'));
    }
  };

  const analyze = async () => {
    if (!photo) {
      setError(tx('Take or upload a meal photo', 'Toma o sube una foto del plato', 'Tire ou envie uma foto do prato'));
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
          lang,
          photo,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(
          json.message ||
            json.error ||
            tx('Analysis failed', 'Análisis fallido', 'Análise falhou')
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
          : tx('Analysis error', 'Error al analizar', 'Erro ao analisar')
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
        {tx('Meal photo · Grok', 'Foto de comida · Grok', 'Foto da refeição · Grok')}
      </h2>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-3.5">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {tx(
            'Photograph your plate. Grok estimates foods, calories, macros, and classic food-pyramid placement (USDA/Kennedy-style). Educational estimate.',
            'Fotografía tu plato. Grok estima alimentos, calorías, macros y cómo se ubica en la pirámide alimenticia clásica (estilo USDA/Kennedy). Estimación educativa.',
            'Fotografe o prato. O Grok estima alimentos, calorias, macros e a posição na pirâmide alimentar clássica (estilo USDA/Kennedy). Estimativa educativa.'
          )}
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
              {pickLang(lang, { en: s.en, es: s.es, pt: s.pt })}
            </button>
          ))}
        </div>

        <PhotoSourcePicker
          lang={lang}
          facing="environment"
          hasPhoto={!!photo}
          disabled={busy}
          onFile={(file) => void onPick(file)}
          onClear={() => {
            setPhoto(null);
            setResult(null);
          }}
          title={photo ? undefined : tx('Meal photo', 'Foto del plato', 'Foto do prato')}
          subtitle={tx(
            'Same as profile photo: camera or folders',
            'Misma experiencia que tu foto de perfil: cámara o carpetas',
            'A mesma experiência da foto de perfil: câmera ou pastas'
          )}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={tx('Meal', 'Comida', 'Refeição')}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-[12px] text-[var(--sage)]/70 px-4 text-center leading-relaxed">
              {tx('Tap to add a meal photo', 'Toca para añadir foto del plato', 'Toque para adicionar foto do prato')}
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
            ? tx('Analyzing with Grok…', 'Analizando con Grok…', 'Analisando com Grok…')
            : tx(
                'Analyze nutrients & pyramid',
                'Analizar nutrientes y pirámide',
                'Analisar nutrientes e pirâmide'
              )}
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
                  {tx('Result', 'Resultado', 'Resultado')}
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
                {tx(
                  'Food pyramid (Kennedy/USDA-style)',
                  'Pirámide alimenticia (estilo Kennedy/USDA)',
                  'Pirâmide alimentar (estilo Kennedy/USDA)'
                )}
              </p>
              <PyramidBars pyramid={a.pyramid || emptyPyramid()} lang={lang} />
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
                ? tx('✓ Added to today’s log', '✓ Añadido al registro de hoy', '✓ Adicionado ao registro de hoje')
                : tx(
                    'Add to today’s nutrition log',
                    'Añadir a alimentación de hoy',
                    'Adicionar à alimentação de hoje'
                  )}
            </button>
          </div>
        )}

        {entries.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-[var(--border-soft)]">
            <p className="text-[10px] text-[var(--sage)]/70">
              {tx('Photo history', 'Historial de fotos', 'Histórico de fotos')} ({entries.length})
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
