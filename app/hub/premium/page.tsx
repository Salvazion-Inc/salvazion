'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { loadProfileAsync } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';
import {
  openBillingPortal,
  startCheckout,
  useEntitlement,
} from '@/lib/billing/client';
import { PLAN_COPY, PREMIUM_FEATURE_LIST } from '@/lib/billing/plans';

export default function PremiumPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { isPremium, loading, refresh } = useEntitlement();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState<'month' | 'year' | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const p = await loadProfileAsync();
      if (!p?.onboardingCompleted) {
        router.replace('/hub/onboarding');
        return;
      }
      await refresh();
    })();
  }, [router, refresh]);

  const go = async (fn: () => Promise<void>, key: typeof busy) => {
    setError(null);
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('premium.error'));
      setBusy(null);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--true-black)] flex items-center justify-center">
        <div className="text-[var(--accent)] text-lg animate-pulse" aria-live="polite">
          {t('common.lionPreparing')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--true-black)] text-[var(--off-white)] flex flex-col">
      <header className="page-header flex items-center justify-between px-5 pt-6 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/hub/profile" className="back-btn" aria-label={t('common.back')}>
            ←
          </Link>
          <div className="w-10 h-10 rounded-full border border-[var(--border-soft)] flex items-center justify-center lion-glow overflow-hidden bg-[var(--true-black)] shrink-0">
            <Image
              src="/logo-icon.png"
              alt="Salvazion"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium">
              Freemium
            </p>
            <p className="text-sm font-medium truncate">{t('premium.pageTitle')}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-28 max-w-lg mx-auto w-full space-y-5">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-[var(--accent)] tracking-tight">
            Salvazion Premium
          </h1>
          <p className="text-sm text-[var(--sage)] mt-2 leading-relaxed">
            {t('premium.pageSubtitle')}
          </p>
          {!loading && (
            <p className="mt-3 text-xs">
              <span
                className={`px-2.5 py-1 rounded-full border ${
                  isPremium
                    ? 'border-[var(--border-strong)] text-[var(--accent)]'
                    : 'border-[var(--border-soft)] text-[var(--sage)]'
                }`}
              >
                {isPremium ? t('premium.youArePremium') : t('premium.youAreFree')}
              </span>
            </p>
          )}
        </div>

        {/* Plans */}
        <div className="grid gap-3">
          <div className="glass rounded-2xl p-5 border border-[var(--border-soft)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">
              {lang === 'es' ? PLAN_COPY.free.nameEs : PLAN_COPY.free.name}
            </p>
            <p className="text-2xl font-bold text-white mt-1">$0</p>
            <ul className="mt-3 space-y-1.5 text-xs text-[var(--sage)]">
              <li>· {t('premium.free1')}</li>
              <li>· {t('premium.free2')}</li>
              <li>· {t('premium.free3')}</li>
              <li>· {t('premium.free4')}</li>
            </ul>
          </div>

          <div className="glass rounded-2xl p-5 border border-[#8FD99A]/40 bg-[#8FD99A]/5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wider text-[#8FD99A]">
                Premium
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8FD99A]/20 text-[#8FD99A]">
                {t('premium.bestValue')}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-lg font-semibold text-white">
                {lang === 'es'
                  ? PLAN_COPY.premium_month.priceLabelEs
                  : PLAN_COPY.premium_month.priceLabel}
              </p>
              <p className="text-sm text-[#8FD99A]">
                {lang === 'es'
                  ? PLAN_COPY.premium_year.priceLabelEs
                  : PLAN_COPY.premium_year.priceLabel}
              </p>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-[#D8E1D9]">
              {PREMIUM_FEATURE_LIST.map((f) => (
                <li key={f.id} className="flex gap-2">
                  <span className="text-[#8FD99A]">✓</span>
                  <span>{lang === 'es' ? f.es : f.en}</span>
                </li>
              ))}
            </ul>

            {!isPremium ? (
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void go(() => startCheckout('month'), 'month')}
                  className="btn-primary text-sm py-3"
                >
                  {busy === 'month'
                    ? t('premium.redirecting')
                    : t('premium.ctaMonthly')}
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void go(() => startCheckout('year'), 'year')}
                  className="py-3 rounded-xl border border-[#8FD99A]/45 text-[#8FD99A] text-sm font-semibold hover:bg-[#8FD99A]/10 transition disabled:opacity-50"
                >
                  {busy === 'year'
                    ? t('premium.redirecting')
                    : t('premium.ctaAnnual')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => void go(() => openBillingPortal(), 'portal')}
                className="mt-5 w-full py-3 rounded-xl border border-[var(--border-strong)] text-sm hover:bg-[var(--surface-active)] transition disabled:opacity-50"
              >
                {busy === 'portal' ? t('premium.redirecting') : t('premium.manage')}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <p className="text-[11px] text-[var(--sage)]/70 text-center leading-relaxed px-2">
          {t('premium.stripeNote')}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
