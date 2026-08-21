'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/I18nProvider';
import {
  BiometricCancelledError,
  getBiometricState,
  isAppUnlocked,
  isBiometricEnabled,
  markAppBackgrounded,
  markAppLocked,
  persistBiometricVault,
  shouldRelockOnForeground,
  subscribeBiometricChanged,
  unlockWithBiometric,
} from '@/lib/auth/biometric';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/lib/store/profile';
import BiometricUnlockScreen from '@/components/auth/BiometricUnlockScreen';
import { useAutoBiometricPrompt } from '@/components/auth/useBiometric';

/**
 * Full-screen thumb lock over the Hub once the user enables biometric unlock.
 * The system fingerprint sheet opens by itself — no tap required (Jupiter-style).
 */
export default function BiometricLock({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptCycle, setPromptCycle] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const busyRef = useRef(false);
  const lockedRef = useRef(false);
  const pendingPromptRef = useRef(false);
  const resumePromptAfterRef = useRef(0);

  const syncLock = useCallback(() => {
    if (!isBiometricEnabled()) {
      setLocked(false);
      return;
    }
    const hold = isAppUnlocked() && !shouldRelockOnForeground();
    setLocked(!hold);
  }, []);

  useLayoutEffect(() => {
    // Must lock before paint so Hub UI never flashes unlocked.
    // LocalStorage is the source of truth; this is a one-shot hydrate, not a render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate lock from localStorage
    syncLock();
  }, [syncLock]);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    const unsub = subscribeBiometricChanged(syncLock);

    const onHide = () => {
      if (isBiometricEnabled()) markAppBackgrounded();
    };
    const onShow = (source: 'resume' | 'focus') => {
      if (!isBiometricEnabled()) {
        lockedRef.current = false;
        setLocked(false);
        return;
      }
      const relock = shouldRelockOnForeground();
      if (relock) {
        markAppLocked();
        lockedRef.current = true;
        setLocked(true);
      }
      // System fingerprint sheet can pause the WebView (focus / appStateChange).
      // Auto-prompt only on a real document-visible resume, not on sheet close.
      if (source !== 'resume') return;
      if (busyRef.current) return;
      if (Date.now() < resumePromptAfterRef.current) return;
      if (!lockedRef.current && !relock) return;
      setAttempted(false);
      setPromptCycle((n) => n + 1);
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') onHide();
      else onShow('resume');
    };
    const onFocus = () => onShow('focus');

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('focus', onFocus);

    let removeNative: (() => void) | undefined;
    void import('@capacitor/app')
      .then(({ App }) =>
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) onShow('focus');
          else onHide();
        })
      )
      .then((handle) => {
        removeNative = () => {
          void handle.remove();
        };
      })
      .catch(() => {
        /* web */
      });

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('focus', onFocus);
      removeNative?.();
    };
  }, [syncLock]);

  const unlockRef = useRef<() => Promise<void>>(async () => {});

  async function handleUnlock() {
    if (busyRef.current) {
      pendingPromptRef.current = true;
      return;
    }
    busyRef.current = true;
    pendingPromptRef.current = false;
    setBusy(true);
    setError(null);
    try {
      const vault = await unlockWithBiometric(t('settings.biometricLockSubtitle'));
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          persistBiometricVault(
            {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            },
            data.session.user.email || vault.email
          );
        }
      } catch {
        /* lock still succeeds — session cookies may already be valid */
      }
      pendingPromptRef.current = false;
      lockedRef.current = false;
      setAttempted(false);
      setLocked(false);
    } catch (err) {
      if (!(err instanceof BiometricCancelledError)) {
        setError(t('auth.biometricFailed'));
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
      resumePromptAfterRef.current = Date.now() + 800;
      if (lockedRef.current) setAttempted(true);
      if (pendingPromptRef.current && lockedRef.current) {
        pendingPromptRef.current = false;
        void unlockRef.current();
      }
    }
  }

  useEffect(() => {
    unlockRef.current = handleUnlock;
  });

  useAutoBiometricPrompt({
    active: locked,
    cycle: promptCycle,
    run: handleUnlock,
  });

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    router.replace('/auth/login');
  }

  const status =
    busy || !attempted ? t('auth.biometricProcessing') : t('auth.biometricRetry');

  return (
    <>
      {children}
      {locked ? (
        <div
          className="fixed inset-0 z-[80] bg-[var(--true-black)] flex flex-col items-center justify-center px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="biometric-unlock-title"
        >
          <BiometricUnlockScreen
            title={t('settings.biometricLockTitle')}
            subtitle={t('settings.biometricLockSubtitle')}
            status={status}
            email={getBiometricState()?.email}
            busy={busy}
            error={error}
            promptLabel={t('settings.biometricLockCta')}
            onPrompt={() => void handleUnlock()}
            footer={
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={busy}
                className="text-xs text-[var(--sage)] hover:text-[var(--accent)] transition"
              >
                {t('settings.biometricUsePassword')}
              </button>
            }
          />
        </div>
      ) : null}
    </>
  );
}
