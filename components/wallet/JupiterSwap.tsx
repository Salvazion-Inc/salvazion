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
  /**
   * modal strategy:
   * - `jup` = open jup.ag (always works; default for Buy CTA)
   * - `plugin` = try in-app Plugin modal, fall back to jup.ag if empty
   */
  modalStrategy?: 'jup' | 'plugin';
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

function openJupBuy(): void {
  // Prefer same-tab on mobile in-app browsers where popups are blocked
  const opened = window.open(JUPITER_SWAP_URL, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.assign(JUPITER_SWAP_URL);
  }
}

/** True when Plugin actually painted a usable UI (not the empty height:0 shell). */
function pluginUiLooksReady(): boolean {
  const inst = document.getElementById('jupiter-plugin-instance');
  if (!inst) return false;
  const rect = inst.getBoundingClientRect();
  if (rect.height < 80 && rect.width < 80) {
    // Modal may portal into body with fixed overlay — search for swap UI text/nodes
    const overlay = document.querySelector(
      '#jupiter-plugin-instance [class*="Fixed"], #jupiter-plugin-instance [class*="modal"], #jupiter-plugin-instance iframe'
    );
    if (overlay) return true;
    // Any substantial content under the instance
    if ((inst.textContent || '').trim().length > 20) return true;
    if (inst.querySelectorAll('button, input, form').length > 0) return true;
    return false;
  }
  return (inst.textContent || '').trim().length > 0 || inst.querySelectorAll('button, input').length > 0;
}

/**
 * Jupiter Plugin (Ultra) — buy/swap $SALVAZION inside Salvazion.
 *
 * Modal default: open jup.ag (reliable). Optional `plugin` strategy tries the
 * in-app modal first and falls back if CSP/styles leave an empty shell.
 */
export default function JupiterSwap({
  mode = 'integrated',
  className = '',
  triggerLabel,
  showFallbackLink = true,
  modalStrategy = 'jup',
}: Props) {
  const { t } = useI18n();
  const reactId = useId().replace(/:/g, '');
  const targetId = `jupiter-plugin-${reactId}`;
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'integrated');
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

      try {
        window.Jupiter.close?.();
      } catch {
        // ignore
      }

      const w = walletRef.current;
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
      setReady(true);

      if (usePassthrough) {
        requestAnimationFrame(() => syncWallet());
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : t('swap.initError'));
      setReady(false);
      return false;
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
      passthroughRef.current = false;
    };
  }, [mode, initPlugin]);

  useEffect(() => {
    if (!ready || !passthroughRef.current) return;
    syncWallet();
  }, [ready, syncWallet, wallet.connected, wallet.publicKey?.toBase58()]);

  const openBuy = async () => {
    // Guaranteed path: open Jupiter Ultra swap page preselected SOL → $SALVAZION
    if (modalStrategy === 'jup') {
      openJupBuy();
      return;
    }

    setLoading(true);
    const ok = await initPlugin();
    if (!ok) {
      openJupBuy();
      return;
    }

    // Plugin sometimes mounts an empty height:0 shell when styles fail — fall back
    await new Promise((r) => setTimeout(r, 1200));
    if (!pluginUiLooksReady()) {
      setError(t('swap.initError'));
      openJupBuy();
    }
    setLoading(false);
  };

  if (mode === 'modal' || mode === 'widget') {
    // Progressive enhancement: real link always works even if JS breaks
    if (modalStrategy === 'jup') {
      return (
        <div className={className}>
          <a
            href={JUPITER_SWAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center py-3 rounded-xl bg-gradient-to-r from-[#8FD99A] to-[#6B8F6E] text-[#040404] font-semibold text-sm hover:opacity-90 transition"
          >
            {label}
          </a>
          {showFallbackLink && (
            <p className="block text-center text-[11px] text-[var(--sage)]/80 mt-2">
              Jupiter Ultra · SOL → $SALVAZION
            </p>
          )}
        </div>
      );
    }

    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => {
            void openBuy();
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
