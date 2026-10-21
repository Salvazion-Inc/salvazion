import type Stripe from 'stripe';
import { getStripe } from './stripe';
import { type BillingInterval } from './plans';
import { BLOCKED_CHECKOUT_PRICE_IDS } from './price-ids';
import { resolveCheckoutPriceId } from './resolve-price';
import { getAppBaseUrl } from '@/lib/config/site';
import { buildGuestCheckoutParams } from './checkout-params';

/** metadata.flow for Checkout Sessions started without a Salvazion account. */
export const GUEST_CHECKOUT_FLOW = 'guest';
/** metadata.app — the Stripe account is shared with other products. */
export const SALVAZION_APP = 'salvazion';

/**
 * Link scanners / unfurlers (Outlook Safe Links, Slack, crawlers) follow GETs.
 * Do not create a Checkout Session for them — send them to the pricing section.
 */
const BOT_UA =
  /bot|crawl|spider|slurp|preview|scanner|monitor|facebookexternalhit|embedly|quora link|whatsapp|telegram|discord|skype|curl|wget|python-requests|httpclient|headless/i;

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_UA.test(userAgent);
}

/**
 * Stripe Checkout Session builder used by the smoke test (`e2e=1`), which
 * creates a session and expires it immediately. The public
 * `/premium/checkout` route no longer calls this for real visitors — they
 * must sign up and verify their email first. In-flight sessions already
 * created this way are still provisioned by the webhook and /premium/welcome.
 *
 * Price comes only from `resolveCheckoutPriceId` (lookup_key, never
 * default_price, never the legacy $20 price).
 */
export async function createGuestCheckoutSession(
  interval: BillingInterval,
  opts: { e2e?: boolean } = {}
): Promise<Stripe.Checkout.Session> {
  const priceId = await resolveCheckoutPriceId(interval);
  if (BLOCKED_CHECKOUT_PRICE_IDS.has(priceId)) {
    throw new Error(`Refusing legacy $20 price ${priceId} for Checkout.`);
  }

  const base = getAppBaseUrl();
  const metadata = {
    app: SALVAZION_APP,
    flow: GUEST_CHECKOUT_FLOW,
    interval,
    price_id: priceId,
    // Smoke tests: excluded from Pulso / KPI / founder dashboard by metadata.e2e.
    ...(opts.e2e ? { e2e: 'true' } : {}),
  };

  return getStripe().checkout.sessions.create(
    buildGuestCheckoutParams({ priceId, interval, baseUrl: base, metadata })
  );
}

/**
 * Post-deploy smoke mode (SLV-CHECKOUT-TOS-20261013-1). Allowed on Vercel
 * preview deployments, or anywhere when the request carries the
 * x-salvazion-smoke header equal to SMOKE_CHECKOUT_TOKEN.
 */
export function isSmokeRequestAllowed(headerToken: string | null): boolean {
  if (process.env.VERCEL_ENV === 'preview') return true;
  const expected = process.env.SMOKE_CHECKOUT_TOKEN;
  return Boolean(expected && headerToken && headerToken === expected);
}

/**
 * Creates a real guest Checkout Session through the exact production code
 * path, tagged metadata.e2e='true', and expires it immediately so it can never
 * be paid. Returns only non-sensitive facts.
 */
export async function runCheckoutSmoke(interval: BillingInterval): Promise<{
  ok: boolean;
  session_id_prefix: string;
  url_host: string | null;
  status: string | null;
  e2e: string | null;
}> {
  const session = await createGuestCheckoutSession(interval, { e2e: true });
  const expired = await getStripe().checkout.sessions.expire(session.id);
  const urlHost = session.url ? new URL(session.url).host : null;
  const allowPromotionCodes = session.allow_promotion_codes ?? null;
  return {
    ok:
      Boolean(session.url) &&
      urlHost === 'checkout.stripe.com' &&
      expired.status === 'expired' &&
      (allowPromotionCodes === false || allowPromotionCodes === null),
    session_id_prefix: session.id.slice(0, 12),
    url_host: urlHost,
    status: expired.status,
    e2e: expired.metadata?.e2e ?? null,
    allow_promotion_codes: allowPromotionCodes,
  };
}
