import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from './stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  emptyEntitlement,
  isPremiumStatus,
  type Entitlement,
  type SubscriptionStatus,
} from './types';

export type { Entitlement, SubscriptionStatus };
export { emptyEntitlement, isPremiumStatus };

const ACTIVE: SubscriptionStatus[] = ['active', 'trialing'];

function fromRow(row: Record<string, unknown>): Entitlement {
  const status = (row.status as SubscriptionStatus) || 'none';
  const priceId = (row.price_id as string) || null;
  const billingInterval = (row.billing_interval as string) || (row.interval as string);
  return {
    // Entitlement follows verified webhook/status write, not a client flag.
    isPremium: isPremiumStatus(status),
    status,
    interval:
      billingInterval === 'year' || billingInterval === 'month'
        ? billingInterval
        : null,
    priceId,
    currentPeriodEnd: (row.current_period_end as string) || null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    customerId: (row.stripe_customer_id as string) || null,
    subscriptionId: (row.stripe_subscription_id as string) || null,
    source: 'db',
  };
}

function fromStripeSub(sub: Stripe.Subscription, customerId: string): Entitlement {
  const item = sub.items.data[0];
  const priceId = item?.price?.id || null;
  const interval =
    item?.price?.recurring?.interval === 'year'
      ? 'year'
      : item?.price?.recurring?.interval === 'month'
        ? 'month'
        : null;
  const status = sub.status as SubscriptionStatus;
  // Stripe API 2025+: period end lives on subscription items
  const periodEnd = item?.current_period_end ?? null;
  return {
    isPremium: isPremiumStatus(status),
    status,
    interval,
    priceId,
    currentPeriodEnd: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    customerId,
    subscriptionId: sub.id,
    source: 'stripe',
  };
}

export async function getEntitlementForUser(
  userId: string,
  email?: string | null
): Promise<Entitlement> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data } = await admin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        const ent = fromRow(data as Record<string, unknown>);
        if (ent.isPremium || ent.customerId) return ent;
      }
    } catch {
      // table may not exist yet
    }
  }

  if (!isStripeConfigured()) return emptyEntitlement();

  try {
    const stripe = getStripe();
    // Prefer customer by metadata user id
    const byMeta = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${userId}'`,
      limit: 1,
    });
    let customer = byMeta.data[0];
    if (!customer && email) {
      const byEmail = await stripe.customers.list({ email, limit: 1 });
      customer = byEmail.data[0];
    }
    if (!customer) return emptyEntitlement();

    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 5,
    });
    const active =
      subs.data.find((s) => ACTIVE.includes(s.status as SubscriptionStatus)) ||
      subs.data[0];
    if (!active) {
      return {
        ...emptyEntitlement(),
        customerId: customer.id,
        source: 'stripe',
      };
    }
    const ent = fromStripeSub(active, customer.id);
    // Best-effort sync to DB
    await upsertSubscriptionRow(userId, ent);
    return ent;
  } catch {
    return emptyEntitlement();
  }
}

export async function upsertSubscriptionRow(
  userId: string,
  ent: Partial<Entitlement> & { status?: string }
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    await admin.from('subscriptions').upsert(
      {
        user_id: userId,
        status: ent.status || 'none',
        price_id: ent.priceId || null,
        billing_interval: ent.interval || null,
        stripe_customer_id: ent.customerId || null,
        stripe_subscription_id: ent.subscriptionId || null,
        current_period_end: ent.currentPeriodEnd || null,
        cancel_at_period_end: ent.cancelAtPeriodEnd ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch {
    // ignore if schema not applied
  }
}

export async function findUserIdForCustomer(
  customerId: string
): Promise<string | null> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      if (data?.user_id) return data.user_id as string;
    } catch {
      // ignore
    }
  }
  if (!isStripeConfigured()) return null;
  try {
    const customer = await getStripe().customers.retrieve(customerId);
    if (customer.deleted) return null;
    const uid = customer.metadata?.supabase_user_id;
    return uid || null;
  } catch {
    return null;
  }
}

export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
  const userId =
    subscription.metadata?.supabase_user_id ||
    (await findUserIdForCustomer(customerId));
  if (!userId) return;
  const ent = fromStripeSub(subscription, customerId);
  await upsertSubscriptionRow(userId, ent);
}
