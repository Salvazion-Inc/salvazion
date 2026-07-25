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

export default function SwapPage() {
  const router = useRouter();
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
        <div className="text-[#00F511] text-lg animate-pulse">El León se prepara...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border border-[#00F511]/50 flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
            <Image
              src="/logo-icon.png"
              alt="Salvazion"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs text-[#B7F7AC]/60">Salvazion · Solana</p>
            <p className="text-sm font-medium">Swap Jupiter</p>
          </div>
        </div>
        <Link href="/hub/dashboard" className="text-sm text-[#00F511]">
          ← Dashboard
        </Link>
      </header>

      <main className="flex-1 px-5 pt-4 pb-28 max-w-lg mx-auto w-full space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#00F511] tracking-tight">$SALVAZION</h1>
          <p className="text-sm text-[#B7F7AC]/70 mt-1">
            Compra y vende con el mejor enrutamiento de Jupiter en Solana
          </p>
          <p className="text-[11px] font-mono text-[#B7F7AC]/40 mt-2 break-all">
            Mint: {shortenAddress(SALVAZION_MINT, 6)}
          </p>
        </div>

        <WalletConnectCard />

        <div className="glass rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs uppercase tracking-wider text-[#B7F7AC]/60">
              Jupiter Terminal
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#00F511]/30 text-[#00F511]">
              Mainnet
            </span>
          </div>
          <JupiterSwap mode="integrated" />
        </div>

        <p className="text-[11px] text-[#B7F7AC]/40 text-center leading-relaxed px-2">
          Los swaps se firman en tu billetera. Salvazion no custodia fondos. Usa un RPC propio
          en producción para mejor fiabilidad.
        </p>
      </main>

      <BottomNav variant="freedom" />
    </div>
  );
}
