'use client';

import { useMemo, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { getSolanaRpcUrl } from '@/lib/solana/config';

import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * Wraps the app with Solana connection + wallet adapters.
 * Phantom & Solflare are registered; Wallet Standard also picks up other installed wallets.
 */
export default function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => getSolanaRpcUrl(), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
