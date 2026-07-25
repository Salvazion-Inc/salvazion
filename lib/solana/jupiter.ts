import { getSolanaRpcUrl, JUPITER_SWAP_URL, SALVAZION_MINT } from './config';

/** Wrapped SOL mint on Solana mainnet */
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

export const JUPITER_TERMINAL_SCRIPT = 'https://terminal.jup.ag/main-v3.js';

export { JUPITER_SWAP_URL, SALVAZION_MINT };

export type JupiterDisplayMode = 'modal' | 'integrated' | 'widget';

export interface JupiterInitConfig {
  displayMode: JupiterDisplayMode;
  integratedTargetId?: string;
  endpoint?: string;
  enableWalletPassthrough?: boolean;
  formProps?: {
    initialInputMint?: string;
    initialOutputMint?: string;
    fixedOutputMint?: boolean;
    swapMode?: 'ExactIn' | 'ExactOut';
  };
  containerStyles?: Record<string, string | number>;
  containerClassName?: string;
}

export function buildJupiterInitOptions(
  mode: JupiterDisplayMode,
  targetId?: string
): JupiterInitConfig {
  const opts: JupiterInitConfig = {
    displayMode: mode,
    endpoint: getSolanaRpcUrl(),
    enableWalletPassthrough: true,
    formProps: {
      initialInputMint: SOL_MINT,
      initialOutputMint: SALVAZION_MINT,
      // Allow swapping freely; preselect $SALVAZION as output
      fixedOutputMint: false,
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
