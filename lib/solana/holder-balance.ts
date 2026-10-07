/**
 * Server-side $SALVAZION balance read for the holder bonus.
 * getTokenAccountsByOwner filtered by mint; only Token-2022-owned accounts count. Throws on RPC failure so an outage
 * is never mistaken for a 0 balance.
 */
import { SALVAZION_MINT } from './config';
import { sumMintBalance, type ParsedTokenAccount } from './holder-proof';

export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const SALVAZION_DECIMALS = 6;
const PUBLIC_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

/** Server RPC: SOLANA_RPC_URL (server-only, may carry an API key) → public env → public mainnet. */
export function getServerSolanaRpcUrl(): string {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    PUBLIC_MAINNET_RPC
  );
}

export type HolderBalance = { raw: string; ui: number };

export async function fetchHolderBalance(
  wallet: string,
  opts: { rpcUrl?: string; timeoutMs?: number } = {}
): Promise<HolderBalance> {
  const res = await fetch(opts.rpcUrl || getServerSolanaRpcUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        wallet,
        // Mint filter (indexed, fast). Wallets with many Token-2022 accounts
        // make a programId-wide query slow on public RPC.
        { mint: SALVAZION_MINT },
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ],
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 10000),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`rpc_http_${res.status}`);
  const json = (await res.json()) as {
    result?: { value?: ParsedTokenAccount[] };
    error?: { code?: number; message?: string };
  };
  if (json.error || !Array.isArray(json.result?.value)) {
    throw new Error(`rpc_error_${json.error?.code ?? 'shape'}`);
  }
  // Only count accounts owned by the Token-2022 program.
  const accounts = json.result.value.filter(
    (a) => (a as { account?: { owner?: string } }).account?.owner === TOKEN_2022_PROGRAM_ID
  );
  return sumMintBalance(accounts, SALVAZION_MINT, SALVAZION_DECIMALS);
}

export function hasPositiveBalance(b: HolderBalance | null | undefined): boolean {
  return Boolean(b && /^\d+$/.test(b.raw) && BigInt(b.raw) > BigInt(0));
}
