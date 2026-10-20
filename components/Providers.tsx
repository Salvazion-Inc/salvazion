'use client';

import { useEffect, type ReactNode } from 'react';
import SolanaWalletProvider from '@/components/wallet/SolanaWalletProvider';
import TextScaleProvider from '@/components/TextScaleProvider';
import ThemeProvider from '@/components/ThemeProvider';
import I18nProvider from '@/components/I18nProvider';
import { AiUsageProvider } from '@/lib/billing/ai-usage-client';
import { EntitlementProvider } from '@/lib/billing/client';
import type { Language } from '@/lib/types';
import { registerCapacitorShell } from '@/lib/native/register-capacitor';

/**
 * Client-side providers tree (i18n, theme, text scale, Solana wallets, native shell).
 */
export default function Providers({
  children,
  initialLang = 'en',
}: {
  children: ReactNode;
  initialLang?: Language;
}) {
  useEffect(() => {
    void registerCapacitorShell();
  }, []);

  return (
    <I18nProvider initialLang={initialLang}>
      <EntitlementProvider>
        <AiUsageProvider>
          <ThemeProvider>
            <TextScaleProvider>
              <SolanaWalletProvider>{children}</SolanaWalletProvider>
            </TextScaleProvider>
          </ThemeProvider>
        </AiUsageProvider>
      </EntitlementProvider>
    </I18nProvider>
  );
}
