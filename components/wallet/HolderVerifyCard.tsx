'use client';

import { useCallback, useEffect, useState } from 'react';
import bs58 from 'bs58';
import { useWallet } from '@solana/wallet-adapter-react';
import { useI18n } from '@/components/I18nProvider';
import WalletSelectModal from '@/components/wallet/WalletSelectModal';
import { shortenAddress } from '@/lib/solana/config';
import { formatSalvazion } from '@/lib/solana/balances';
import { freeLimitFor } from '@/lib/billing/ai-quota';

type Status = {
  configured: boolean;
  linked: boolean;
  wallet?: string;
  verifiedAt?: string;
  balance?: number;
  bonusActive?: boolean;
};

type Phase = 'idle' | 'signing' | 'checking';

const ERROR_KEYS: Record<string, string> = {
  wallet_taken: 'holder.errTaken',
  rpc_unavailable: 'holder.errRpc',
  expired: 'holder.errExpired',
  not_configured: 'holder.errUnavailable',
};

async function fetchHolderStatus(): Promise<Status | null> {
  try {
    const res = await fetch('/api/wallet/holder', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Status;
  } catch {
    return null;
  }
}

/**
 * Post-login only (rendered inside /hub). Proves wallet ownership with a
 * read-only signMessage and activates the $SALVAZION holder bonus
 * (2× Free AI limits) when the verified wallet holds > 0 tokens.
 */
export default function HolderVerifyCard({ className = '' }: { className?: string }) {
  const { t, lang } = useI18n();
  const { publicKey, connected, connecting, signMessage } = useWallet();
  const [status, setStatus] = useState<Status | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    const next = await fetchHolderStatus();
    if (next) setStatus(next);
  }, []);

  useEffect(() => {
    let alive = true;
    void fetchHolderStatus().then((next) => {
      if (alive && next) setStatus(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  const connectedAddress = connected && publicKey ? publicKey.toBase58() : null;

  const verify = async () => {
    if (!connectedAddress || phase !== 'idle') return;
    setError(null);
    if (!signMessage) {
      setError(t('holder.noSignMessage'));
      return;
    }
    setPhase('signing');
    try {
      const chRes = await fetch('/api/wallet/holder/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ wallet: connectedAddress, lang }),
      });
      const ch = await chRes.json().catch(() => ({}));
      if (!chRes.ok || typeof ch.message !== 'string') {
        setError(t(ERROR_KEYS[ch.error] ?? 'holder.errGeneric'));
        return;
      }
      let signature: Uint8Array;
      try {
        signature = await signMessage(new TextEncoder().encode(ch.message));
      } catch {
        setError(t('holder.errRejected'));
        return;
      }
      setPhase('checking');
      const vRes = await fetch('/api/wallet/holder/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          wallet: connectedAddress,
          token: ch.token,
          signature: bs58.encode(signature),
        }),
      });
      const v = await vRes.json().catch(() => ({}));
      if (!vRes.ok || !v.ok) {
        setError(t(ERROR_KEYS[v.error] ?? 'holder.errGeneric'));
        return;
      }
      await loadStatus();
    } catch {
      setError(t('holder.errGeneric'));
    } finally {
      setPhase('idle');
    }
  };

  const unlink = async () => {
    setError(null);
    try {
      const res = await fetch('/api/wallet/holder', { method: 'DELETE', credentials: 'include' });
      if (!res.ok) setError(t('holder.errGeneric'));
    } finally {
      await loadStatus();
    }
  };

  if (status && !status.configured) return null;

  const linked = Boolean(status?.linked && status.wallet);
  const mismatch = linked && connectedAddress && connectedAddress !== status?.wallet;
  const limits = {
    coach: freeLimitFor('coach_chat', true),
    tts: freeLimitFor('coach_tts', true),
    devotional: freeLimitFor('devotional_ai', true),
    meal: freeLimitFor('vision_meal', true),
    body: freeLimitFor('vision_body', true),
  };
  const busyLabel = phase === 'signing' ? t('holder.signing') : phase === 'checking' ? t('holder.checking') : null;

  return (
    <div id="holder-bonus" className={`glass rounded-2xl p-5 space-y-3 scroll-mt-24 ${className}`}>
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--sage)]">Free · IA</p>
        <h3 className="text-lg font-semibold text-[#8FD99A] mt-0.5">{t('holder.title')}</h3>
        <p className="text-xs text-[var(--sage)]/80 mt-1">{t('holder.subtitle')}</p>
      </div>

      {linked ? (
        <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/50 px-3 py-2.5 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">{t('holder.verifiedWallet')}</p>
          <p className="text-sm font-mono text-[#D8E1D9]" title={status?.wallet}>
            {shortenAddress(status!.wallet!, 6)}
            {typeof status?.balance === 'number' ? (
              <span className="ml-2 text-[#8FD99A]">{formatSalvazion(status.balance)} $SALVAZION</span>
            ) : null}
          </p>
          {status?.bonusActive ? (
            <>
              <p className="text-sm text-[#8FD99A] font-medium">{t('holder.active')}</p>
              <p className="text-[11px] text-[var(--sage)] leading-relaxed">{t('holder.activeLimits', limits)}</p>
            </>
          ) : (
            <p className="text-xs text-amber-300/90">{t('holder.noBalance')}</p>
          )}
        </div>
      ) : null}

      {mismatch ? <p className="text-xs text-amber-300/90">{t('holder.otherWallet')}</p> : null}

      {!connectedAddress ? (
        <div className="space-y-2">
          {!linked ? <p className="text-xs text-[var(--sage)]">{t('holder.connectFirst')}</p> : null}
          <button
            type="button"
            disabled={connecting}
            onClick={() => setPickerOpen(true)}
            className="btn-secondary w-full min-h-[2.75rem] text-sm"
          >
            {t('holder.connect')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={phase !== 'idle'}
          onClick={() => void verify()}
          className="btn-primary w-full min-h-[2.75rem] text-sm disabled:opacity-50"
        >
          {busyLabel ?? (linked && !mismatch ? t('holder.recheck') : t('holder.verify'))}
        </button>
      )}

      <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">{t('holder.safety')}</p>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-[var(--sage)]/80">{t('holder.premiumNote')}</span>
        {linked ? (
          <button type="button" onClick={() => void unlink()} className="shrink-0 text-[var(--sage)]/80 hover:text-red-400">
            {t('holder.unlink')}
          </button>
        ) : null}
      </div>
      <WalletSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
