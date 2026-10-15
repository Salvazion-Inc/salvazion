import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured } from '@/lib/billing/stripe';
import {
  parseBillingInterval,
  premiumCheckoutPath,
  signupUrlForCheckout,
} from '@/lib/billing/checkout-intent';
import { isSmokeRequestAllowed, runCheckoutSmoke } from '@/lib/billing/guest-checkout';
import { billingLog } from '@/lib/billing/redact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hasSupabaseSessionCookie(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));
}

function noStore(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

/**
 * /premium/checkout?plan=month|year
 * New Checkout Sessions require an account. Logged-out visitors go to signup.
 * Signed-in visitors continue in /hub/premium.
 * `?e2e=1` stays the smoke path (token / preview), and HEAD never creates a session.
 */
export async function GET(req: NextRequest) {
  const interval =
    parseBillingInterval(req.nextUrl.searchParams.get('plan')) ||
    parseBillingInterval(req.nextUrl.searchParams.get('checkout')) ||
    'month';

  // Post-deploy smoke: create + immediately expire an e2e-tagged session.
  if (req.nextUrl.searchParams.get('e2e') === '1') {
    if (!isSmokeRequestAllowed(req.headers.get('x-salvazion-smoke'))) {
      return noStore(NextResponse.json({ error: 'forbidden' }, { status: 403 }));
    }
    if (!isStripeConfigured()) {
      return noStore(NextResponse.json({ ok: false, error: 'stripe_not_configured' }, { status: 500 }));
    }
    try {
      const r = await runCheckoutSmoke(interval);
      return noStore(NextResponse.json(r, { status: r.ok ? 200 : 500 }));
    } catch (e) {
      billingLog('premium/checkout smoke', e);
      const message = e instanceof Error ? e.message : String(e);
      return noStore(NextResponse.json({ ok: false, error: message }, { status: 500 }));
    }
  }

  if (hasSupabaseSessionCookie(req)) {
    return noStore(NextResponse.redirect(new URL(premiumCheckoutPath(interval), req.nextUrl.origin)));
  }

  return noStore(NextResponse.redirect(new URL(signupUrlForCheckout(interval), req.nextUrl.origin)));
}

/** HEAD (link checks, curl -I) must never create a Checkout Session. */
export async function HEAD() {
  return noStore(new NextResponse(null, { status: 200 }));
}
