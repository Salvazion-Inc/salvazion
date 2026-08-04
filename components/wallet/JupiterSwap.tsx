'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  buildJupiterInitOptions,
  JUPITER_PLUGIN_SCRIPT,
  JUPITER_SWAP_URL,
  type JupiterDisplayMode,
} from '@/lib/solana/jupiter';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  /** integrated = embed in page; modal = popup; widget = floating */
  mode?: JupiterDisplayMode;
  className?: string;
  /** When mode is modal, only render a trigger button */
  triggerLabel?: string;
  showFallbackLink?: boolean;
};

function loadJupiterScript(loadErrorMsg: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Jupiter?.init) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${JUPITER_PLUGIN_SCRIPT}"]`
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.Jupiter?.init) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(loadErrorMsg)), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = JUPITER_PLUGIN_SCRIPT;
    script.async = true;
    script.dataset.preload = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(loadErrorMsg));
    document.head.appendChild(script);
  });
}

/**
 * Jupiter Plugin (Ultra) — buy/swap $SALVAZION inside Salvazion.
 * Uses Ultra routing (token is organic/unknown; Metis marks it TOKEN_NOT_TRADABLE).
 * When a wallet is already connected, passes it through; otherwise Plugin owns connect UI.
 */
export default function JupiterSwap({
  mode = 'integrated',
  className = '',
  triggerLabel,
  showFallbackLink = true,
}: Props) {
  const { t } = useI18n();
  const reactId = useId().replace(/:/g, '');
  const targetId = `jupiter-plugin-${reactId}`;
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'integrated');
  const inited = useRef(false);
  const passthroughRef = useRef(false);
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  const label = triggerLabel || t('swap.defaultTrigger');

  const requestConnectWallet = useCallback(() => {
    setWalletModalVisible(true);
  }, [setWalletModalVisible]);

  const syncWallet = useCallback(() => {
    if (typeof window === 'undefined' || !window.Jupiter?.syncProps) return;
    if (!passthroughRef.current) return;
    try {
      window.Jupiter.syncProps({
        passthroughWalletContextState: walletRef.current,
      });
    } catch {
      // Plugin may not be ready yet
    }
  }, []);

  const initPlugin = useCallback(async () => {
    setError(null);
    try {
      await loadJupiterScript(t('swap.loadError'));
      if (!window.Jupiter?.init) {
        throw new Error(t('swap.unavailable'));
      }

      // Close previous instance when re-init (route changes / HMR / re-open modal)
      try {
        window.Jupiter.close?.();
      } catch {
        // ignore
      }

      const w = walletRef.current;
      // Passthrough only when already connected so guests get Plugin's own wallet UI.
      const usePassthrough = Boolean(w.connected && w.publicKey);
      passthroughRef.current = usePassthrough;

      const config = buildJupiterInitOptions({
        mode,
        targetId: mode === 'integrated' ? targetId : undefined,
        enableWalletPassthrough: usePassthrough,
        walletContext: usePassthrough ? w : undefined,
        onRequestConnectWallet: requestConnectWallet,
      });

      window.Jupiter.init(config);
      inited.current = true;
      setReady(true);

      if (usePassthrough) {
        requestAnimationFrame(() => syncWallet());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('swap.initError'));
      setReady(false);
      // Hard fallback: open jup.ag so Buy never dead-ends
      if (mode === 'modal' || mode === 'widget') {
        try {
          window.open(JUPITER_SWAP_URL, '_blank', 'noopener,noreferrer');
        } catch {
          // ignore popup blockers
        }
      }
    } finally {
      setLoading(false);
    }
  }, [mode, targetId, requestConnectWallet, syncWallet, t]);

  // Integrated: mount plugin when the container is in the DOM
  useEffect(() => {
    if (mode !== 'integrated') return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!cancelled) await initPlugin();
    })();
    return () => {
      cancelled = true;
      try {
        window.Jupiter?.close?.();
      } catch {
        // ignore
      }
      inited.current = false;
      passthroughRef.current = false;
    };
  }, [mode, initPlugin]);

  // Keep Plugin in sync when host wallet connects/disconnects (passthrough mode)
  useEffect(() => {
    if (!ready || !passthroughRef.current) return;
    syncWallet();
  }, [ready, syncWallet, wallet.connected, wallet.publicKey?.toBase58()]);

  const openModal = async () => {
    setLoading(true);
    await initPlugin();
  };

  if (mode === 'modal' || mode === 'widget') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => {
            void openModal();
          }}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8FD99A] to-[#6B8F6E] text-[#040404] font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? t('swap.opening') : label}
        </button>
        {error && (
          <p className="text-xs text-red-400 mt-2">
            {error}{' '}
            <a
              href={JUPITER_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#8FD99A]"
            >
              {t('swap.continueOnJup')}
            </a>
          </p>
        )}
        {showFallbackLink && (
          <a
            href={JUPITER_SWAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[11px] text-[var(--sage)]/80 hover:text-[#8FD99A] mt-2"
          >
            {t('swap.openJupNewTab')}
          </a>
        )}
      </div>
    );
  }

  // integrated
  return (
    <div className={`w-full ${className}`}>
      {loading && (
        <div className="min-h-[280px] flex items-center justify-center text-[#8FD99A] text-sm animate-pulse">
          {t('swap.loading')}
        </div>
      )}
      {error && (
        <div className="glass rounded-2xl p-4 mb-3">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <a
            href={JUPITER_SWAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#8FD99A] hover:underline"
          >
            {t('swap.continueOnJup')}
          </a>
        </div>
      )}
      <div
        id={targetId}
        className="w-full overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[#0a0a0a]"
        style={{ minHeight: loading ? 0 : 560 }}
      />
      {showFallbackLink && (
        <a
          href={JUPITER_SWAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-[11px] text-[var(--sage)]/80 hover:text-[#8FD99A] mt-3"
        >
          {t('swap.openJupFull')}
        </a>
      )}
    </div>
  );
}
