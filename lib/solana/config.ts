/**
 * Solana network + $SALVAZION token config.
 * Override RPC with NEXT_PUBLIC_SOLANA_RPC_URL for production (Helius / QuickNode / etc.).
 */

export const SALVAZION_MINT =
  process.env.NEXT_PUBLIC_SALVAZION_MINT ||
  '2XALhxGKCr2zCADkMANBq3b6rV7Zv5QF6RVZokgEAfUM';

export const SOLANA_NETWORK =
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'mainnet-beta' | 'devnet' | 'testnet') ||
  'mainnet-beta';

const PUBLIC_RPC: Record<string, string> = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

export function getSolanaRpcUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    PUBLIC_RPC[SOLANA_NETWORK] ||
    PUBLIC_RPC['mainnet-beta']
  );
}

/** Wrapped SOL mint (native SOL for Jupiter sell side) */
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Deep-link to buy $SALVAZION on jup.ag.
 * Use modern `sell` / `buy` query params (inputMint/outputMint no longer preselect pairs).
 * Ultra routing can trade this mint even when Metis marks it non-strict.
 */
export const JUPITER_SWAP_URL = `https://jup.ag/swap?sell=${SOL_MINT}&buy=${SALVAZION_MINT}`;

export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export const WALLET_STORAGE_KEY = 'salvazion_linked_wallet';
