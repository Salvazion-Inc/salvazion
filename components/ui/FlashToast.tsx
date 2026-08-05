'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type FlashOpts = {
  /** soft = gentle auto feedback (no heavy checkmark chrome) */
  tone?: 'default' | 'soft';
  durationMs?: number;
};

/**
 * Lightweight save/feedback toast used across editable screens.
 * Renders a fixed pill; call `flash("Cambios guardados")` after writes.
 * Use `tone: 'soft'` for auto-complete / passive detections.
 */
export function useFlashToast(defaultDurationMs = 2200) {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'default' | 'soft'>('default');
  const timerRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMessage(null);
  }, []);

  const flash = useCallback(
    (msg: string, opts?: FlashOpts) => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      setTone(opts?.tone === 'soft' ? 'soft' : 'default');
      setMessage(msg);
      const ms = opts?.durationMs ?? defaultDurationMs;
      timerRef.current = window.setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, ms);
    },
    [defaultDurationMs]
  );

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const toast = message ? (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] max-w-[90vw] truncate transition-all ${
        tone === 'soft'
          ? 'toast-soft border border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface)_92%,#0a120c)] text-[var(--off-white)] text-[12px] px-3.5 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.45)]'
          : 'toast-soft whitespace-nowrap'
      }`}
      role="status"
      aria-live="polite"
    >
      {tone === 'soft' ? (
        <span className="inline-flex items-center gap-1.5">
          <i
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 animate-pulse"
            aria-hidden
          />
          {message}
        </span>
      ) : (
        <>✓ {message}</>
      )}
    </div>
  ) : null;

  return { flash, clear, message, toast };
}
