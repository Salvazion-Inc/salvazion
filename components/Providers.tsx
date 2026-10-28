'use client';

import { useEffect, type ReactNode } from 'react';
import TextScaleProvider from '@/components/TextScaleProvider';
import ThemeProvider from '@/components/ThemeProvider';
import I18nProvider from '@/components/I18nProvider';
import { registerCapacitorShell } from '@/lib/native/register-capacitor';

/**
 * Client-side providers tree (i18n, theme, text scale, native shell; Solana wallets are scoped via WalletScope).
 */
export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void registerCapacitorShell();
  }, []);

  return (
    <I18nProvider>
      <ThemeProvider>
        <TextScaleProvider>
          {children}
        </TextScaleProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
