import type Stripe from 'stripe';
import { getStripe } from './stripe';
import {
  BLOCKED_CHECKOUT_PRICE_IDS,
  CANONICAL_PRICE_ANNUAL,
  CANONICAL_PRICE_MONTHLY,
  CHECKOUT_UNIT_AMOUNT_CENTS,
  PREMIUM_PRODUCT_ID,
  lookupKeyForInterval,
  type BillingInterval,
} from './plans';

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<BillingInterval, { priceId: string; at: number }>();

function productIdOf(price: Stripe.Price): string | null {
  const product = price.product;
  if (typeof product === 'string') return product;
  if (product && !product.deleted) return product.id;
  return null;
}

export function assertSafeCheckoutPrice(
  price: Stripe.Price,
  interval: BillingInterval
): void {
  if (!price.active) {
    throw new Error(`Stripe price ${price.id} is not active.`);
  }
  if (BLOCKED_CHECKOUT_PRICE_IDS.has(price.id)) {
    throw new Error(
      `Refusing legacy $20 price ${price.id} for Checkout. Use lookup_key ${lookupKeyForInterval(interval)}.`
    );
  }

  const expectedAmount = CHECKOUT_UNIT_AMOUNT_CENTS[interval];
  if (price.unit_amount !== expectedAmount) {
    throw new Error(
      `Refusing Checkout price ${price.id}: unit_amount ${price.unit_amount} !== ${expectedAmount}.`
    );
  }

  const rec = price.recurring?.interval;
  const expectedRec = interval === 'year' ? 'year' : 'month';
  if (rec !== expectedRec) {
    throw new Error(
      `Refusing Checkout price ${price.id}: recurring interval ${rec} !== ${expectedRec}.`
    );
  }

  const expectedLookup = lookupKeyForInterval(interval);
  if (price.lookup_key && price.lookup_key !== expectedLookup) {
    throw new Error(
      `Refusing Checkout price ${price.id}: lookup_key ${price.lookup_key} !== ${expectedLookup}.`
    );
  }

  const productId = productIdOf(price);
  if (productId && productId !== PREMIUM_PRODUCT_ID) {
    throw new Error(
      `Refusing Checkout price ${price.id}: product ${productId} !== ${PREMIUM_PRODUCT_ID}.`
    );
  }
}

/**
 * Resolve the live Checkout price by Stripe lookup_key.
 * Never uses product.default_price (currently the legacy $20 monthly).
 * Never uses a stale env price id.
 */
export async function resolveCheckoutPriceId(
  interval: BillingInterval
): Promise<string> {
  const now = Date.now();
  const hit = cache.get(interval);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.priceId;

  const stripe = getStripe();
  const lookupKey = lookupKeyForInterval(interval);
  const canonicalId =
    interval === 'year' ? CANONICAL_PRICE_ANNUAL : CANONICAL_PRICE_MONTHLY;

  const listed = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  let chosen: Stripe.Price | null = null;
  if (listed.data[0]) {
    try {
      assertSafeCheckoutPrice(listed.data[0], interval);
      chosen = listed.data[0];
    } catch (err) {
      console.error('[billing] lookup_key price rejected', err);
    }
  }

  if (!chosen) {
    const fallback = await stripe.prices.retrieve(canonicalId);
    assertSafeCheckoutPrice(fallback, interval);
    chosen = fallback;
  }

  if (BLOCKED_CHECKOUT_PRICE_IDS.has(chosen.id)) {
    throw new Error(`Refusing legacy $20 price ${chosen.id} for Checkout.`);
  }

  cache.set(interval, { priceId: chosen.id, at: now });
  return chosen.id;
}
