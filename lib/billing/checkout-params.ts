import type Stripe from 'stripe';
import type { BillingInterval } from './plans';
import { HOLDER_TRIAL_DAYS } from './holder-trial';

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
 * No promotion codes (DEC-20261011-26, SLV-NOPROMO-20261011-1): Premium never
 * uses discounts or promo codes. allow_promotion_codes is NOT sent, neither on
 * the session nor on after_expiration.recovery, so Stripe applies its default
 * (false) and Checkout shows no "Add promotion code" field. No `discounts`
 * either. Do not add them back without a new zone-A decision by Cristian.
 */

export const TERMS_URL = 'https://salvazion.org/terms';
export const PRIVACY_URL = 'https://salvazion.org/privacy';

const LEGAL_SUBMIT_MESSAGE = `By confirming you agree to Salvazion [Terms of Service](${TERMS_URL}) and [Privacy Policy](${PRIVACY_URL}).`;

export function premiumConsentAndRecoveryParams(): Pick<
  Stripe.Checkout.SessionCreateParams,
  'consent_collection' | 'after_expiration'
> {
  return {
    consent_collection: { promotions: 'auto' },
    after_expiration: {
      recovery: { enabled: true },
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
  /**
   * $SALVAZION holder access (DEC-20261011-27): set ONLY by the server after
   * checkHolderTrial() said eligible. Adds a 30-day subscription trial, never
   * a coupon or promotion code (DEC-20261011-26).
   */
  holderTrial?: { walletHash: string } | null;
};

export const HOLDER_TRIAL_SUBMIT_MESSAGE =
  'With your verified $SALVAZION wallet, your first month of Premium is included. After that, it continues at the regular price unless you cancel before the month ends.';

export function buildHubCheckoutParams(
  input: HubCheckoutParamsInput
): Stripe.Checkout.SessionCreateParams {
  const { customerId, userId, priceId, interval, baseUrl, holderTrial } = input;
  const trial = holderTrial
    ? {
        trial_period_days: HOLDER_TRIAL_DAYS,
        meta: { holder_trial: 'true', holder_trial_wallet: holderTrial.walletHash },
      }
    : null;
  return {
    mode: 'subscription',
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/hub/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/hub/premium?billing=cancel`,
    ...premiumConsentAndRecoveryParams(),
    ...(trial ? { payment_method_collection: 'always' as const } : {}),
    custom_text: {
      submit: {
        message: trial ? `${HOLDER_TRIAL_SUBMIT_MESSAGE} ${LEGAL_SUBMIT_MESSAGE}` : LEGAL_SUBMIT_MESSAGE,
      },
    },
    subscription_data: {
      ...(trial ? { trial_period_days: trial.trial_period_days } : {}),
      metadata: {
        supabase_user_id: userId,
        app: 'salvazion',
        interval,
        ...(trial ? trial.meta : {}),
      },
    },
    metadata: {
      supabase_user_id: userId,
      app: 'salvazion',
      interval,
      price_id: priceId,
      ...(trial ? trial.meta : {}),
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
