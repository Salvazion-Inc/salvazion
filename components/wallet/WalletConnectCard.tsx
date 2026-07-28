'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  SALVAZION_MINT,
  shortenAddress,
} from '@/lib/solana/config';
import {
  clearLinkedWallet,
  loadLinkedWallet,
  saveLinkedWallet,
  updateLinkedWalletBalances,
} from '@/lib/solana/wallet-store';
import { fetchWalletBalances, formatSalvazion } from '@/lib/solana/balances';
import JupiterSwap from '@/components/wallet/JupiterSwap';
import WalletSelectModal from '@/components/wallet/WalletSelectModal';
import { useI18n } from '@/components/I18nProvider';

type Variant = 'card' | 'compact';

interface WalletConnectCardProps {
  variant?: Variant;
  className?: string;
  /** Show in-app Jupiter modal trigger (default true for full card) */
  showJupiter?: boolean;
  /** Show editable $SALVAZION amount (profile use). Default true for card. */
  showSalvazionAmount?: boolean;
  /** Called when $SALVAZION amount changes (on-chain or manual). */
  onSalvazionChange?: (amount: number | null) => void;
}

function parseAmountInput(raw: string): number | null {
  const normalized = raw.replace(/\s/g, '').replace(',', '.');
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export default function WalletConnectCard({
  variant = 'card',
  className = '',
  showJupiter = true,
  showSalvazionAmount = true,
  onSalvazionChange,
}: WalletConnectCardProps) {
  const { t } = useI18n();
  const { connection } = useConnection();
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const [pickerOpen, setPickerOpen] = useState(false);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [tokenSource, setTokenSource] = useState<'onchain' | 'manual' | null>(null);
  const [amountDraft, setAmountDraft] = useState('');
  const [amountSaved, setAmountSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const openPicker = () => setPickerOpen(true);
  const closePicker = () => setPickerOpen(false);

  // Hydrate from local store (manual amount survives reloads)
  useEffect(() => {
    const linked = loadLinkedWallet();
    if (!linked) return;
    if (typeof linked.solBalance === 'number') setSolBalance(linked.solBalance);
    if (typeof linked.salvazionBalance === 'number') {
      setTokenBalance(linked.salvazionBalance);
      setTokenSource(linked.salvazionSource ?? 'manual');
      setAmountDraft(String(linked.salvazionBalance));
      onSalvazionChange?.(linked.salvazionBalance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  // Persist linked address when connected
  useEffect(() => {
    if (connected && publicKey) {
      saveLinkedWallet(publicKey.toBase58(), wallet?.adapter.name);
    }
  }, [connected, publicKey, wallet?.adapter.name]);

  const refreshBalances = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(null);
      // Keep manual amount if still linked in storage
      const linked = loadLinkedWallet();
      if (linked?.salvazionSource === 'manual' && typeof linked.salvazionBalance === 'number') {
        setTokenBalance(linked.salvazionBalance);
        setTokenSource('manual');
        setAmountDraft(String(linked.salvazionBalance));
      } else {
        setTokenBalance(null);
        setTokenSource(null);
      }
      return;
    }
    setBalanceError(null);
    setRefreshing(true);
    try {
      const { sol, salvazion, error } = await fetchWalletBalances(connection, publicKey);
      if (sol !== null) setSolBalance(sol);

      const linked = loadLinkedWallet();
      const manualLocked =
        linked?.salvazionSource === 'manual' &&
        typeof linked.salvazionBalance === 'number' &&
        linked.address === publicKey.toBase58();

      if (salvazion !== null && !manualLocked) {
        setTokenBalance(salvazion);
        setTokenSource('onchain');
        setAmountDraft(String(salvazion));
        updateLinkedWalletBalances({
          solBalance: sol,
          salvazionBalance: salvazion,
          salvazionSource: 'onchain',
        });
        onSalvazionChange?.(salvazion);
      } else if (manualLocked) {
        setTokenBalance(linked!.salvazionBalance!);
        setTokenSource('manual');
        setAmountDraft(String(linked!.salvazionBalance));
        updateLinkedWalletBalances({ solBalance: sol });
        onSalvazionChange?.(linked!.salvazionBalance!);
      } else if (salvazion !== null) {
        setTokenBalance(salvazion);
        setTokenSource('onchain');
        setAmountDraft(String(salvazion));
        updateLinkedWalletBalances({
          solBalance: sol,
          salvazionBalance: salvazion,
          salvazionSource: 'onchain',
        });
        onSalvazionChange?.(salvazion);
      } else {
        updateLinkedWalletBalances({ solBalance: sol });
      }

      if (error) setBalanceError(error);
    } catch {
      setBalanceError(t('wallet.balanceError'));
    } finally {
      setRefreshing(false);
    }
  }, [connection, publicKey, onSalvazionChange, t]);

  useEffect(() => {
    refreshBalances();
    if (!publicKey) return;
    const id = setInterval(refreshBalances, 30_000);
    return () => clearInterval(id);
  }, [publicKey, refreshBalances]);

  const handleSaveAmount = () => {
    const n = parseAmountInput(amountDraft);
    if (n === null) return;
    setTokenBalance(n);
    setTokenSource('manual');
    if (publicKey) {
      saveLinkedWallet(publicKey.toBase58(), wallet?.adapter.name, {
        solBalance,
        salvazionBalance: n,
        salvazionSource: 'manual',
        balanceUpdatedAt: new Date().toISOString(),
      });
    } else {
      updateLinkedWalletBalances({
        salvazionBalance: n,
        salvazionSource: 'manual',
      });
    }
    onSalvazionChange?.(n);
    setAmountSaved(true);
    setTimeout(() => setAmountSaved(false), 2000);
  };

  const handleUseOnchain = async () => {
    // Clear manual lock then refresh
    const linked = loadLinkedWallet();
    if (linked?.address) {
      saveLinkedWallet(linked.address, linked.label, {
        solBalance: linked.solBalance,
        salvazionBalance: null,
        salvazionSource: undefined,
        balanceUpdatedAt: new Date().toISOString(),
      });
    }
    setTokenSource(null);
    await refreshBalances();
  };

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
      setTokenSource(null);
      setAmountDraft('');
      onSalvazionChange?.(null);
    }
  };

  const address = publicKey?.toBase58() ?? loadLinkedWallet()?.address ?? null;

  const amountEditor =
    showSalvazionAmount && (connected || Boolean(address)) ? (
      <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/50 px-3 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">
              $SALVAZION
            </p>
            <p className="text-xs text-[var(--sage)]/80 mt-0.5">
              {t('wallet.amountHint')}
            </p>
          </div>
          {tokenSource && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-soft)] text-[#8FD99A]">
              {tokenSource === 'onchain' ? t('wallet.sourceOnchain') : t('wallet.sourceManual')}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={amountDraft}
            onChange={(e) => setAmountDraft(e.target.value)}
            placeholder="0"
            className="flex-1 min-w-0 rounded-xl border border-[var(--border-soft)] bg-[#0a0a0a] px-3 py-2.5 text-sm font-mono text-[#8FD99A] focus:outline-none focus:border-[#8FD99A]/50"
            aria-label={t('wallet.amountLabel')}
          />
          <button
            type="button"
            onClick={handleSaveAmount}
            disabled={parseAmountInput(amountDraft) === null}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#7BC98A] text-[#040404] text-sm font-semibold hover:bg-[#B7F7AC] transition disabled:opacity-40"
          >
            {amountSaved ? '✓' : t('wallet.saveAmount')}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => void refreshBalances()}
            disabled={refreshing || !publicKey}
            className="text-[#8FD99A] hover:underline disabled:opacity-40"
          >
            {refreshing ? t('wallet.refreshing') : t('wallet.refreshOnchain')}
          </button>
          {tokenSource === 'manual' && publicKey && (
            <button
              type="button"
              onClick={() => void handleUseOnchain()}
              className="text-[var(--sage)] hover:text-[#8FD99A] hover:underline"
            >
              {t('wallet.useOnchain')}
            </button>
          )}
          <span className="text-[var(--sage)]/50 font-mono truncate max-w-full">
            mint {shortenAddress(SALVAZION_MINT, 4)}
          </span>
        </div>
      </div>
    ) : null;

  if (variant === 'compact') {
    return (
      <>
        <div className={`flex items-center gap-2 ${className}`}>
          {connected && publicKey ? (
            <>
              {typeof tokenBalance === 'number' && (
                <span
                  className="px-2.5 py-1 rounded-full border border-[#8FD99A]/35 text-[11px] font-semibold text-[#8FD99A] bg-[#8FD99A]/10"
                  title="$SALVAZION"
                >
                  {formatSalvazion(tokenBalance)} $S
                </span>
              )}
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
              onClick={openPicker}
              className="px-3 py-1.5 rounded-full bg-[#7BC98A] text-[#040404] text-xs font-semibold hover:bg-[#B7F7AC] transition disabled:opacity-50"
            >
              {connecting ? t('wallet.connecting') : t('wallet.connectShort')}
            </button>
          )}
        </div>
        <WalletSelectModal open={pickerOpen} onClose={closePicker} />
      </>
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
            onClick={openPicker}
            className="btn-primary"
          >
            {connecting ? t('wallet.connecting') : t('wallet.connect')}
          </button>
          {/* Allow indicating amount even after disconnect if address remembered */}
          {amountEditor}
          <WalletSelectModal open={pickerOpen} onClose={closePicker} />
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
                {tokenBalance === null ? '—' : formatSalvazion(tokenBalance)}
              </p>
            </div>
          </div>

          {amountEditor}

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
