'use client';

import { useState } from 'react';
import {
  openBillingPortal,
  startCheckout,
  useEntitlement,
} from '@/lib/billing/client';
import { useI18n } from '@/components/I18nProvider';
import type { BillingInterval } from '@/lib/billing/plans';

type Props = {
  /** Default monthly ($49). Yearly is always a secondary action when shown. */
  interval?: BillingInterval;
  showAnnual?: boolean;
  /** Fixed above the hub bottom nav — paywall screens. */
  sticky?: boolean;
  className?: string;
  compact?: boolean;
};

export default function UpgradeCta({
  interval = 'month',
  showAnnual = false,
  sticky = false,
  className = '',
  compact = false,
}: Props) {
  const { t } = useI18n();
  const { isPremium, canManage, loading } = useEntitlement();
  const [busy, setBusy] = useState<BillingInterval | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = async (fn: () => Promise<void>, key: typeof busy) => {
    if (busy) return;
    setError(null);
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('premium.error'));
      setBusy(null);
    }
  };

  const inner = isPremium ? (
    canManage ? (
      <button
        type="button"
        disabled={!!busy || loading}
        onClick={() => void go(() => openBillingPortal(), 'portal')}
        className="btn-primary font-display font-bold w-full min-h-[3rem] text-sm disabled:opacity-50"
      >
        {busy === 'portal' ? t('premium.redirecting') : t('premium.manage')}
      </button>
    ) : null
  ) : (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={!!busy || loading}
        onClick={() => void go(() => startCheckout(interval), interval)}
        className="btn-primary font-display font-bold w-full min-h-[3rem] text-sm !whitespace-normal text-center text-balance leading-snug disabled:opacity-50"
      >
        {busy === interval ? t('premium.redirecting') : t('premium.upgradeCta')}
      </button>
      {showAnnual && interval === 'month' ? (
        <button
          type="button"
          disabled={!!busy || loading}
          onClick={() => void go(() => startCheckout('year'), 'year')}
          className="btn-secondary font-display font-bold w-full min-h-[2.75rem] text-sm !whitespace-normal text-center text-balance leading-snug border-[#8FD99A]/45 text-[#8FD99A] disabled:opacity-50"
        >
          {busy === 'year' ? t('premium.redirecting') : t('premium.ctaAnnual')}
        </button>
      ) : null}
      <p className="text-[11px] text-[var(--sage)]/85 text-center leading-snug">
        {t('premium.trustLine')}
      </p>
    </div>
  );

  if (!inner) return null;

  const body = (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {inner}
      {error ? (
        <p className="text-xs text-red-400 text-center leading-snug">{error}</p>
      ) : null}
    </div>
  );

  if (!sticky) {
    return <div className={className}>{body}</div>;
  }

  return (
    <div
      className={`upgrade-sticky-bar ${className}`}
      role="region"
      aria-label={t('premium.upgradeCta')}
    >
      {body}
    </div>
  );
}
