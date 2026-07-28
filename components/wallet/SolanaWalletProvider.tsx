'use client';

import { useMemo, type ReactNode } from 'react';
import type { Adapter } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { useWrappedReownAdapter } from '@jup-ag/jup-mobile-adapter';
import { getSolanaRpcUrl } from '@/lib/solana/config';
import { getAppBaseUrl } from '@/lib/config/site';

import '@solana/wallet-adapter-react-ui/styles.css';

const REOWN_PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() || '';

function isValidAdapter(adapter: Adapter | null | undefined): adapter is Adapter {
  return Boolean(adapter && adapter.name && adapter.icon);
}

function useLegacyWallets() {
  return useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()] as Adapter[],
    []
  );
}

/**
 * Phantom, Solflare + Jupiter Mobile (QR / WalletConnect via Reown).
 * Wallet Standard also surfaces installed extensions (e.g. Jupiter Wallet).
 */
function SolanaWalletProviderWithJupiter({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => getSolanaRpcUrl(), []);
  const appUrl = useMemo(() => getAppBaseUrl(), []);
  const legacy = useLegacyWallets();

  const { reownAdapter, jupiterAdapter } = useWrappedReownAdapter({
    appKitOptions: {
      metadata: {
        name: 'Salvazion',
        description: 'Salvation · Health · Freedom — $SALVAZION on Solana',
        url: appUrl,
        icons: [`${appUrl}/icon-192.png`, `${appUrl}/logo-icon.png`],
      },
      projectId: REOWN_PROJECT_ID,
      features: {
        analytics: false,
        socials: false,
        email: false,
      },
      // Only expose Jupiter Mobile branding; keep Phantom/Solflare as native adapters
      enableWallets: false,
    },
  });

  const wallets = useMemo(() => {
    const jupiterOnes = [jupiterAdapter, reownAdapter].filter(isValidAdapter);
    return [...jupiterOnes, ...legacy];
  }, [jupiterAdapter, reownAdapter, legacy]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/** Fallback when Reown project ID is not configured (Jupiter Mobile QR disabled). */
function SolanaWalletProviderBasic({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => getSolanaRpcUrl(), []);
  const wallets = useLegacyWallets();

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/**
 * Wraps the app with Solana connection + wallet adapters.
 * - Phantom & Solflare (browser extensions / in-app)
 * - Jupiter Mobile (QR via WalletConnect) when NEXT_PUBLIC_REOWN_PROJECT_ID is set
 * - Other Wallet Standard wallets (e.g. Jupiter extension) auto-detected when installed
 */
export default function SolanaWalletProvider({ children }: { children: ReactNode }) {
  if (REOWN_PROJECT_ID) {
    return (
      <SolanaWalletProviderWithJupiter>{children}</SolanaWalletProviderWithJupiter>
    );
  }
  return <SolanaWalletProviderBasic>{children}</SolanaWalletProviderBasic>;
}
