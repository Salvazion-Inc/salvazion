'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import BrandLoader from '@/components/ui/BrandLoader';
import { loadProfileAsync } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';
import { textWithXLogo } from '@/components/ui/XLogo';
import {
  openBillingPortal,
  startCheckout,
  useEntitlement,
} from '@/lib/billing/client';
import {
  PLAN_COPY,
  PREMIUM_FEATURE_LIST,
  PRICING_TABLE,
} from '@/lib/billing/plans';
import { pickLang } from '@/lib/i18n/locale';

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
    return <BrandLoader fullscreen />;
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
              {t('premium.pageEyebrow')}
            </p>
            <p className="text-sm font-medium truncate">{t('premium.pageTitle')}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-28 max-w-lg mx-auto w-full space-y-5">
        <div className="text-center max-w-md mx-auto">
          <p className="section-eyebrow mb-2">{t('premium.pageEyebrow')}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance leading-tight">
            {t('premium.pageHeadline')}
          </h1>
          <p className="text-sm text-[var(--sage)] mt-2.5 leading-relaxed text-pretty">
            {t('premium.pageSubtitle')}
          </p>
          {!loading && (
            <p className="mt-3 text-xs">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full border font-medium ${
                  isPremium
                    ? 'border-[var(--border-strong)] text-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border-soft)] text-[var(--sage)]'
                }`}
              >
                {isPremium ? t('premium.youArePremium') : t('premium.youAreFree')}
              </span>
            </p>
          )}
        </div>

        {/* Plans — same layout scale as landing #pricing */}
        <div className="grid gap-4 items-stretch">
          {/* Free */}
          <div
            className={`card-soft p-6 sm:p-7 flex flex-col h-full ${
              !isPremium ? 'border-[var(--border-strong)]' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 min-h-[1.75rem]">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--sage)]">
                {pickLang(lang, {
                  es: PLAN_COPY.free.nameEs,
                  en: PLAN_COPY.free.name,
                  pt: PLAN_COPY.free.namePt,
                })}
              </p>
              {!isPremium ? (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold border border-[var(--border-soft)] text-[var(--sage)]">
                  {t('premium.currentPlan')}
                </span>
              ) : (
                <span className="invisible text-[10px] px-2.5 py-1 rounded-full font-semibold">
                  {pickLang(lang, PRICING_TABLE.bestValue)}
                </span>
              )}
            </div>

            <p className="mt-3 text-4xl font-bold text-white tracking-tight tabular-nums leading-none">
              $0
            </p>
            <p className="mt-2 text-sm text-[var(--sage)] leading-snug">
              {t('premium.perMonthFree')}
            </p>
            <p
              className="mt-1 text-sm leading-snug min-h-[1.25rem] text-transparent select-none"
              aria-hidden
            >
              —
            </p>

            <p className="mt-3 text-xs text-[var(--sage)] leading-relaxed min-h-[2.5rem]">
              {pickLang(lang, PRICING_TABLE.freeNote)}
            </p>

            <ul className="mt-5 space-y-2 text-sm text-[#D8E1D9]/90 flex-1">
              {PRICING_TABLE.freeItems.map((item) => {
                const label = pickLang(lang, item);
                return (
                  <li key={item.en} className="flex gap-2">
                    <span className="text-[var(--accent)] shrink-0 w-4 text-center">
                      ·
                    </span>
                    <span>{textWithXLogo(label)}</span>
                  </li>
                );
              })}
            </ul>

            {!isPremium ? (
              <Link
                href="/hub/dashboard"
                className="btn-secondary font-display font-bold mt-6 w-full min-h-[3rem] !whitespace-normal text-center text-balance leading-snug"
              >
                {t('premium.continueFree')}
              </Link>
            ) : (
              <div className="mt-6 min-h-[3rem]" aria-hidden />
            )}
          </div>

          {/* Premium */}
          <div className="card-soft p-6 sm:p-7 flex flex-col h-full border-[#8FD99A]/35 bg-gradient-to-b from-[#8FD99A]/10 to-transparent shadow-[var(--shadow-glow)]">
            <div className="flex items-center justify-between gap-2 min-h-[1.75rem]">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8FD99A]">
                Premium
              </p>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#8FD99A]/18 text-[#8FD99A] font-semibold border border-[#8FD99A]/25">
                {pickLang(lang, PRICING_TABLE.bestValue)}
              </span>
            </div>

            <p className="mt-3 text-4xl font-bold text-white tracking-tight tabular-nums leading-none">
              ${PLAN_COPY.premium_month.priceUsd}
            </p>
            <p className="mt-2 text-sm text-[var(--sage)] leading-snug">
              {t('premium.perMonth')}
            </p>
            <p className="mt-1 text-sm text-[#8FD99A] leading-snug min-h-[1.25rem]">
              {pickLang(lang, {
                es: PLAN_COPY.premium_year.priceLabelEs,
                en: PLAN_COPY.premium_year.priceLabel,
                pt: PLAN_COPY.premium_year.priceLabelPt,
              })}
            </p>

            <p className="mt-3 text-xs text-[var(--sage)] leading-relaxed min-h-[2.5rem]">
              {pickLang(lang, PRICING_TABLE.premiumNote)}
            </p>

            <ul className="mt-5 space-y-2 text-sm text-[#D8E1D9]/90 flex-1">
              {PREMIUM_FEATURE_LIST.map((item) => {
                const label = pickLang(lang, item);
                return (
                  <li key={item.id} className="flex gap-2">
                    <span className="text-[var(--accent)] shrink-0 w-4 text-center">
                      ·
                    </span>
                    <span>{textWithXLogo(label)}</span>
                  </li>
                );
              })}
            </ul>

            {!isPremium ? (
              <div className="mt-6 grid gap-2">
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void go(() => startCheckout('month'), 'month')}
                  className="btn-primary font-display font-bold w-full min-h-[3rem] text-sm !whitespace-normal text-center text-balance leading-snug disabled:opacity-50"
                >
                  {busy === 'month'
                    ? t('premium.redirecting')
                    : t('premium.ctaMonthly')}
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void go(() => startCheckout('year'), 'year')}
                  className="btn-secondary font-display font-bold w-full min-h-[3rem] text-sm !whitespace-normal text-center text-balance leading-snug border-[#8FD99A]/45 text-[#8FD99A] disabled:opacity-50"
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
                className="btn-primary font-display font-bold mt-6 w-full min-h-[3rem] text-sm disabled:opacity-50"
              >
                {busy === 'portal' ? t('premium.redirecting') : t('premium.manage')}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <p className="text-[11px] text-[var(--sage)]/80 text-center leading-relaxed max-w-md mx-auto px-1">
          {pickLang(lang, PRICING_TABLE.stripeNote)}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
