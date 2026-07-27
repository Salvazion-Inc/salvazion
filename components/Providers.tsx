'use client';

import { useEffect, type ReactNode } from 'react';
import SolanaWalletProvider from '@/components/wallet/SolanaWalletProvider';
import TextScaleProvider from '@/components/TextScaleProvider';
import ThemeProvider from '@/components/ThemeProvider';
import I18nProvider from '@/components/I18nProvider';
import { registerCapacitorShell } from '@/lib/native/register-capacitor';

/**
 * Client-side providers tree (i18n, theme, text scale, Solana wallets, native shell).
 */
export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void registerCapacitorShell();
  }, []);

  return (
    <I18nProvider>
      <ThemeProvider>
        <TextScaleProvider>
          <SolanaWalletProvider>{children}</SolanaWalletProvider>
        </TextScaleProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
