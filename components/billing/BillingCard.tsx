'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  openBillingPortal,
  startCheckout,
  useEntitlement,
} from '@/lib/billing/client';
import { PLAN_COPY } from '@/lib/billing/plans';
import { useI18n } from '@/components/I18nProvider';

export default function BillingCard({ className = '' }: { className?: string }) {
  const { t, lang } = useI18n();
  const { entitlement, isPremium, loading, refresh } = useEntitlement();
  const [busy, setBusy] = useState<'month' | 'year' | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>, key: typeof busy) => {
    setError(null);
    setBusy(key);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('premium.error'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`glass rounded-2xl p-5 space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--sage)]">
            {t('premium.billing')}
          </p>
          <h3 className="text-lg font-semibold text-[#8FD99A] mt-0.5">
            {isPremium ? t('premium.activeTitle') : t('premium.freeTitle')}
          </h3>
          <p className="text-xs text-[var(--sage)]/80 mt-1">
            {isPremium ? t('premium.activeBody') : t('premium.freeBody')}
          </p>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${
            isPremium
              ? 'border-[#8FD99A]/50 text-[#8FD99A] bg-[#8FD99A]/10'
              : 'border-[var(--border-soft)] text-[var(--sage)]'
          }`}
        >
          {loading ? '…' : isPremium ? 'Premium' : 'Free'}
        </span>
      </div>

      {isPremium && (
        <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/40 px-3 py-2.5 text-xs text-[var(--sage)] space-y-1">
          <p>
            {t('premium.status')}:{' '}
            <span className="text-[#D8E1D9]">{entitlement.status}</span>
          </p>
          {entitlement.interval && (
            <p>
              {t('premium.plan')}:{' '}
              <span className="text-[#D8E1D9]">
                {entitlement.interval === 'year'
                  ? lang === 'es'
                    ? PLAN_COPY.premium_year.priceLabelEs
                    : PLAN_COPY.premium_year.priceLabel
                  : lang === 'es'
                    ? PLAN_COPY.premium_month.priceLabelEs
                    : PLAN_COPY.premium_month.priceLabel}
              </span>
            </p>
          )}
          {entitlement.currentPeriodEnd && (
            <p>
              {entitlement.cancelAtPeriodEnd
                ? t('premium.ends')
                : t('premium.renews')}
              :{' '}
              <span className="text-[#D8E1D9]">
                {new Date(entitlement.currentPeriodEnd).toLocaleDateString(
                  lang === 'es' ? 'es' : 'en'
                )}
              </span>
            </p>
          )}
        </div>
      )}

      {!isPremium ? (
        <div className="grid sm:grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void run(() => startCheckout('month'), 'month')}
            className="btn-primary text-sm py-2.5"
          >
            {busy === 'month'
              ? t('premium.redirecting')
              : t('premium.ctaMonthly')}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void run(() => startCheckout('year'), 'year')}
            className="py-2.5 rounded-xl border border-[#8FD99A]/40 text-[#8FD99A] text-sm font-semibold hover:bg-[#8FD99A]/10 transition disabled:opacity-50"
          >
            {busy === 'year' ? t('premium.redirecting') : t('premium.ctaAnnual')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void run(() => openBillingPortal(), 'portal')}
          className="w-full py-2.5 rounded-xl border border-[var(--border-strong)] text-sm text-[#D8E1D9] hover:bg-[var(--surface-active)] transition disabled:opacity-50"
        >
          {busy === 'portal' ? t('premium.redirecting') : t('premium.manage')}
        </button>
      )}

      <Link
        href="/hub/premium"
        className="block text-center text-xs text-[#8FD99A] hover:underline"
      >
        {t('premium.seePlans')} →
      </Link>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
