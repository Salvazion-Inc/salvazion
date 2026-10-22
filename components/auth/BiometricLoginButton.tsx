'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/components/I18nProvider';
import { destinationAfterAuth, mapAuthError } from '@/lib/auth/paths';
import {
  BiometricCancelledError,
  disableBiometric,
  persistBiometricVault,
  unlockWithBiometric,
} from '@/lib/auth/biometric';
import { ensureProfileForUser, loadProfileAsync } from '@/lib/store/profile';
import BiometricUnlockScreen from '@/components/auth/BiometricUnlockScreen';
import { useAutoBiometricPrompt, useBiometricGate } from '@/components/auth/useBiometric';

/** True only for auth rejections (invalid/expired token), never for network errors. */
function isDeadSessionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; status?: number; code?: string; message?: string };
  if (e.name === 'AuthRetryableFetchError') return false;
  if (e.status === 400 || e.status === 401 || e.status === 403) return true;
  if (e.name === 'AuthApiError' || e.name === 'AuthSessionMissingError') return true;
  const blob = `${e.code ?? ''} ${e.message ?? ''}`.toLowerCase();
  return (
    blob.includes('refresh_token') ||
    blob.includes('refresh token') ||
    blob.includes('invalid') ||
    blob.includes('session_not_found') ||
    blob.includes('jwt expired')
  );
}

interface Props {
  next?: string;
  onError?: (msg: string) => void;
  error?: string | null;
  onUsePassword?: () => void;
}

/**
 * Primary unlock on the login screen when this device already enrolled the thumb.
 * Opens the system fingerprint sheet by itself — no tap required (Jupiter-style).
 */
export default function BiometricLoginButton({
  next = '/hub/dashboard',
  onError,
  error,
  onUsePassword,
}: Props) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { email } = useBiometricGate();
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const loadingRef = useRef(false);
  const pendingPromptRef = useRef(false);

  const unlockRef = useRef<() => Promise<void>>(async () => {});

  async function handleUnlock() {
    if (loadingRef.current) {
      pendingPromptRef.current = true;
      return;
    }
    loadingRef.current = true;
    pendingPromptRef.current = false;
    setLoading(true);
    try {
      const vault = await unlockWithBiometric(t('auth.biometricEnterHint'));
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: vault.access_token,
        refresh_token: vault.refresh_token,
      });
      if (sessionError || !data.session) {
        pendingPromptRef.current = false;
        if (sessionError && !isDeadSessionError(sessionError)) {
          // Network / transient failure: keep the vault so the next try can work.
          onError?.(t('auth.biometricFailed'));
          return;
        }
        // The stored refresh token is dead (revoked/expired server-side).
        // Fingerprint can never succeed with this vault, so drop it and send
        // the user to email/Google instead of re-prompting the sensor forever.
        disableBiometric();
        onError?.(t('auth.biometricExpired'));
        onUsePassword?.();
        return;
      }
      pendingPromptRef.current = false;
      persistBiometricVault(
        {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
        data.session.user.email || vault.email
      );

      let dest = next;
      try {
        await ensureProfileForUser();
        const profile = await loadProfileAsync();
        dest = destinationAfterAuth(next, Boolean(profile?.onboardingCompleted));
      } catch {
        /* keep next */
      }
      router.push(dest);
      router.refresh();
    } catch (err) {
      if (!(err instanceof BiometricCancelledError)) {
        onError?.(
          err instanceof Error ? mapAuthError(err.message, lang) : t('auth.biometricFailed')
        );
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setAttempted(true);
      if (pendingPromptRef.current) {
        pendingPromptRef.current = false;
        void unlockRef.current();
      }
    }
  }

  useEffect(() => {
    unlockRef.current = handleUnlock;
  });

  useAutoBiometricPrompt({
    active: true,
    run: handleUnlock,
  });

  const status =
    loading || !attempted ? t('auth.biometricProcessing') : t('auth.biometricRetry');

  return (
    <BiometricUnlockScreen
      title={t('settings.biometricLockTitle')}
      subtitle={t('settings.biometricLockSubtitle')}
      status={status}
      email={email}
      busy={loading}
      error={error}
      promptLabel={t('auth.biometricEnter')}
      onPrompt={() => void handleUnlock()}
      footer={
        onUsePassword ? (
          <button
            type="button"
            onClick={onUsePassword}
            disabled={loading}
            className="text-xs text-[var(--sage)] hover:text-[var(--accent)] transition"
          >
            {t('settings.biometricUsePassword')}
          </button>
        ) : null
      }
    />
  );
}
