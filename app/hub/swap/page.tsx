'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import JupiterSwap from '@/components/wallet/JupiterSwap';
import { loadProfileAsync } from '@/lib/store/profile';
import { SALVAZION_MINT, shortenAddress } from '@/lib/solana/config';
import { useI18n } from '@/components/I18nProvider';

export default function SwapPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const p = await loadProfileAsync();
      if (!p?.onboardingCompleted) {
        router.replace('/hub/onboarding');
      }
    })();
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#8FD99A] text-lg animate-pulse">{t('common.lionPreparing')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="page-header flex items-center justify-between px-5 pt-6 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/hub/freedom" className="back-btn" aria-label={t('common.back')}>
            ←
          </Link>
          <div className="w-10 h-10 rounded-full border border-[var(--border-soft)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404] shrink-0">
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
              {t('nav.freedom')}
            </p>
            <p className="text-sm font-medium truncate">{t('swap.title')}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-28 max-w-lg mx-auto w-full space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#8FD99A] tracking-tight">$SALVAZION</h1>
          <p className="text-sm text-[var(--sage)] mt-1">{t('swap.subtitle')}</p>
          <p className="text-[11px] font-mono text-[var(--sage)]/70 mt-2 break-all">
            {t('swap.mint')}: {shortenAddress(SALVAZION_MINT, 6)}
          </p>
        </div>

        <WalletConnectCard />

        <div className="glass rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs uppercase tracking-wider text-[var(--sage)]">
              {t('swap.terminal')}
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-strong)] text-[#8FD99A]">
              {t('swap.mainnet')}
            </span>
          </div>
          <JupiterSwap mode="integrated" />
        </div>

        <p className="text-[11px] text-[var(--sage)]/70 text-center leading-relaxed px-2">
          {t('swap.disclaimer')}
        </p>
      </main>

      <BottomNav variant="freedom" />
    </div>
  );
}
