'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  SALVAZION_MINT,
  shortenAddress,
} from '@/lib/solana/config';
import {
  clearLinkedWallet,
  loadLinkedWallet,
  saveLinkedWallet,
} from '@/lib/solana/wallet-store';
import JupiterSwap from '@/components/wallet/JupiterSwap';
import { useI18n } from '@/components/I18nProvider';

type Variant = 'card' | 'compact';

interface WalletConnectCardProps {
  variant?: Variant;
  className?: string;
  /** Show in-app Jupiter modal trigger (default true for full card) */
  showJupiter?: boolean;
}

export default function WalletConnectCard({
  variant = 'card',
  className = '',
  showJupiter = true,
}: WalletConnectCardProps) {
  const { t } = useI18n();
  const { connection } = useConnection();
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Persist linked address when connected
  useEffect(() => {
    if (connected && publicKey) {
      saveLinkedWallet(publicKey.toBase58(), wallet?.adapter.name);
    }
  }, [connected, publicKey, wallet?.adapter.name]);

  const refreshBalances = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(null);
      setTokenBalance(null);
      return;
    }
    setBalanceError(null);
    try {
      const lamports = await connection.getBalance(publicKey, 'confirmed');
      setSolBalance(lamports / LAMPORTS_PER_SOL);

      try {
        const mint = new PublicKey(SALVAZION_MINT);
        const parsed = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint,
        });
        let total = 0;
        for (const acc of parsed.value) {
          const info = acc.account.data.parsed?.info;
          const amount = info?.tokenAmount?.uiAmount;
          if (typeof amount === 'number') total += amount;
        }
        setTokenBalance(total);
      } catch {
        setTokenBalance(null);
      }
    } catch {
      setBalanceError('No se pudo leer el saldo (RPC).');
      setSolBalance(null);
      setTokenBalance(null);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    refreshBalances();
    if (!publicKey) return;
    const id = setInterval(refreshBalances, 30_000);
    return () => clearInterval(id);
  }, [publicKey, refreshBalances]);

  const handleCopy = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } finally {
      clearLinkedWallet();
      setSolBalance(null);
      setTokenBalance(null);
    }
  };

  const address = publicKey?.toBase58() ?? loadLinkedWallet()?.address ?? null;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {connected && publicKey ? (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-full border border-[var(--border-strong)] text-xs font-mono text-[#8FD99A] hover:bg-[var(--surface-active)] transition"
              title={publicKey.toBase58()}
            >
              {copied ? t('wallet.copied') : shortenAddress(publicKey.toBase58())}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-[11px] text-[var(--sage)]/80 hover:text-red-400 transition"
            >
              {t('wallet.disconnect')}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={connecting}
            onClick={() => setVisible(true)}
            className="px-3 py-1.5 rounded-full bg-[#7BC98A] text-[#040404] text-xs font-semibold hover:bg-[#B7F7AC] transition disabled:opacity-50"
          >
            {connecting ? t('wallet.connecting') : t('wallet.connectShort')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`glass rounded-2xl p-5 space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--sage)]">Solana</p>
          <h3 className="text-lg font-semibold text-[#8FD99A] mt-0.5">{t('wallet.title')}</h3>
          <p className="text-xs text-[var(--sage)]/80 mt-1">{t('wallet.subtitle')}</p>
        </div>
        <div className="w-10 h-10 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-lg">
          ◎
        </div>
      </div>

      {!connected || !publicKey ? (
        <div className="space-y-3">
          {address && !connected && (
            <p className="text-xs text-[var(--sage)]/80 font-mono">
              {t('wallet.lastLinked')}: {shortenAddress(address)}
            </p>
          )}
          <button
            type="button"
            disabled={connecting}
            onClick={() => setVisible(true)}
            className="btn-primary"
          >
            {connecting ? t('wallet.connecting') : t('wallet.connect')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 bg-[#040404]/60 border border-[var(--border-soft)] rounded-xl px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] text-[var(--sage)]/80 uppercase">
                {wallet?.adapter.name || 'Wallet'}
              </p>
              <p className="text-sm font-mono text-[#D8E1D9] truncate" title={publicKey.toBase58()}>
                {shortenAddress(publicKey.toBase58(), 6)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 text-xs text-[#8FD99A] hover:underline px-2"
            >
              {copied ? '✓' : t('wallet.copy')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/40 px-3 py-2.5">
              <p className="text-[10px] text-[var(--sage)]/80 uppercase">SOL</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {solBalance === null ? '—' : solBalance.toFixed(4)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/40 px-3 py-2.5">
              <p className="text-[10px] text-[var(--sage)]/80 uppercase">$SALVAZION</p>
              <p className="text-sm font-semibold text-[#8FD99A] mt-0.5">
                {tokenBalance === null
                  ? '—'
                  : tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {balanceError && (
            <p className="text-xs text-amber-400">{balanceError}</p>
          )}

          {showJupiter && (
            <div className="space-y-2">
              <JupiterSwap
                mode="modal"
                triggerLabel={t('wallet.swapSalvazion')}
                showFallbackLink={false}
              />
              <Link
                href="/hub/swap"
                className="block text-center text-xs text-[#8FD99A] hover:underline"
              >
                {t('wallet.openTerminal')}
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={handleDisconnect}
            className="w-full py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 transition"
          >
            {t('wallet.disconnect')}
          </button>
        </div>
      )}
    </div>
  );
}
