/**
 * $SALVAZION holder access: first month of Premium included (DEC-20261011-27,
 * Cristian 11-10 21:25 CL). Pure eligibility rules — no I/O, no env reads at
 * call time beyond the config helper — so every branch is unit-tested.
 *
 * Constraint 7 (MTP v1.1.0): this is ACCESS to Premium with the token as the
 * key, once per person and per wallet. It is not a discount, return, yield or
 * reward for holding. No coupons / promotion codes (DEC-20261011-26): it is a
 * subscription trial set server-side.
 *
 * Fail closed: any missing or doubtful input (no verified wallet, RPC error,
 * price missing/stale/illiquid, Stripe history unreadable) → no trial, and the
 * checkout proceeds normally at the full Premium price.
 */
import { createHash } from 'node:crypto';

export const HOLDER_TRIAL_DAYS = 30;

export type HolderTrialConfig = {
  /** Minimum USD value of the verified wallet's $SALVAZION (HOLDER_TRIAL_MIN_USD, default 20). */
  minUsd: number;
  /** Max age of the price quote in Solana slots (HOLDER_TRIAL_MAX_PRICE_AGE_SLOTS, default 216000 ≈ 24 h). */
  maxPriceAgeSlots: number;
  /** Minimum pool liquidity in USD reported by the price source (HOLDER_TRIAL_MIN_LIQUIDITY_USD, default 0 = off). */
  minLiquidityUsd: number;
};

function numEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function holderTrialConfig(): HolderTrialConfig {
  return {
    minUsd: numEnv('HOLDER_TRIAL_MIN_USD', 20),
    maxPriceAgeSlots: numEnv('HOLDER_TRIAL_MAX_PRICE_AGE_SLOTS', 216_000),
    minLiquidityUsd: numEnv('HOLDER_TRIAL_MIN_LIQUIDITY_USD', 0),
  };
}

/** Feature switch (HOLDER_TRIAL_ENABLED=0 turns it off without a deploy rollback). */
export function holderTrialEnabled(): boolean {
  return process.env.HOLDER_TRIAL_ENABLED !== '0';
}

export type PriceQuote = {
  usdPrice: number;
  /** Solana slot of the quote (Jupiter Price API v3 `blockId`). */
  blockId: number | null;
  liquidityUsd: number | null;
};

export type HolderTrialInput = {
  /** Verified wallet from wallet_holder_links (signature-checked), or null. */
  wallet: string | null;
  /** Fresh on-chain balance (UI units, 6 decimals applied); null = RPC failed. */
  balanceUi: number | null;
  /** Price quote; null = unavailable. */
  price: PriceQuote | null;
  /** Current confirmed slot; null = unknown. */
  currentSlot: number | null;
  /**
   * Prior use: true = this user (any prior Premium subscription or trial) or
   * this wallet (prior holder trial) already used it; null = could not check.
   */
  alreadyUsed: boolean | null;
};

export type HolderTrialReason =
  | 'eligible'
  | 'no_wallet'
  | 'rpc_unavailable'
  | 'no_balance'
  | 'price_unavailable'
  | 'price_stale'
  | 'low_liquidity'
  | 'below_threshold'
  | 'already_used'
  | 'history_unavailable'
  | 'disabled';

export type HolderTrialDecision = {
  eligible: boolean;
  reason: HolderTrialReason;
  /** Rounded down to cents; only when price and balance are known. */
  usdValue: number | null;
};

export function evaluateHolderTrial(
  input: HolderTrialInput,
  cfg: HolderTrialConfig
): HolderTrialDecision {
  const no = (reason: HolderTrialReason, usdValue: number | null = null) => ({
    eligible: false,
    reason,
    usdValue,
  });

  if (!input.wallet) return no('no_wallet');
  if (input.balanceUi === null || !Number.isFinite(input.balanceUi)) return no('rpc_unavailable');
  if (input.balanceUi <= 0) return no('no_balance', 0);

  const p = input.price;
  if (!p || !Number.isFinite(p.usdPrice) || p.usdPrice <= 0) return no('price_unavailable');
  if (
    p.blockId === null ||
    input.currentSlot === null ||
    !Number.isFinite(p.blockId) ||
    !Number.isFinite(input.currentSlot) ||
    input.currentSlot - p.blockId > cfg.maxPriceAgeSlots
  ) {
    return no('price_stale');
  }
  if (cfg.minLiquidityUsd > 0 && !(p.liquidityUsd !== null && p.liquidityUsd >= cfg.minLiquidityUsd)) {
    return no('low_liquidity');
  }

  const usdValue = Math.floor(input.balanceUi * p.usdPrice * 100) / 100;
  if (!(usdValue >= cfg.minUsd)) return no('below_threshold', usdValue);

  if (input.alreadyUsed === null) return no('history_unavailable', usdValue);
  if (input.alreadyUsed) return no('already_used', usdValue);

  return { eligible: true, reason: 'eligible', usdValue };
}

/** Stable, non-reversible-at-a-glance id for a wallet in Stripe metadata / events. */
export function walletHash(wallet: string): string {
  return createHash('sha256').update(`salvazion-holder-trial:${wallet}`).digest('hex').slice(0, 32);
}

/** Parse a Jupiter Price API v3 response for one mint. */
export function parseJupiterV3(json: unknown, mint: string): PriceQuote | null {
  if (!json || typeof json !== 'object') return null;
  const entry = (json as Record<string, unknown>)[mint];
  if (!entry || typeof entry !== 'object') return null;
  const e = entry as Record<string, unknown>;
  const usdPrice = typeof e.usdPrice === 'number' ? e.usdPrice : Number(e.usdPrice);
  if (!Number.isFinite(usdPrice) || usdPrice <= 0) return null;
  const blockId = typeof e.blockId === 'number' && Number.isFinite(e.blockId) ? e.blockId : null;
  const liquidityUsd =
    typeof e.liquidity === 'number' && Number.isFinite(e.liquidity) ? e.liquidity : null;
  return { usdPrice, blockId, liquidityUsd };
}

/** Public, PII-free state for the /hub/profile line. */
export type HolderTrialPublicState = 'eligible' | 'used' | 'rule' | 'unavailable' | 'none';

export function publicTrialState(d: HolderTrialDecision): HolderTrialPublicState {
  switch (d.reason) {
    case 'eligible':
      return 'eligible';
    case 'already_used':
      return 'used';
    case 'no_wallet':
    case 'disabled':
      return 'none';
    case 'no_balance':
    case 'below_threshold':
    case 'low_liquidity':
      return 'rule';
    default:
      return 'unavailable';
  }
}
