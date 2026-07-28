import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SALVAZION_MINT } from './config';

/** Classic SPL Token program + Token-2022 (in case $SALVAZION uses either). */
const TOKEN_PROGRAM_IDS = [
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
] as const;

export type WalletBalances = {
  sol: number | null;
  salvazion: number | null;
  error?: string;
};

/**
 * Read SOL + $SALVAZION (ui amount) for an owner.
 * Aggregates every token account for the mint (ATA + residual accounts).
 */
export async function fetchWalletBalances(
  connection: Connection,
  owner: PublicKey
): Promise<WalletBalances> {
  let sol: number | null = null;
  let salvazion: number | null = null;
  let error: string | undefined;

  try {
    const lamports = await connection.getBalance(owner, 'confirmed');
    sol = lamports / LAMPORTS_PER_SOL;
  } catch {
    error = 'No se pudo leer el saldo SOL (RPC).';
  }

  try {
    const mint = new PublicKey(SALVAZION_MINT);
    let total = 0;
    let queried = false;

    try {
      const parsed = await connection.getParsedTokenAccountsByOwner(owner, { mint });
      queried = true;
      for (const acc of parsed.value) {
        const amount = acc.account.data.parsed?.info?.tokenAmount?.uiAmount;
        if (typeof amount === 'number') total += amount;
      }
    } catch {
      for (const programId of TOKEN_PROGRAM_IDS) {
        try {
          const parsed = await connection.getParsedTokenAccountsByOwner(owner, {
            programId: new PublicKey(programId),
          });
          queried = true;
          for (const acc of parsed.value) {
            const info = acc.account.data.parsed?.info;
            if (info?.mint !== SALVAZION_MINT) continue;
            const amount = info?.tokenAmount?.uiAmount;
            if (typeof amount === 'number') total += amount;
          }
        } catch {
          // try next program
        }
      }
    }

    if (queried) {
      salvazion = total;
    } else if (!error) {
      error = 'No se pudo leer $SALVAZION (RPC).';
    }
  } catch {
    if (!error) error = 'No se pudo leer $SALVAZION (RPC).';
  }

  return { sol, salvazion, error };
}

export function formatSalvazion(amount: number, maxFrac = 2): string {
  return amount.toLocaleString(undefined, {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  });
}
