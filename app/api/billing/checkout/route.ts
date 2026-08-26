import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe';
import {
  BLOCKED_CHECKOUT_PRICE_IDS,
  type BillingInterval,
} from '@/lib/billing/plans';
import { resolveCheckoutPriceId } from '@/lib/billing/resolve-price';
import {
  loginUrlForCheckout,
  parseBillingInterval,
  signupUrlForCheckout,
} from '@/lib/billing/checkout-intent';
import { getAppBaseUrl } from '@/lib/config/site';
import { getEntitlementForUser, upsertSubscriptionRow } from '@/lib/billing/subscription';

export const runtime = 'nodejs';

function intervalFromRequest(
  req: NextRequest,
  body: { interval?: unknown }
): BillingInterval {
  const fromQuery = parseBillingInterval(req.nextUrl.searchParams.get('interval'));
  if (fromQuery) return fromQuery;
  return body.interval === 'year' ? 'year' : 'month';
}

function authRequiredResponse(
  req: NextRequest,
  interval: BillingInterval,
  redirect: boolean
) {
  const signupUrl = signupUrlForCheckout(interval);
  const loginUrl = loginUrlForCheckout(interval);
  if (redirect) {
    return NextResponse.redirect(new URL(signupUrl, req.nextUrl.origin));
  }
  return NextResponse.json(
    {
      error: 'auth_required',
      code: 'auth_required',
      signupUrl,
      loginUrl,
    },
    { status: 401 }
  );
}

async function createCheckoutSession(user: User, interval: BillingInterval) {
  const priceId = await resolveCheckoutPriceId(interval);
  if (BLOCKED_CHECKOUT_PRICE_IDS.has(priceId)) {
    throw new Error(`Refusing legacy $20 price ${priceId} for Checkout.`);
  }

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

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/hub/profile?billing=success`,
    cancel_url: `${base}/hub/premium?billing=cancel`,
    allow_promotion_codes: true,
    custom_text: {
      submit: {
        message:
          'By confirming you agree to Salvazion [Terms of Service](https://salvazion.org/terms) and [Privacy Policy](https://salvazion.org/privacy).',
      },
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        app: 'salvazion',
        interval,
      },
    },
    metadata: {
      supabase_user_id: user.id,
      app: 'salvazion',
      interval,
      price_id: priceId,
    },
  });
}

export async function GET(req: NextRequest) {
  return handleCheckout(req, {}, true);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleCheckout(req, body, false);
}

async function handleCheckout(
  req: NextRequest,
  body: { interval?: unknown },
  redirect: boolean
) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured (STRIPE_SECRET_KEY).' },
        { status: 503 }
      );
    }

    const interval = intervalFromRequest(req, body);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return authRequiredResponse(req, interval, redirect);
    }

    const session = await createCheckoutSession(user, interval);
    if (!session.url) {
      throw new Error('Stripe did not return a Checkout URL.');
    }

    if (redirect) {
      return NextResponse.redirect(session.url, 303);
    }
    return NextResponse.json({ url: session.url, id: session.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Checkout error';
    console.error('[billing/checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
