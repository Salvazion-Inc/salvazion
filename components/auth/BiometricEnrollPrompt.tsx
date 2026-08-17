'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/components/I18nProvider';
import { useFlashToast } from '@/components/ui/FlashToast';
import {
  BiometricCancelledError,
  dismissBiometricPrompt,
  enrollBiometric,
  getBiometricCapability,
  isBiometricEnabled,
  isBiometricPromptDismissed,
  subscribeBiometricChanged,
} from '@/lib/auth/biometric';
import FingerprintMark from '@/components/auth/FingerprintMark';

/**
 * One-time sheet after the first Hub visit: offer thumb unlock.
 */
export default function BiometricEnrollPrompt() {
  const { t } = useI18n();
  const { flash, toast } = useFlashToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const maybeShow = async () => {
      if (isBiometricEnabled() || isBiometricPromptDismissed()) {
        setOpen(false);
        return;
      }
      const cap = await getBiometricCapability();
      if (cancelled || !cap.available) return;
      setOpen(true);
    };

    void maybeShow();
    const unsub = subscribeBiometricChanged(() => {
      if (isBiometricEnabled()) setOpen(false);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  if (!open) return toast;

  async function handleEnable() {
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const email = session?.user.email;
      const userId = session?.user.id;
      if (!session || !email || !userId) {
        setBusy(false);
        return;
      }
      await enrollBiometric({
        userId,
        email,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
        reason: t('settings.biometricPromptTitle'),
      });
      setOpen(false);
      flash(t('settings.biometricEnabled'));
    } catch (err) {
      if (!(err instanceof BiometricCancelledError)) {
        flash(t('auth.biometricFailed'));
      }
    } finally {
      setBusy(false);
    }
  }

  function handleLater() {
    dismissBiometricPrompt();
    setOpen(false);
  }

  return (
    <>
      {toast}
      <div
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/65 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="biometric-enroll-title"
      >
        <div className="w-full max-w-sm card-soft p-5 shadow-[var(--shadow-premium)]">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-11 h-11 rounded-full border border-[var(--accent)] bg-[var(--surface-active)] text-[var(--accent)] flex items-center justify-center">
              <FingerprintMark size={22} />
            </span>
            <div>
              <h2
                id="biometric-enroll-title"
                className="text-base font-semibold text-[var(--accent)]"
              >
                {t('settings.biometricPromptTitle')}
              </h2>
              <p className="text-xs text-[var(--sage)] mt-1 leading-relaxed">
                {t('settings.biometricPromptBody')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button
              type="button"
              className="btn-secondary text-sm py-2.5"
              disabled={busy}
              onClick={handleLater}
            >
              {t('settings.biometricPromptLater')}
            </button>
            <button
              type="button"
              className="btn-primary text-sm py-2.5"
              disabled={busy}
              onClick={() => void handleEnable()}
            >
              {busy ? t('auth.biometricProcessing') : t('settings.biometricPromptEnable')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
