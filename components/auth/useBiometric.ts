'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  getBiometricState,
  isBiometricEnabled,
  subscribeBiometricChanged,
} from '@/lib/auth/biometric';

/**
 * Sync local biometric enrollment before paint so the password form does not flash
 * on devices that already unlock with the thumb (Jupiter-style gate).
 */
export function useBiometricGate(): {
  ready: boolean;
  enabled: boolean;
  email: string | null;
} {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useLayoutEffect(() => {
    const sync = () => {
      const on = isBiometricEnabled();
      setEnabled(on);
      setEmail(getBiometricState()?.email || null);
      setReady(true);
    };
    sync();
    return subscribeBiometricChanged(sync);
  }, []);

  return { ready, enabled, email };
}

/**
 * Fire the system fingerprint sheet as soon as the lock/login screen is up.
 * Native BiometricPrompt does not need a tap. Clearing the timeout on re-entry
 * avoids stacked dialogs (React Strict Mode, app resume).
 */
export function useAutoBiometricPrompt(opts: {
  active: boolean;
  cycle?: number;
  run: () => void | Promise<void>;
  delayMs?: number;
}) {
  const runRef = useRef(opts.run);

  useEffect(() => {
    runRef.current = opts.run;
  }, [opts.run]);

  useEffect(() => {
    if (!opts.active) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void runRef.current();
    }, opts.delayMs ?? 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [opts.active, opts.cycle, opts.delayMs]);
}
