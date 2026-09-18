import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe';
import { getEntitlementForUser } from '@/lib/billing/subscription';
import { getAppBaseUrl } from '@/lib/config/site';
import {
  PORTAL_RATE,
  consumeRateLimit,
  isAllowedBillingOrigin,
} from '@/lib/billing/request-guard';
import { billingLog } from '@/lib/billing/redact';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isAllowedBillingOrigin(req, 'POST')) {
      return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured.' },
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

    if (
      !consumeRateLimit(
        `portal:${user.id}`,
        PORTAL_RATE.limit,
        PORTAL_RATE.windowMs
      )
    ) {
      return NextResponse.json(
        { error: 'Too many portal attempts. Wait a few minutes.' },
        { status: 429 }
      );
    }

    const ent = await getEntitlementForUser(user.id, user.email);
    if (!ent.customerId) {
      return NextResponse.json(
        { error: 'No billing customer yet. Subscribe first.' },
        { status: 400 }
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: ent.customerId,
      return_url: `${getAppBaseUrl()}/hub/profile?billing=portal`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    billingLog('billing/portal', e);
    return NextResponse.json({ error: 'Portal error' }, { status: 500 });
  }
}
