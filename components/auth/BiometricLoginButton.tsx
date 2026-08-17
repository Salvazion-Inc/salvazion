'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/components/I18nProvider';
import { mapAuthError } from '@/lib/auth/paths';
import {
  BiometricCancelledError,
  getBiometricState,
  isBiometricEnabled,
  persistBiometricVault,
  subscribeBiometricChanged,
  unlockWithBiometric,
} from '@/lib/auth/biometric';
import FingerprintMark from '@/components/auth/FingerprintMark';
import { ensureProfileForUser, loadProfileAsync } from '@/lib/store/profile';

interface Props {
  next?: string;
  onError?: (msg: string) => void;
}

/**
 * Primary "enter with thumb" action on the login screen.
 * Only renders when this device already enrolled biometric unlock.
 */
export default function BiometricLoginButton({
  next = '/hub/dashboard',
  onError,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => {
      const on = isBiometricEnabled();
      setEnabled(on);
      setEmail(getBiometricState()?.email || null);
      setReady(true);
    };
    sync();
    return subscribeBiometricChanged(sync);
  }, []);

  if (!ready || !enabled) return null;

  async function handleClick() {
    setLoading(true);
    try {
      const vault = await unlockWithBiometric(t('auth.biometricEnterHint'));
      const supabase = createClient();
      const { data, error } = await supabase.auth.setSession({
        access_token: vault.access_token,
        refresh_token: vault.refresh_token,
      });
      if (error || !data.session) {
        onError?.(t('auth.biometricExpired'));
        setLoading(false);
        return;
      }
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
        if (!profile?.onboardingCompleted) dest = '/hub/onboarding';
      } catch {
        /* keep next */
      }
      router.push(dest);
      router.refresh();
    } catch (err) {
      if (err instanceof BiometricCancelledError) {
        setLoading(false);
        return;
      }
      onError?.(
        err instanceof Error ? mapAuthError(err.message) : t('auth.biometricFailed')
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl border border-[var(--accent)] bg-[var(--surface-active)] text-[var(--accent)] text-sm font-semibold hover:shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_22%,transparent)] transition disabled:opacity-50"
        aria-label={t('auth.biometricEnter')}
      >
        <FingerprintMark size={24} />
        <span>{loading ? t('auth.biometricProcessing') : t('auth.biometricEnter')}</span>
      </button>
      {email ? (
        <p className="text-[11px] text-center text-[var(--sage)] leading-relaxed">
          {email}
        </p>
      ) : null}
    </div>
  );
}
