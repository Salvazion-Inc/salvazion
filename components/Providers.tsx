'use client';

import type { ReactNode } from 'react';
import SolanaWalletProvider from '@/components/wallet/SolanaWalletProvider';

/**
 * Client-side providers tree (Solana wallets, future context, etc.).
 */
export default function Providers({ children }: { children: ReactNode }) {
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}
