import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe';
import { getEntitlementForUser } from '@/lib/billing/subscription';
import { getAppBaseUrl } from '@/lib/config/site';

export const runtime = 'nodejs';

export async function POST() {
  try {
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

    const ent = await getEntitlementForUser(user.id, user.email);
    if (!ent.customerId) {
      return NextResponse.json(
        { error: 'No billing customer yet. Subscribe first.' },
        { status: 400 }
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: ent.customerId,
      return_url: `${getAppBaseUrl()}/hub/profile`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Portal error';
    console.error('[billing/portal]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
