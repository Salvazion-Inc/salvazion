import type Stripe from 'stripe';
import type { BillingInterval } from './plans';

/**
 * Pure builders for the Premium Stripe Checkout Session params (guest
 * /premium/checkout and signed-in /api/billing/checkout). No Stripe client,
 * no env, no I/O — so the shape is unit-testable without a Stripe key.
 *
 * Consent + recovery (Orden CoS 11-oct, SLV-CHECKOUT-CONSENT-20261011-1):
 * - consent_collection.promotions = 'auto': Stripe Checkout shows its own
 *   "Keep me updated with news and personalized offers" checkbox where the
 *   feature is allowed (US business + US customers). Stripe picks the default
 *   checked/unchecked state from the account jurisdiction and the customer's
 *   IP; it is unchecked wherever affirmative consent is required. The result
 *   is recorded on session.consent.promotions ('opt_in' | 'opt_out').
 * - after_expiration.recovery.enabled = true: an expired session gets a
 *   recovery URL (valid 30 days) in the checkout.session.expired payload.
 *   Nothing here sends email; any recovery email is a separate, approved flow
 *   and only for customers with consent.promotions === 'opt_in'.
 *
 * allow_promotion_codes stays as it was (true) and the recovered session keeps
 * the same setting.
 */

export const PREMIUM_ALLOW_PROMOTION_CODES = true;

export const TERMS_URL = 'https://salvazion.org/terms';
export const PRIVACY_URL = 'https://salvazion.org/privacy';

const LEGAL_SUBMIT_MESSAGE = `By confirming you agree to Salvazion [Terms of Service](${TERMS_URL}) and [Privacy Policy](${PRIVACY_URL}).`;

export function premiumConsentAndRecoveryParams(): Pick<
  Stripe.Checkout.SessionCreateParams,
  'allow_promotion_codes' | 'consent_collection' | 'after_expiration'
> {
  return {
    allow_promotion_codes: PREMIUM_ALLOW_PROMOTION_CODES,
    consent_collection: { promotions: 'auto' },
    after_expiration: {
      recovery: {
        enabled: true,
        allow_promotion_codes: PREMIUM_ALLOW_PROMOTION_CODES,
      },
    },
  };
}

export type GuestCheckoutParamsInput = {
  priceId: string;
  interval: BillingInterval;
  baseUrl: string;
  metadata: Record<string, string>;
};

export function buildGuestCheckoutParams(
  input: GuestCheckoutParamsInput
): Stripe.Checkout.SessionCreateParams {
  const { priceId, baseUrl, metadata } = input;
  return {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/premium/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?billing=cancel#pricing`,
    ...premiumConsentAndRecoveryParams(),
    billing_address_collection: 'auto',
    custom_text: {
      submit: {
        message: `${LEGAL_SUBMIT_MESSAGE} Your Salvazion account is created with this email.`,
      },
    },
    subscription_data: { metadata },
    metadata,
  };
}

export type HubCheckoutParamsInput = {
  customerId: string;
  userId: string;
  priceId: string;
  interval: BillingInterval;
  baseUrl: string;
};

export function buildHubCheckoutParams(
  input: HubCheckoutParamsInput
): Stripe.Checkout.SessionCreateParams {
  const { customerId, userId, priceId, interval, baseUrl } = input;
  return {
    mode: 'subscription',
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/hub/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/hub/premium?billing=cancel`,
    ...premiumConsentAndRecoveryParams(),
    custom_text: {
      submit: { message: LEGAL_SUBMIT_MESSAGE },
    },
    subscription_data: {
      metadata: {
        supabase_user_id: userId,
        app: 'salvazion',
        interval,
      },
    },
    metadata: {
      supabase_user_id: userId,
      app: 'salvazion',
      interval,
      price_id: priceId,
    },
  };
}

/**
 * PII-free summary of an expired Checkout Session for logs: no email, no
 * customer id, no recovery URL (the URL is a bearer link to a checkout).
 */
export function summarizeExpiredSession(
  session: Pick<
    Stripe.Checkout.Session,
    'metadata' | 'consent' | 'after_expiration' | 'recovered_from'
  >
): {
  app: string | null;
  flow: string | null;
  interval: string | null;
  promotions_consent: string | null;
  recovery_enabled: boolean;
  recovery_url_present: boolean;
  recovery_expires_at: number | null;
} {
  const recovery = session.after_expiration?.recovery ?? null;
  return {
    app: session.metadata?.app ?? null,
    flow: session.metadata?.flow ?? 'hub',
    interval: session.metadata?.interval ?? null,
    promotions_consent: session.consent?.promotions ?? null,
    recovery_enabled: Boolean(recovery?.enabled),
    recovery_url_present: Boolean(recovery?.url),
    recovery_expires_at: recovery?.expires_at ?? null,
  };
}
