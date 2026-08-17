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
import AiUsageMeter from '@/components/billing/AiUsageMeter';
import { useAiUsage } from '@/lib/billing/ai-usage-client';
import { tx3 } from '@/lib/i18n/locale';

type Props = {
  profile: Partial<UserProfile> | null;
  lang?: 'es' | 'en' | 'pt';
  onAnalyzed?: () => void;
};

const VIEWS: { id: BodyPhotoView; es: string; en: string; pt: string }[] = [
  { id: 'front', es: 'Frente', en: 'Front', pt: 'Frente' },
  { id: 'back', es: 'Espalda', en: 'Back', pt: 'Costas' },
  { id: 'right', es: 'Derecha', en: 'Right', pt: 'Direita' },
  { id: 'left', es: 'Izquierda', en: 'Left', pt: 'Esquerda' },
];

export default function BodyCompositionPanel({
  profile,
  lang = 'en',
  onAnalyzed,
}: Props) {
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
  const [sessions, setSessions] = useState<BodyCompositionSession[]>([]);
  const [photos, setPhotos] = useState<
    Partial<Record<BodyPhotoView, string>>
  >({});
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<BodyCompositionSession | null>(null);
  const { refresh: refreshUsage } = useAiUsage();

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
      setError(tx('Could not read image', 'No se pudo leer la imagen', 'Não foi possível ler a imagem'));
    }
  };

  const analyze = async () => {
    if (!photos.front && !photos.back && !photos.right && !photos.left) {
      setError(
        tx(
          'Upload at least one photo (ideal: front, back, right and left).',
          'Sube al menos una foto (ideal: frente, espalda, derecha e izquierda).',
          'Envie pelo menos uma foto (ideal: frente, costas, direita e esquerda).'
        )
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
          lang,
          photos,
          heightCm: Number.isFinite(h) ? h : undefined,
          weightKg: Number.isFinite(w) ? w : undefined,
          sex: profile?.sex === 'female' || profile?.sex === 'male' ? profile.sex : undefined,
          age: age ?? undefined,
        }),
      });
      const json = await res.json();
      void refreshUsage();
      if (!res.ok || !json.ok) {
        throw new Error(
          json.message ||
            json.error ||
            tx('Analysis failed', 'Análisis fallido', 'Análise falhou')
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
          : tx('Analysis error', 'Error al analizar', 'Erro ao analisar')
      );
    } finally {
      setBusy(false);
    }
  };

  const massRows = (a: BodyMassBreakdown) =>
    [
      {
        label: tx('Weight', 'Peso', 'Peso'),
        value: a.weightKg != null ? `${a.weightKg} kg` : '—',
      },
      {
        label: tx('Muscle mass', 'Masa muscular', 'Massa muscular'),
        value: a.muscleMassKg != null ? `${a.muscleMassKg} kg` : '—',
      },
      {
        label: tx('Bone mass', 'Masa ósea', 'Massa óssea'),
        value: a.boneMassKg != null ? `${a.boneMassKg} kg` : '—',
      },
      {
        label: tx('Residual mass', 'Masa residual', 'Massa residual'),
        value: a.residualMassKg != null ? `${a.residualMassKg} kg` : '—',
      },
      {
        label: tx('Fat / skin', 'Grasa / piel', 'Gordura / pele'),
        value: a.skinFatMassKg != null ? `${a.skinFatMassKg} kg` : '—',
      },
      {
        label: tx('Body fat %', '% grasa', '% gordura'),
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
        {tx('Photo cineanthropometry', 'Cineantropometría por foto', 'Cineantropometria por foto')}
      </h2>
      <div className="mb-3">
        <AiUsageMeter feature="vision_body" />
      </div>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-3.5">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {tx(
            'Upload four swimsuit photos: front, back, right side and left side. Salvazion AI estimates weight and mass fractionation (muscle, bone, residual, fat/skin) and tracks changes over time. Educational estimate — not DEXA.',
            'Sube cuatro fotos en traje de baño: frente, espalda, lado derecho e izquierdo. La IA Salvazion estima peso y fraccionamiento (muscular, ósea, residual, grasa/piel) y guarda el progreso en el tiempo. Estimación educativa — no es DEXA.',
            'Envie quatro fotos de maiô: frente, costas, lado direito e esquerdo. A IA Salvazion estima peso e fracionamento (muscular, óssea, residual, gordura/pele) e guarda o progresso no tempo. Estimativa educativa — não é DEXA.'
          )}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {VIEWS.map((v) => (
            <div key={v.id} className="space-y-1">
              <p className="text-[10px] text-center text-[var(--sage)]">
                {tx(v.en, v.es, v.pt)}
              </p>
              <PhotoSourcePicker
                lang={lang}
                facing="environment"
                compact
                hasPhoto={!!photos[v.id]}
                disabled={busy}
                onFile={(file) => void onPick(v.id, file)}
                onClear={() =>
                  setPhotos((p) => {
                    const next = { ...p };
                    delete next[v.id];
                    return next;
                  })
                }
                title={
                  photos[v.id]
                    ? tx(`Change photo · ${v.en}`, `Cambiar foto · ${v.es}`, `Trocar foto · ${v.pt}`)
                    : tx(`Add photo · ${v.en}`, `Añadir foto · ${v.es}`, `Adicionar foto · ${v.pt}`)
                }
                subtitle={tx(
                  'Camera or gallery / folders (like profile)',
                  'Cámara o galería / carpetas (como en perfil)',
                  'Câmera ou galeria / pastas (como no perfil)'
                )}
              >
                {photos[v.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photos[v.id]}
                    alt={tx(v.en, v.es, v.pt)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-[var(--sage)]/55 px-1.5 text-center leading-tight">
                    {tx('Tap for photo', 'Toca para foto', 'Toque para foto')}
                  </span>
                )}
              </PhotoSourcePicker>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-[var(--sage)] space-y-1">
            {tx('Height (cm)', 'Talla (cm)', 'Altura (cm)')}
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
            {tx('Weight (kg)', 'Peso (kg)', 'Peso (kg)')}
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
            ? tx('Analyzing with Salvazion AI…', 'Analizando con IA Salvazion…', 'Analisando com IA Salvazion…')
            : tx(
                'Analyze body composition',
                'Analizar composición corporal',
                'Analisar composição corporal'
              )}
        </button>

        {error && (
          <p className="text-[11px] text-red-400 text-center" role="alert">
            {error}
          </p>
        )}

        {(latest?.analysis || sessions[0]?.analysis) && (
          <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 p-3 space-y-2.5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
              {tx('Latest analysis', 'Último análisis', 'Última análise')}
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
                        {tx('Somatotype: ', 'Somatotipo: ', 'Somatotipo: ')}
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
                    {tx('Confidence', 'Confianza', 'Confiança')}: {a.confidence}
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {progress.length > 1 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
              {tx('Progress over time', 'Progreso en el tiempo', 'Progresso no tempo')}
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
              {tx(
                'Bars = estimated weight per photo session.',
                'Barras = peso estimado por sesión de fotos.',
                'Barras = peso estimado por sessão de fotos.'
              )}
            </p>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-[var(--border-soft)]">
            <p className="text-[10px] text-[var(--sage)]/70">
              {tx('History', 'Historial', 'Histórico')} ({sessions.length})
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
