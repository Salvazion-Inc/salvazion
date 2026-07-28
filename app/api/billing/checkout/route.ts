import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe';
import { priceIdForInterval, type BillingInterval } from '@/lib/billing/plans';
import { getAppBaseUrl } from '@/lib/config/site';
import { getEntitlementForUser, upsertSubscriptionRow } from '@/lib/billing/subscription';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured (STRIPE_SECRET_KEY).' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const interval: BillingInterval =
      body.interval === 'year' ? 'year' : 'month';
    const priceId = priceIdForInterval(interval);

    const stripe = getStripe();
    const base = getAppBaseUrl();
    const ent = await getEntitlementForUser(user.id, user.email);

    let customerId = ent.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
        metadata: {
          supabase_user_id: user.id,
          app: 'salvazion',
        },
      });
      customerId = customer.id;
      await upsertSubscriptionRow(user.id, {
        customerId,
        status: 'none',
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/hub/profile?billing=success`,
      cancel_url: `${base}/hub/premium?billing=cancel`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          app: 'salvazion',
        },
      },
      metadata: {
        supabase_user_id: user.id,
        app: 'salvazion',
        interval,
      },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Checkout error';
    console.error('[billing/checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
