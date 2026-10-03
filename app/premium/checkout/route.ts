import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured } from '@/lib/billing/stripe';
import { parseBillingInterval, premiumCheckoutPath } from '@/lib/billing/checkout-intent';
import { createGuestCheckoutSession, isLikelyBot } from '@/lib/billing/guest-checkout';
import { consumeRateLimit } from '@/lib/billing/request-guard';
import { billingLog } from '@/lib/billing/redact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 20 guest Checkout Sessions / 10 min per IP (best-effort, per instance). */
const GUEST_RATE = { limit: 20, windowMs: 10 * 60 * 1000 } as const;

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
 * Public one-click Premium checkout: /premium/checkout?plan=month|year
 * Logged-out → Stripe Checkout directly (account provisioned after payment).
 * Signed-in → existing /hub/premium flow (checks "already Premium" first).
 */
export async function GET(req: NextRequest) {
  const interval =
    parseBillingInterval(req.nextUrl.searchParams.get('plan')) ||
    parseBillingInterval(req.nextUrl.searchParams.get('checkout')) ||
    'month';

  if (hasSupabaseSessionCookie(req)) {
    return noStore(NextResponse.redirect(new URL(premiumCheckoutPath(interval), req.nextUrl.origin)));
  }

  if (isLikelyBot(req.headers.get('user-agent'))) {
    return noStore(NextResponse.redirect(new URL('/#pricing', req.nextUrl.origin)));
  }

  if (!isStripeConfigured()) {
    return noStore(NextResponse.redirect(new URL(premiumCheckoutPath(interval), req.nextUrl.origin)));
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  if (!consumeRateLimit(`guest-checkout:${ip}`, GUEST_RATE.limit, GUEST_RATE.windowMs)) {
    return noStore(
      NextResponse.json({ error: 'Too many checkout attempts. Wait a few minutes.' }, { status: 429 })
    );
  }

  try {
    const session = await createGuestCheckoutSession(interval);
    if (!session.url) throw new Error('Stripe did not return a Checkout URL.');
    return noStore(NextResponse.redirect(session.url, 303));
  } catch (e) {
    billingLog('premium/checkout', e);
    // Fall back to the account-first flow rather than a dead end.
    return noStore(NextResponse.redirect(new URL(premiumCheckoutPath(interval), req.nextUrl.origin)));
  }
}

/** HEAD (link checks, curl -I) must never create a Checkout Session. */
export async function HEAD() {
  return noStore(new NextResponse(null, { status: 200 }));
}
