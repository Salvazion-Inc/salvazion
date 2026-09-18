'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import BrandLoader from '@/components/ui/BrandLoader';
import { useI18n } from '@/components/I18nProvider';
import { useEntitlement } from '@/lib/billing/client';
import { PREMIUM_FEATURE_LIST } from '@/lib/billing/plans';
import { pickLang } from '@/lib/i18n/locale';
import { textWithXLogo } from '@/components/ui/XLogo';
import { clearPendingCheckout } from '@/lib/billing/checkout-intent';

const POLL_MS = 2000;
const POLL_FOR_MS = 45000;

export default function PremiumSuccessPage() {
  const { t, lang } = useI18n();
  const { isPremium, loading, refresh } = useEntitlement();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    clearPendingCheckout();
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('session_id')) {
        params.delete('session_id');
        const qs = params.toString();
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${qs ? `?${qs}` : ''}`
        );
      }
    } catch {
      // ignore
    }
    void refresh();
    const started = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - started > POLL_FOR_MS) {
        window.clearInterval(id);
        return;
      }
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (!mounted) {
    return <BrandLoader fullscreen />;
  }

  return (
    <div className="min-h-screen bg-[var(--true-black)] text-[var(--off-white)] flex flex-col">
      <header className="page-header flex items-center justify-between px-5 pt-6 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/hub/dashboard" className="back-btn" aria-label={t('common.back')}>
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
              Premium
            </p>
            <p className="text-sm font-medium truncate">{t('premium.successTitle')}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-28 max-w-lg mx-auto w-full space-y-5">
        <div className="text-center max-w-md mx-auto">
          <p className="section-eyebrow mb-2">Premium</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance leading-tight">
            {t('premium.successTitle')}
          </h1>
          <p className="text-sm text-[var(--sage)] mt-2.5 leading-relaxed text-pretty">
            {isPremium
              ? t('premium.successBody')
              : loading
                ? t('premium.checking')
                : t('premium.successPending')}
          </p>
        </div>

        <div className="card-soft p-6 border-[#8FD99A]/35 bg-gradient-to-b from-[#8FD99A]/10 to-transparent">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8FD99A] mb-3">
            {t('premium.successUnlocked')}
          </p>
          <ul className="pricing-points text-sm text-[#D8E1D9]/90">
            {PREMIUM_FEATURE_LIST.slice(0, 6).map((item) => (
              <li key={item.id}>
                <span className="text-[var(--accent)] shrink-0 w-4 text-center">·</span>
                <span className="leading-snug">{textWithXLogo(pickLang(lang, item))}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/hub/dashboard"
          className="btn-primary font-display font-bold w-full min-h-[3rem] inline-flex items-center justify-center"
        >
          {t('premium.goToApp')}
        </Link>

        <p className="text-[11px] text-[var(--sage)]/80 text-center leading-relaxed">
          {t('premium.trustLine')}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
