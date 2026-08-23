'use client';

import { useEffect, useState } from 'react';
import {
  loadDailyIntention,
  remainingFastMs,
  saveIntentionText,
  startDigitalFast,
  stopDigitalFast,
  type DailyIntentionState,
} from '@/lib/freedom/daily-intention';
import { tx3 } from '@/lib/i18n/locale';

type Props = {
  lang?: 'es' | 'en' | 'pt' | string;
  compact?: boolean;
};

const FASTS = [15, 30, 60, 90];

function fmtMs(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Daily north-star + digital fast. Pioneer pattern: Stoic intention + Freedom.to attention fast.
 */
export default function DailyIntentionCard({ lang = 'en', compact = false }: Props) {
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
  const [state, setState] = useState<DailyIntentionState | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const s = loadDailyIntention();
      setState(s);
      setDraft(s.text);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!state?.fastUntil) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (state.fastUntil && t >= state.fastUntil) {
        setState(stopDigitalFast());
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state?.fastUntil]);

  if (!state) return null;

  const remain = remainingFastMs(state, now);
  const fasting = remain > 0;

  const save = () => {
    const next = saveIntentionText(draft);
    setState(next);
    setEditing(false);
  };

  return (
    <section className={`intention-card ${compact ? 'intention-card-compact' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--pillar-freedom)]">
            {tx('Today’s intention', 'Intención de hoy', 'Intenção de hoje')}
          </p>
          {!compact && (
            <p className="text-[11px] text-[var(--sage)] mt-1 leading-relaxed">
              {tx(
                'One sentence that governs your yes and no. Attention is a form of liberty.',
                'Una frase que gobierna tu sí y tu no. La atención es una forma de libertad.',
                'Uma frase que governa o teu sim e o teu não. A atenção é uma forma de liberdade.'
              )}
            </p>
          )}
        </div>
        {fasting && (
          <span className="intention-fast-badge tabular-nums">{fmtMs(remain)}</span>
        )}
      </div>

      {editing || !state.text ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={compact ? 2 : 3}
            maxLength={280}
            placeholder={tx(
              'E.g. No feed before the Word. Finish the work I already started.',
              'Ej: Nada de feed antes de la Palabra. Terminar el trabajo ya empezado.',
              'Ex.: Nada de feed antes da Palavra. Terminar o trabalho já começado.'
            )}
            className="input-soft py-2.5 text-sm resize-none"
          />
          <div className="flex gap-2">
            {state.text ? (
              <button
                type="button"
                onClick={() => {
                  setDraft(state.text);
                  setEditing(false);
                }}
                className="btn-outline-sm"
              >
                {tx('Cancel', 'Cancelar', 'Cancelar')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim()}
              className="btn-sm flex-1"
            >
              {tx('Seal intention', 'Sellar intención', 'Selar intenção')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2.5 w-full text-left group"
        >
          <p className="text-[13px] text-white leading-snug text-pretty group-hover:text-[var(--accent)] transition-colors">
            <span className="text-[var(--pillar-freedom)] font-display mr-0.5">“</span>
            {state.text}
            <span className="text-[var(--pillar-freedom)] font-display ml-0.5">”</span>
          </p>
          <p className="text-[10px] text-[var(--sage)] mt-1">
            {tx('Tap to edit', 'Toca para editar', 'Toque para editar')}
          </p>
        </button>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--sage)] mb-2">
          {tx('Digital fast', 'Ayuno digital', 'Jejum digital')}
        </p>
        {fasting ? (
          <button
            type="button"
            onClick={() => setState(stopDigitalFast())}
            className="btn-outline-sm w-full py-2"
          >
            {tx('End fast', 'Terminar ayuno', 'Encerrar jejum')} · {fmtMs(remain)}
          </button>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {FASTS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setState(startDigitalFast(m))}
                className="pill-soft text-[10px]"
              >
                {m} min
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
