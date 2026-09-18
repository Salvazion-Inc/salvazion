/**
 * Server-only Stripe price / product IDs.
 * Do not import this module from client components — keep IDs out of the bundle
 * except NEXT_PUBLIC_* display env vars.
 */

import {
  lookupKeyForInterval,
  type BillingInterval,
} from './plans';

export const PREMIUM_PRODUCT_ID =
  process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID || 'prod_UxwcMVMNlKeczI';

export const CANONICAL_PRICE_MONTHLY = 'price_1U0WEWHOw5ZkjRlZHXRW0gAX';
export const CANONICAL_PRICE_ANNUAL = 'price_1U0WEXHOw5ZkjRlZOwkxysed';

/** Legacy $20 monthly — still product default_price. Never a Checkout line item. */
export const LEGACY_PRICE_MONTHLY_20 = 'price_1Ty0isHOw5ZkjRlZ6t5TRGje';

export const BLOCKED_CHECKOUT_PRICE_IDS = new Set<string>([
  LEGACY_PRICE_MONTHLY_20,
]);

function envPriceId(names: string[], canonical: string): string {
  for (const name of names) {
    const raw = process.env[name]?.trim();
    if (!raw) continue;
    if (BLOCKED_CHECKOUT_PRICE_IDS.has(raw)) continue;
    return raw;
  }
  return canonical;
}

export const STRIPE_PRICE_MONTHLY = envPriceId(
  ['NEXT_PUBLIC_STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_MONTHLY'],
  CANONICAL_PRICE_MONTHLY
);

export const STRIPE_PRICE_ANNUAL = envPriceId(
  ['NEXT_PUBLIC_STRIPE_PRICE_ANNUAL', 'STRIPE_PRICE_ANNUAL'],
  CANONICAL_PRICE_ANNUAL
);

export function isBlockedCheckoutPriceId(
  priceId: string | null | undefined
): boolean {
  if (!priceId) return false;
  return BLOCKED_CHECKOUT_PRICE_IDS.has(priceId);
}

export function canonicalPriceIdForInterval(interval: BillingInterval): string {
  return interval === 'year' ? CANONICAL_PRICE_ANNUAL : CANONICAL_PRICE_MONTHLY;
}

/** Current + legacy Premium price IDs (Stripe prices are immutable). */
const PREMIUM_PRICE_IDS = new Set(
  [
    CANONICAL_PRICE_MONTHLY,
    CANONICAL_PRICE_ANNUAL,
    STRIPE_PRICE_MONTHLY,
    STRIPE_PRICE_ANNUAL,
    // Previous $20 / $15 plans — still honor existing subscribers
    'price_1Ty0iyHOw5ZkjRlZMsCZPQWY',
    'price_1Ty0iyHOw5ZkjRlZQBQYbfQ7',
    LEGACY_PRICE_MONTHLY_20,
  ].filter(Boolean)
);

export function isPremiumPriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return false;
  return PREMIUM_PRICE_IDS.has(priceId);
}

/** Display / KPI helper. Checkout must use resolveCheckoutPriceId() (lookup_key). */
export function priceIdForInterval(interval: BillingInterval): string {
  return canonicalPriceIdForInterval(interval);
}

export { lookupKeyForInterval };
