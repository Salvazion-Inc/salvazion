import {
  getSolanaRpcUrl,
  JUPITER_SWAP_URL,
  SALVAZION_MINT,
  SOL_MINT,
} from './config';

export { JUPITER_SWAP_URL, SALVAZION_MINT, SOL_MINT };

/** Plugin script — v3 still ships from terminal.jup.ag */
export const JUPITER_TERMINAL_SCRIPT = 'https://terminal.jup.ag/main-v3.js';

export type JupiterDisplayMode = 'modal' | 'integrated' | 'widget';

export interface JupiterInitConfig {
  displayMode: JupiterDisplayMode;
  integratedTargetId?: string;
  endpoint?: string;
  enableWalletPassthrough?: boolean;
  /**
   * When true (default in Terminal), only Jupiter "strict" tokens appear.
   * $SALVAZION is organic/unknown — must be false or quotes fail as TOKEN_NOT_TRADABLE.
   */
  strictTokenList?: boolean;
  formProps?: {
    initialInputMint?: string;
    initialOutputMint?: string;
    fixedOutputMint?: boolean;
    fixedInputMint?: boolean;
    swapMode?: 'ExactIn' | 'ExactOut' | 'ExactInOrOut';
    initialSlippageBps?: number;
  };
  containerStyles?: Record<string, string | number>;
  containerClassName?: string;
  defaultExplorer?: 'Solana Explorer' | 'Solscan' | 'Solana Beach' | 'SolanaFM';
}

export function buildJupiterInitOptions(
  mode: JupiterDisplayMode,
  targetId?: string
): JupiterInitConfig {
  const opts: JupiterInitConfig = {
    displayMode: mode,
    endpoint: getSolanaRpcUrl(),
    enableWalletPassthrough: true,
    // Required: mint is not on Jupiter strict list (tag: unknown)
    strictTokenList: false,
    defaultExplorer: 'Solscan',
    formProps: {
      initialInputMint: SOL_MINT,
      initialOutputMint: SALVAZION_MINT,
      // Preselect $SALVAZION buy; allow changing pair freely
      fixedOutputMint: false,
      fixedInputMint: false,
      swapMode: 'ExactInOrOut',
      // Slightly wider default for thin-liquidity pairs
      initialSlippageBps: 100,
    },
  };

  if (mode === 'integrated' && targetId) {
    opts.integratedTargetId = targetId;
    opts.containerStyles = {
      width: '100%',
      minHeight: '560px',
      borderRadius: '16px',
    };
    opts.containerClassName = 'salvazion-jupiter-terminal';
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
