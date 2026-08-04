'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lightweight save/feedback toast used across editable screens.
 * Renders a fixed pill; call `flash("Cambios guardados")` after writes.
 */
export function useFlashToast(durationMs = 2200) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMessage(null);
  }, []);

  const flash = useCallback(
    (msg: string) => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      setMessage(msg);
      timerRef.current = window.setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
  }, []);

  const toast = message ? (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] toast-soft whitespace-nowrap max-w-[90vw] truncate"
      role="status"
      aria-live="polite"
    >
      ✓ {message}
    </div>
  ) : null;

  return { flash, clear, message, toast };
}
