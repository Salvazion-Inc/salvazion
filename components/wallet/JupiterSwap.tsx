'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  buildJupiterInitOptions,
  JUPITER_SWAP_URL,
  JUPITER_TERMINAL_SCRIPT,
  type JupiterDisplayMode,
} from '@/lib/solana/jupiter';

type Props = {
  /** integrated = embed in page; modal = popup; widget = floating */
  mode?: JupiterDisplayMode;
  className?: string;
  /** When mode is modal, only render a trigger button */
  triggerLabel?: string;
  showFallbackLink?: boolean;
};

function loadJupiterScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Jupiter?.init) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${JUPITER_TERMINAL_SCRIPT}"]`
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.Jupiter?.init) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Jupiter script failed')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = JUPITER_TERMINAL_SCRIPT;
    script.async = true;
    script.dataset.preload = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Jupiter Terminal'));
    document.head.appendChild(script);
  });
}

/**
 * Jupiter Terminal — swap SOL / tokens / $SALVAZION inside Salvazion.
 * Syncs with the app wallet-adapter session (passthrough).
 */
export default function JupiterSwap({
  mode = 'integrated',
  className = '',
  triggerLabel = 'Swap con Jupiter',
  showFallbackLink = true,
}: Props) {
  const reactId = useId().replace(/:/g, '');
  const targetId = `jupiter-terminal-${reactId}`;
  const wallet = useWallet();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'integrated');
  const inited = useRef(false);

  const syncWallet = useCallback(() => {
    if (typeof window === 'undefined' || !window.Jupiter?.syncProps) return;
    try {
      window.Jupiter.syncProps({
        passthroughWalletContextState: wallet,
      });
    } catch {
      // Terminal may not be ready yet
    }
  }, [wallet]);

  const initTerminal = useCallback(async () => {
    setError(null);
    try {
      await loadJupiterScript();
      if (!window.Jupiter?.init) {
        throw new Error('Jupiter no está disponible en este navegador.');
      }

      // Close previous instance when re-init (route changes / HMR)
      try {
        window.Jupiter.close?.();
      } catch {
        // ignore
      }

      const config = buildJupiterInitOptions(
        mode,
        mode === 'integrated' ? targetId : undefined
      );
      window.Jupiter.init(config);
      inited.current = true;
      setReady(true);
      // Passthrough after paint
      requestAnimationFrame(() => syncWallet());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar Jupiter');
      setReady(false);
    } finally {
      setLoading(false);
    }
  }, [mode, targetId, syncWallet]);

  // Integrated: mount terminal when the container is in the DOM
  useEffect(() => {
    if (mode !== 'integrated') return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!cancelled) await initTerminal();
    })();
    return () => {
      cancelled = true;
      try {
        window.Jupiter?.close?.();
      } catch {
        // ignore
      }
      inited.current = false;
    };
  }, [mode, initTerminal]);

  // Keep Jupiter in sync with connect/disconnect
  useEffect(() => {
    if (ready) syncWallet();
  }, [ready, syncWallet, wallet.connected, wallet.publicKey]);

  const openModal = async () => {
    setLoading(true);
    await initTerminal();
  };

  if (mode === 'modal' || mode === 'widget') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={openModal}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F511] to-[#00B10C] text-[#040404] font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Abriendo Jupiter…' : triggerLabel}
        </button>
        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
        {showFallbackLink && (
          <a
            href={JUPITER_SWAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[11px] text-[#B7F7AC]/50 hover:text-[#00F511] mt-2"
          >
            Abrir jup.ag en nueva pestaña ↗
          </a>
        )}
      </div>
    );
  }

  // integrated
  return (
    <div className={`w-full ${className}`}>
      {loading && (
        <div className="min-h-[280px] flex items-center justify-center text-[#00F511] text-sm animate-pulse">
          Cargando Jupiter…
        </div>
      )}
      {error && (
        <div className="glass rounded-2xl p-4 mb-3">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <a
            href={JUPITER_SWAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#00F511] hover:underline"
          >
            Continuar en jup.ag ↗
          </a>
        </div>
      )}
      <div
        id={targetId}
        className="w-full overflow-hidden rounded-2xl border border-[#00B10C]/30 bg-[#0a0a0a]"
        style={{ minHeight: loading ? 0 : 560 }}
      />
      {showFallbackLink && ready && (
        <a
          href={JUPITER_SWAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-[11px] text-[#B7F7AC]/50 hover:text-[#00F511] mt-3"
        >
          ¿Problemas? Abre Jupiter completo ↗
        </a>
      )}
    </div>
  );
}
