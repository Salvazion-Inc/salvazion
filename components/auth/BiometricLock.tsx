'use client';

import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/I18nProvider';
import {
  BiometricCancelledError,
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
import FingerprintMark from '@/components/auth/FingerprintMark';

/**
 * Full-screen thumb lock over the Hub once the user enables biometric unlock.
 */
export default function BiometricLock({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncLock = useCallback(() => {
    if (!isBiometricEnabled()) {
      setLocked(false);
      return;
    }
    const hold = isAppUnlocked() && !shouldRelockOnForeground();
    setLocked(!hold);
  }, []);

  useLayoutEffect(() => {
    syncLock();
  }, [syncLock]);

  useEffect(() => {
    const unsub = subscribeBiometricChanged(syncLock);

    const onHide = () => {
      if (isBiometricEnabled()) markAppBackgrounded();
    };
    const onShow = () => {
      if (!isBiometricEnabled()) {
        setLocked(false);
        return;
      }
      if (shouldRelockOnForeground()) {
        markAppLocked();
        setLocked(true);
      }
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') onHide();
      else onShow();
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('focus', onShow);

    let removeNative: (() => void) | undefined;
    void import('@capacitor/app')
      .then(({ App }) =>
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) onShow();
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
      window.removeEventListener('focus', onShow);
      removeNative?.();
    };
  }, [syncLock]);

  async function handleUnlock() {
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
      setLocked(false);
    } catch (err) {
      if (!(err instanceof BiometricCancelledError)) {
        setError(t('auth.biometricFailed'));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    router.replace('/auth/login');
  }

  return (
    <>
      {children}
      {locked ? (
        <div
          className="fixed inset-0 z-[80] bg-[var(--true-black)] flex flex-col items-center justify-center px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="biometric-lock-title"
        >
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full border border-[var(--border-strong)] flex items-center justify-center overflow-hidden lion-glow">
              <Image
                src="/logo.png"
                alt=""
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <h1
              id="biometric-lock-title"
              className="font-display text-2xl font-bold text-[var(--accent)] tracking-tight"
            >
              {t('settings.biometricLockTitle')}
            </h1>
            <p className="text-sm text-[var(--sage)] mt-1.5">
              {t('settings.biometricLockSubtitle')}
            </p>

            <button
              type="button"
              onClick={() => void handleUnlock()}
              disabled={busy}
              className="mt-8 mx-auto w-24 h-24 rounded-full border border-[var(--accent)] bg-[var(--surface-active)] text-[var(--accent)] flex items-center justify-center hover:shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_28%,transparent)] transition disabled:opacity-60"
              aria-label={t('settings.biometricLockCta')}
            >
              <FingerprintMark size={42} />
            </button>
            <p className="mt-3 text-sm font-medium text-[var(--accent)]">
              {busy ? t('auth.biometricProcessing') : t('settings.biometricLockCta')}
            </p>

            {error ? (
              <p role="alert" className="mt-4 text-sm text-red-400">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={busy}
              className="mt-10 text-xs text-[var(--sage)] hover:text-[var(--accent)] transition"
            >
              {t('settings.biometricUsePassword')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
