import { JUPITER_SWAP_URL, SALVAZION_MINT, SOL_MINT } from './config';

export { JUPITER_SWAP_URL, SALVAZION_MINT, SOL_MINT };

/**
 * Jupiter Plugin (Ultra Swap) — replaces legacy Terminal main-v3.js.
 * Ultra can route $SALVAZION (organic/unknown); Metis swap API returns TOKEN_NOT_TRADABLE.
 * Docs: https://developers.jup.ag/docs/tool-kits/plugin
 */
export const JUPITER_PLUGIN_SCRIPT = 'https://plugin.jup.ag/plugin-v1.js';

/** @deprecated Use JUPITER_PLUGIN_SCRIPT */
export const JUPITER_TERMINAL_SCRIPT = JUPITER_PLUGIN_SCRIPT;

export type JupiterDisplayMode = 'modal' | 'integrated' | 'widget';

export type JupiterSwapMode = 'ExactInOrOut' | 'ExactIn' | 'ExactOut';

export interface JupiterFormProps {
  swapMode?: JupiterSwapMode;
  initialAmount?: string;
  fixedAmount?: boolean;
  initialInputMint?: string;
  initialOutputMint?: string;
  /** Lock one side of the pair to this mint */
  fixedMint?: string;
  referralAccount?: string;
  referralFee?: number;
}

export interface JupiterInitConfig {
  displayMode?: JupiterDisplayMode;
  integratedTargetId?: string;
  widgetStyle?: {
    position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    size?: 'sm' | 'default';
  };
  formProps?: JupiterFormProps;
  containerStyles?: Record<string, string | number>;
  containerClassName?: string;
  defaultExplorer?: 'Solana Explorer' | 'Solscan' | 'Solana Beach' | 'SolanaFM' | 'OrbMarkets';
  autoConnect?: boolean;
  /** When true, host app owns wallet UI — must pass syncProps + onRequestConnectWallet */
  enableWalletPassthrough?: boolean;
  passthroughWalletContextState?: unknown;
  onRequestConnectWallet?: () => void | Promise<void>;
  branding?: {
    logoUri?: string;
    name?: string;
  };
  onSuccess?: (args: {
    txid: string;
    swapResult: unknown;
    quoteResponseMeta: unknown;
  }) => void;
  onSwapError?: (args: { error?: unknown; quoteResponseMeta: unknown }) => void;
}

export type BuildJupiterOptions = {
  mode: JupiterDisplayMode;
  targetId?: string;
  /** Host wallet adapter state (from useWallet()) */
  walletContext?: unknown;
  /** Open the app wallet picker when Plugin asks to connect */
  onRequestConnectWallet?: () => void | Promise<void>;
  /**
   * When true, Plugin reuses the app wallet session.
   * When false, Plugin uses its own Unified Wallet Kit (better for guests).
   */
  enableWalletPassthrough?: boolean;
};

/**
 * Build Plugin init options preselected for SOL → $SALVAZION.
 * Plugin is RPC-less (Ultra handles quotes/tx); do not pass `endpoint`.
 */
export function buildJupiterInitOptions({
  mode,
  targetId,
  walletContext,
  onRequestConnectWallet,
  enableWalletPassthrough = false,
}: BuildJupiterOptions): JupiterInitConfig {
  const opts: JupiterInitConfig = {
    displayMode: mode,
    defaultExplorer: 'Solscan',
    formProps: {
      // Buy $SALVAZION with SOL by default (Ultra can route this organic mint)
      initialInputMint: SOL_MINT,
      initialOutputMint: SALVAZION_MINT,
      swapMode: 'ExactInOrOut',
    },
    branding: {
      name: 'Salvazion',
    },
  };

  if (enableWalletPassthrough) {
    opts.enableWalletPassthrough = true;
    if (walletContext) {
      opts.passthroughWalletContextState = walletContext;
    }
    if (onRequestConnectWallet) {
      opts.onRequestConnectWallet = onRequestConnectWallet;
    }
  }

  if (mode === 'integrated' && targetId) {
    opts.integratedTargetId = targetId;
    opts.containerStyles = {
      width: '100%',
      height: '560px',
      minHeight: '560px',
      borderRadius: '16px',
      overflow: 'hidden',
    };
    opts.containerClassName = 'salvazion-jupiter-plugin';
  }

  if (mode === 'widget') {
    opts.widgetStyle = {
      position: 'bottom-right',
      size: 'default',
    };
  }

  return opts;
}

declare global {
  interface Window {
    Jupiter?: {
      init: (config: JupiterInitConfig) => void;
      close?: () => void;
      resume?: () => void;
      syncProps?: (props: { passthroughWalletContextState?: unknown }) => void;
      _instance?: unknown;
    };
  }
}
