/**
 * Server-side data gathering for the holder trial (see holder-trial.ts).
 * Every read fails closed: an error becomes `null`, and evaluateHolderTrial
 * turns `null` into "no trial".
 */
import type Stripe from 'stripe';
import { getHolderLink } from './holder-links';
import {
  evaluateHolderTrial,
  holderTrialConfig,
  holderTrialEnabled,
  parseJupiterV3,
  walletHash,
  type HolderTrialDecision,
  type PriceQuote,
} from './holder-trial';
import { fetchHolderBalance, getServerSolanaRpcUrl } from '@/lib/solana/holder-balance';
import { SALVAZION_MINT } from '@/lib/solana/config';

const JUPITER_PRICE_V3 = 'https://lite-api.jup.ag/price/v3';

export async function fetchTokenPrice(mint = SALVAZION_MINT): Promise<PriceQuote | null> {
  try {
    const base = process.env.HOLDER_TRIAL_PRICE_URL || JUPITER_PRICE_V3;
    const res = await fetch(`${base}?ids=${encodeURIComponent(mint)}`, {
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return parseJupiterV3(await res.json(), mint);
  } catch {
    return null;
  }
}

export async function fetchCurrentSlot(): Promise<number | null> {
  try {
    const res = await fetch(getServerSolanaRpcUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [{ commitment: 'confirmed' }] }),
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: unknown };
    return typeof json.result === 'number' ? json.result : null;
  } catch {
    return null;
  }
}

/**
 * One trial per user and per wallet, ever, with Stripe as the record (no DB
 * migration): any prior subscription of this customer, any subscription whose
 * metadata carries this user id, or any holder-trial subscription whose
 * metadata carries this wallet hash → already used. null = could not check.
 */
export async function hasPriorUse(
  stripe: Stripe,
  userId: string,
  customerId: string | null,
  wHash: string
): Promise<boolean | null> {
  try {
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
      if (subs.data.length > 0) return true;
    }
    const found = await stripe.subscriptions.search({
      query: `metadata['holder_trial_wallet']:'${wHash}' OR metadata['supabase_user_id']:'${userId}'`,
      limit: 1,
    });
    return found.data.length > 0;
  } catch {
    return null;
  }
}

export type HolderTrialCheck = HolderTrialDecision & { walletHash: string | null };

export async function checkHolderTrial(
  stripe: Stripe | null,
  userId: string,
  customerId: string | null
): Promise<HolderTrialCheck> {
  const off = (reason: HolderTrialDecision['reason']): HolderTrialCheck => ({
    eligible: false,
    reason,
    usdValue: null,
    walletHash: null,
  });
  if (!holderTrialEnabled()) return off('disabled');

  let wallet: string | null = null;
  try {
    wallet = (await getHolderLink(userId))?.wallet ?? null;
  } catch {
    return off('rpc_unavailable');
  }
  if (!wallet) return off('no_wallet');
  const wHash = walletHash(wallet);

  const [balanceUi, price, currentSlot] = await Promise.all([
    fetchHolderBalance(wallet).then((b) => b.ui, () => null),
    fetchTokenPrice(),
    fetchCurrentSlot(),
  ]);

  const cfg = holderTrialConfig();
  // Only hit Stripe when everything else already qualifies.
  const pre = evaluateHolderTrial(
    { wallet, balanceUi, price, currentSlot, alreadyUsed: false },
    cfg
  );
  if (!pre.eligible) return { ...pre, walletHash: wHash };

  const alreadyUsed = stripe ? await hasPriorUse(stripe, userId, customerId, wHash) : null;
  const d = evaluateHolderTrial({ wallet, balanceUi, price, currentSlot, alreadyUsed }, cfg);
  return { ...d, walletHash: wHash };
}

/** Expire this customer's other open holder-trial sessions (no parallel trials). */
export async function expireOpenHolderTrialSessions(stripe: Stripe, customerId: string) {
  try {
    const open = await stripe.checkout.sessions.list({ customer: customerId, status: 'open', limit: 10 });
    await Promise.all(
      open.data
        .filter((s) => s.metadata?.holder_trial === 'true')
        .map((s) => stripe.checkout.sessions.expire(s.id).catch(() => undefined))
    );
  } catch {
    // Best effort; the Stripe history check still blocks a second trial later.
  }
}
