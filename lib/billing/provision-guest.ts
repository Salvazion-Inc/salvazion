import type Stripe from 'stripe';
import { getStripe } from './stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncSubscriptionFromStripe } from './subscription';
import { GUEST_CHECKOUT_FLOW, SALVAZION_APP } from './guest-checkout';
import { billingLog } from './redact';

export type ProvisionResult =
  | { ok: true; userId: string; email: string; created: boolean }
  | { ok: false; reason: string };

export function isGuestSalvazionSession(session: Stripe.Checkout.Session): boolean {
  return (
    session.mode === 'subscription' &&
    !session.client_reference_id &&
    session.metadata?.app === SALVAZION_APP &&
    session.metadata?.flow === GUEST_CHECKOUT_FLOW
  );
}

function sessionEmail(session: Stripe.Checkout.Session): string | null {
  const raw = session.customer_details?.email || session.customer_email || null;
  const email = raw?.trim().toLowerCase();
  return email && email.includes('@') ? email : null;
}

/**
 * Find or create the Supabase user for a paid guest Checkout, then link the
 * Stripe customer + subscription to it. Idempotent: safe to run from the
 * webhook (with retries) and from the welcome page for the same session.
 *
 * - New email → user created with email_confirm=true (they own the inbox they
 *   paid with; sign-in still requires a magic link / Google on that email).
 *   No email is sent from here; the welcome page offers the sign-in link.
 * - Existing email → reuse that account (no duplicate user).
 */
export async function provisionGuestCheckout(
  session: Stripe.Checkout.Session
): Promise<ProvisionResult> {
  if (!isGuestSalvazionSession(session)) return { ok: false, reason: 'not_guest' };
  if (session.status !== 'complete') return { ok: false, reason: 'not_complete' };

  const email = sessionEmail(session);
  if (!email) return { ok: false, reason: 'missing_email' };

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;
  if (!customerId || !subId) return { ok: false, reason: 'missing_customer_or_subscription' };

  const admin = createAdminClient();
  if (!admin) return { ok: false, reason: 'supabase_admin_not_configured' };

  const stripe = getStripe();

  // Already linked on a previous run?
  const customer = await stripe.customers.retrieve(customerId);
  let userId =
    !customer.deleted && customer.metadata?.supabase_user_id
      ? customer.metadata.supabase_user_id
      : null;
  let created = false;

  if (!userId) {
    const name = session.customer_details?.name?.trim() || undefined;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { ...(name ? { name } : {}), signup_source: 'stripe_guest_checkout' },
    });
    if (data?.user) {
      userId = data.user.id;
      created = true;
    } else {
      // Email already registered → resolve the existing user id.
      // generateLink returns the user and does NOT send an email.
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });
      if (link?.user) {
        userId = link.user.id;
      } else {
        billingLog('billing/provision-guest', error || linkErr || 'user lookup failed');
        return { ok: false, reason: 'user_lookup_failed' };
      }
    }
  }

  await stripe.customers.update(customerId, {
    metadata: { supabase_user_id: userId, app: SALVAZION_APP },
  });
  const sub = await stripe.subscriptions.retrieve(subId);
  if (sub.metadata?.supabase_user_id !== userId) {
    await stripe.subscriptions.update(subId, {
      metadata: { ...sub.metadata, supabase_user_id: userId },
    });
  }
  sub.metadata = { ...sub.metadata, supabase_user_id: userId };
  await syncSubscriptionFromStripe(sub);

  return { ok: true, userId, email, created };
}
