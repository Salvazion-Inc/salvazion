import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe';
import { type BillingInterval } from '@/lib/billing/plans';
import { BLOCKED_CHECKOUT_PRICE_IDS } from '@/lib/billing/price-ids';
import { resolveCheckoutPriceId } from '@/lib/billing/resolve-price';
import {
  loginUrlForCheckout,
  parseBillingInterval,
  signupUrlForCheckout,
} from '@/lib/billing/checkout-intent';
import { getAppBaseUrl } from '@/lib/config/site';
import { getEntitlementForUser, upsertSubscriptionRow } from '@/lib/billing/subscription';
import {
  CHECKOUT_RATE,
  consumeRateLimit,
  isAllowedBillingOrigin,
} from '@/lib/billing/request-guard';
import { billingLog } from '@/lib/billing/redact';
import { buildHubCheckoutParams } from '@/lib/billing/checkout-params';
import {
  checkHolderTrial,
  expireOpenHolderTrialSessions,
} from '@/lib/billing/holder-trial-server';
import { logProductEvent } from '@/lib/analytics/product-events';

export const runtime = 'nodejs';

function intervalFromRequest(
  req: NextRequest,
  body: { interval?: unknown }
): BillingInterval {
  const fromQuery = parseBillingInterval(req.nextUrl.searchParams.get('interval'));
  if (fromQuery) return fromQuery;
  return body.interval === 'year' ? 'year' : 'month';
}

function authRequiredResponse(interval: BillingInterval) {
  return NextResponse.json(
    {
      error: 'auth_required',
      code: 'auth_required',
      signupUrl: signupUrlForCheckout(interval),
      loginUrl: loginUrlForCheckout(interval),
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

  // $SALVAZION holder access (DEC-20261011-27): server-side check at creation
  // time; any doubt → no trial, normal full-price checkout.
  const trial = await checkHolderTrial(stripe, user.id, customerId);
  const holderTrial = trial.eligible && trial.walletHash ? { walletHash: trial.walletHash } : null;
  if (holderTrial) await expireOpenHolderTrialSessions(stripe, customerId);

  const session = await stripe.checkout.sessions.create(
    buildHubCheckoutParams({
      customerId,
      userId: user.id,
      priceId,
      interval,
      baseUrl: base,
      holderTrial,
    })
  );
  if (holderTrial) {
    await logProductEvent('holder_trial_checkout', user.id, {
      wallet_hash: holderTrial.walletHash,
      interval,
      usd_value: trial.usdValue,
      session_id: session.id,
    });
  }
  return session;
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

    if (req.method === 'POST' && !isAllowedBillingOrigin(req, 'POST')) {
      return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });
    }

    const interval = intervalFromRequest(req, body);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return authRequiredResponse(interval);
    }
    if (!user.email_confirmed_at && !user.confirmed_at) {
      return NextResponse.json({ error: 'email_unverified' }, { status: 403 });
    }

    if (
      !consumeRateLimit(
        `checkout:${user.id}`,
        CHECKOUT_RATE.limit,
        CHECKOUT_RATE.windowMs
      )
    ) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Wait a few minutes.' },
        { status: 429 }
      );
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
    billingLog('billing/checkout', message);
    return NextResponse.json({ error: 'Checkout error' }, { status: 500 });
  }
}
