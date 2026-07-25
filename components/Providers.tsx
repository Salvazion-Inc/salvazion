'use client';

import type { ReactNode } from 'react';
import SolanaWalletProvider from '@/components/wallet/SolanaWalletProvider';
import TextScaleProvider from '@/components/TextScaleProvider';
import I18nProvider from '@/components/I18nProvider';

/**
 * Client-side providers tree (i18n, text scale, Solana wallets, etc.).
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <TextScaleProvider>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </TextScaleProvider>
    </I18nProvider>
  );
}
