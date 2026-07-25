'use client';

import type { ReactNode } from 'react';
import SolanaWalletProvider from '@/components/wallet/SolanaWalletProvider';
import TextScaleProvider from '@/components/TextScaleProvider';

/**
 * Client-side providers tree (text scale, Solana wallets, etc.).
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TextScaleProvider>
      <SolanaWalletProvider>{children}</SolanaWalletProvider>
    </TextScaleProvider>
  );
}
