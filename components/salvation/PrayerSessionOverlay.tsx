'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PrayerMotive } from '@/lib/salvation/prayer-motives';
import { tx3 } from '@/lib/i18n/locale';

const DURATIONS = [60, 180, 300, 600] as const;

type Props = {
  lang?: 'es' | 'en' | 'pt' | string;
  motives: PrayerMotive[];
  onPrayed: (id: string) => void;
  onClose: () => void;
  onSessionComplete: (elapsedSec: number) => void;
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PrayerSessionOverlay({
  lang = 'en',
  motives,
  onPrayed,
  onClose,
  onSessionComplete,
}: Props) {
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
  const queue = useMemo(
    () => motives.filter((m) => m.status === 'open' || m.status === 'prayed'),
    [motives]
  );
  const [idx, setIdx] = useState(0);
  const [duration, setDuration] = useState(300);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const scoredRef = useRef(false);
  const elapsedRef = useRef(0);
  const completeRef = useRef(onSessionComplete);

  const current = queue[idx] ?? null;
  const done = elapsed >= duration;
  const remaining = Math.max(0, duration - elapsed);
  const progress = Math.min(1, elapsed / Math.max(1, duration));

  useEffect(() => {
    completeRef.current = onSessionComplete;
  }, [onSessionComplete]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      elapsedRef.current += 1;
      const next = elapsedRef.current;
      setElapsed(next);
      if (next >= duration && !scoredRef.current) {
        scoredRef.current = true;
        setRunning(false);
        completeRef.current(next);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, duration]);

  const goNext = () => {
    if (idx + 1 < queue.length) setIdx(idx + 1);
    else setIdx(0);
  };

  return (
    <div
      className="prayer-session"
      role="dialog"
      aria-modal="true"
      aria-label={tx('Prayer session', 'Sesión de oración', 'Sessão de oração')}
    >
      <div className="prayer-session-glow" aria-hidden />
      <div className="prayer-session-flame" aria-hidden />

      <header className="relative z-[1] flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]/90">
          {tx('In His presence', 'En Su presencia', 'Na Sua presença')}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="pill-soft text-[10px]"
        >
          {tx('Close', 'Cerrar', 'Fechar')}
        </button>
      </header>

      <div className="relative z-[1] flex-1 flex flex-col items-center justify-center px-2 min-h-0">
        <div
          className="prayer-session-ring"
          style={{ ['--session-progress' as string]: String(progress) }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={elapsed}
          aria-label={tx('Prayer timer', 'Temporizador de oración', 'Temporizador de oração')}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(143,217,154,0.12)" strokeWidth="3.5" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${progress * 276.5} 276.5`}
              className="transition-[stroke-dasharray] duration-1000 linear"
              style={{ filter: 'drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 50%, transparent))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-3xl font-bold text-white tabular-nums leading-none">
              {fmt(remaining)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--sage)] mt-2">
              {done
                ? tx('Amen', 'Amén', 'Amém')
                : running
                  ? tx('Praying', 'Orando', 'Orando')
                  : tx('Paused', 'Pausa', 'Pausa')}
            </p>
          </div>
        </div>

        {!done && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDuration(d);
                  if (elapsedRef.current >= d) {
                    elapsedRef.current = 0;
                    setElapsed(0);
                    scoredRef.current = false;
                  }
                }}
                className={`pill-soft text-[10px] ${duration === d ? 'pill-soft-active' : ''}`}
              >
                {d / 60} min
              </button>
            ))}
          </div>
        )}

        {current ? (
          <article className="mt-7 w-full max-w-sm text-center min-h-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] mb-2">
              {tx('Priority', 'Prioridad', 'Prioridade')} {idx + 1} / {queue.length}
              {current.forWhom ? ` · ${current.forWhom}` : ''}
            </p>
            <p className="font-display text-[1.35rem] sm:text-2xl text-white leading-snug text-balance">
              {current.text}
            </p>
          </article>
        ) : (
          <p className="mt-7 text-sm text-[var(--sage)] text-center">
            {tx(
              'Add a request first, then return.',
              'Añade un motivo primero, luego vuelve.',
              'Adicione um motivo primeiro e volte.'
            )}
          </p>
        )}
      </div>

      <footer className="relative z-[1] space-y-2.5 pb-[env(safe-area-inset-bottom)]">
        {done ? (
          <p className="text-center text-sm text-[var(--accent)]">
            {tx('The time was offered.', 'El tiempo fue ofrendado.', 'O tempo foi ofertado.')}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="btn-outline-sm flex-1 py-2.5"
            disabled={done}
          >
            {running
              ? tx('Pause', 'Pausa', 'Pausa')
              : tx('Continue', 'Continuar', 'Continuar')}
          </button>
          {current ? (
            <button
              type="button"
              onClick={() => {
                onPrayed(current.id);
                goNext();
              }}
              className="btn-sm flex-1 py-2.5"
            >
              {tx('Amen · next', 'Amén · siguiente', 'Amém · seguinte')}
            </button>
          ) : null}
        </div>
        {queue.length > 1 && current ? (
          <button
            type="button"
            onClick={goNext}
            className="w-full text-center text-[11px] text-[var(--sage)] hover:text-[var(--accent)] transition-colors"
          >
            {tx('Skip without marking', 'Saltar sin marcar', 'Pular sem marcar')}
          </button>
        ) : null}
      </footer>
    </div>
  );
}
