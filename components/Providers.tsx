'use client';

import { useEffect, type ReactNode } from 'react';
import SolanaWalletProvider from '@/components/wallet/SolanaWalletProvider';
import TextScaleProvider from '@/components/TextScaleProvider';
import I18nProvider from '@/components/I18nProvider';
import { registerCapacitorShell } from '@/lib/native/register-capacitor';

/**
 * Client-side providers tree (i18n, text scale, Solana wallets, native shell).
 */
export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void registerCapacitorShell();
  }, []);

  return (
    <I18nProvider>
      <TextScaleProvider>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </TextScaleProvider>
    </I18nProvider>
  );
}
