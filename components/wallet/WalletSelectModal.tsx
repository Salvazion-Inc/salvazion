'use client';

import { useCallback, useEffect, useMemo, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import type { WalletName } from '@solana/wallet-adapter-base';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet, type Wallet } from '@solana/wallet-adapter-react';
import { useI18n } from '@/components/I18nProvider';

/** Official-looking Jupiter mark (fallback when adapter ships a placeholder icon). */
const JUPITER_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="12" fill="#0A0A0A"/><circle cx="20" cy="20" r="11" stroke="#C7F284" stroke-width="2.5"/><circle cx="20" cy="20" r="4.5" fill="#C7F284"/></svg>`
  );

const PRIORITY: Record<string, number> = {
  'Jupiter Mobile': 0,
  'WalletConnect/Reown': 1,
  Phantom: 2,
  Solflare: 3,
};

function walletIcon(wallet: Wallet): string {
  const name = wallet.adapter.name;
  const icon = wallet.adapter.icon;
  if (
    name === 'Jupiter Mobile' &&
    (!icon || icon.startsWith('[') || icon.includes('will be provided'))
  ) {
    return JUPITER_ICON;
  }
  return icon || JUPITER_ICON;
}

function sortWallets(list: Wallet[]): Wallet[] {
  return [...list].sort((a, b) => {
    const pa = PRIORITY[a.adapter.name] ?? 50;
    const pb = PRIORITY[b.adapter.name] ?? 50;
    if (pa !== pb) return pa - pb;
    // Installed first within same priority band
    const ia = a.readyState === WalletReadyState.Installed ? 0 : 1;
    const ib = b.readyState === WalletReadyState.Installed ? 0 : 1;
    if (ia !== ib) return ia - ib;
    return a.adapter.name.localeCompare(b.adapter.name);
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Custom wallet picker that always lists every usable adapter.
 * The stock @solana/wallet-adapter-react-ui modal hides Loadable wallets
 * (Jupiter Mobile, WalletConnect) under "More options" whenever any extension
 * is Installed — so Jupiter disappeared inside the hub on many devices.
 */
export default function WalletSelectModal({ open, onClose }: Props) {
  const { t } = useI18n();
  const { wallets, select, connecting } = useWallet();

  const listed = useMemo(() => {
    // Show every non-unsupported adapter (Installed + Loadable + NotDetected).
    // Do NOT hide Loadable (Jupiter Mobile) when extensions are Installed —
    // that is the bug in the stock wallet-adapter modal.
    const usable = wallets.filter(
      (w) => w.readyState !== WalletReadyState.Unsupported
    );
    return sortWallets(usable);
  }, [wallets]);

  const handleSelect = useCallback(
    (name: WalletName) => {
      // Same as stock WalletModal: select only. WalletProvider autoConnect
      // connects the new adapter (including Jupiter Mobile QR).
      select(name);
      onClose();
    },
    [select, onClose]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-select-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--border-strong)] bg-[#0c0c0c] shadow-2xl"
        onClick={stop}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-5 pb-3 bg-[#0c0c0c]/95 border-b border-[var(--border-soft)] backdrop-blur">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--sage)]">
              Solana
            </p>
            <h2
              id="wallet-select-title"
              className="text-lg font-semibold text-[#8FD99A]"
            >
              {t('wallet.connect')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[var(--border-soft)] text-[var(--sage)] hover:text-white hover:bg-[var(--surface-active)] transition"
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <ul className="p-3 space-y-1.5">
          {listed.map((wallet) => {
            const name = wallet.adapter.name;
            const installed = wallet.readyState === WalletReadyState.Installed;
            const isJupiter = name === 'Jupiter Mobile';
            return (
              <li key={name}>
                <button
                  type="button"
                  disabled={connecting}
                  onClick={() => handleSelect(name)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition border ${
                    isJupiter
                      ? 'border-[#C7F284]/40 bg-[#C7F284]/8 hover:bg-[#C7F284]/15'
                      : 'border-[var(--border-soft)] bg-[#040404]/50 hover:bg-[var(--surface-active)]'
                  } disabled:opacity-50`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={walletIcon(wallet)}
                    alt=""
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-lg object-contain bg-black/40 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#D8E1D9] truncate">
                      {name}
                    </p>
                    <p className="text-[11px] text-[var(--sage)]/80">
                      {isJupiter
                        ? t('wallet.jupiterHint')
                        : installed
                          ? t('wallet.installed')
                          : t('wallet.detectable')}
                    </p>
                  </div>
                  {isJupiter && (
                    <span className="shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C7F284]/20 text-[#C7F284] font-medium">
                      QR
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {listed.length === 0 && (
          <p className="px-5 pb-5 text-sm text-[var(--sage)]">
            {t('wallet.noneFound')}
          </p>
        )}

        <p className="px-5 pb-5 text-[11px] text-[var(--sage)]/70 leading-relaxed">
          {t('wallet.modalFooter')}
        </p>
      </div>
    </div>,
    document.body
  );
}
