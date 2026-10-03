import type Stripe from 'stripe';
import { getStripe } from './stripe';
import { type BillingInterval } from './plans';
import { BLOCKED_CHECKOUT_PRICE_IDS } from './price-ids';
import { resolveCheckoutPriceId } from './resolve-price';
import { getAppBaseUrl } from '@/lib/config/site';

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
 * Stripe Checkout for a logged-out visitor: no Salvazion account, no email
 * confirmation before payment. Stripe collects the email and creates the
 * Customer (subscription mode always creates one). The account is provisioned
 * after payment by `provisionGuestCheckout` (webhook + welcome page).
 *
 * Price comes only from `resolveCheckoutPriceId` (lookup_key, never
 * default_price, never the legacy $20 price).
 */
export async function createGuestCheckoutSession(
  interval: BillingInterval
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
  };

  return getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/premium/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/?billing=cancel#pricing`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    custom_text: {
      submit: {
        message:
          'By confirming you agree to Salvazion [Terms of Service](https://salvazion.org/terms) and [Privacy Policy](https://salvazion.org/privacy). Your Salvazion account is created with this email.',
      },
    },
    subscription_data: { metadata },
    metadata,
  });
}
