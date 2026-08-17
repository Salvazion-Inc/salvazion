'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/components/I18nProvider';
import { useFlashToast } from '@/components/ui/FlashToast';
import {
  BiometricCancelledError,
  BiometricUnavailableError,
  disableBiometric,
  enrollBiometric,
  getBiometricCapability,
  isBiometricEnabled,
  subscribeBiometricChanged,
  type BiometricCapability,
} from '@/lib/auth/biometric';
import FingerprintMark from '@/components/auth/FingerprintMark';

/**
 * Settings toggle: enable / disable thumb unlock on this device.
 */
export default function BiometricControl() {
  const { t } = useI18n();
  const { flash, toast } = useFlashToast();
  const [cap, setCap] = useState<BiometricCapability | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(isBiometricEnabled());
    sync();
    const unsub = subscribeBiometricChanged(sync);
    void getBiometricCapability().then(setCap);
    return unsub;
  }, []);

  const available = cap?.available === true;

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
        flash(t('settings.biometricNeedLogin'));
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
        reason: t('settings.biometricTitle'),
      });
      setEnabled(true);
      flash(t('settings.biometricEnabled'));
    } catch (err) {
      if (err instanceof BiometricCancelledError) {
        /* user closed the system prompt */
      } else if (err instanceof BiometricUnavailableError) {
        flash(t('auth.biometricUnavailable'));
      } else {
        flash(t('auth.biometricFailed'));
      }
    } finally {
      setBusy(false);
    }
  }

  function handleDisable() {
    disableBiometric();
    setEnabled(false);
    flash(t('settings.biometricDisabled'));
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {toast}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--sage)]/60">
            {t('settings.security')}
          </p>
          <h3 className="text-base font-semibold text-[var(--accent)] mt-0.5">
            {t('settings.biometricTitle')}
          </h3>
          <p className="text-xs text-[var(--sage)]/70 mt-1 leading-relaxed">
            {t('settings.biometricHint')}
          </p>
        </div>
        <span className="shrink-0 w-11 h-11 rounded-full border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center">
          <FingerprintMark size={22} />
        </span>
      </div>

      {cap && !available ? (
        <p className="text-xs text-[var(--sage)] leading-relaxed">
          {t('auth.biometricUnavailable')}
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] px-4 py-3">
            <span className="text-sm text-[var(--off-white)]">
              {enabled ? t('settings.biometricOn') : t('settings.biometricOff')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={busy || cap === null}
              onClick={() => (enabled ? handleDisable() : void handleEnable())}
              className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-50 ${
                enabled ? 'bg-[var(--accent)]' : 'bg-[var(--sage)]/30'
              }`}
              aria-label={t('settings.biometricTitle')}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-[#040404] transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
            {enabled
              ? t('settings.biometricEnabled')
              : t('settings.biometricEnableHint')}
          </p>
        </>
      )}
    </div>
  );
}
