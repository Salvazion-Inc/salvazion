import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/billing/ai-usage';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe';
import { getEntitlementForUser } from '@/lib/billing/subscription';
import { consumeRateLimit } from '@/lib/billing/request-guard';
import { checkHolderTrial } from '@/lib/billing/holder-trial-server';
import { holderTrialConfig, publicTrialState, HOLDER_TRIAL_DAYS } from '@/lib/billing/holder-trial';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Read-only status for the /hub/profile line ($SALVAZION holder access,
 * DEC-20261011-27). Informational only: the real check runs again at
 * checkout creation. Returns no wallet, balance or USD value.
 */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  const base = { minUsd: holderTrialConfig().minUsd, days: HOLDER_TRIAL_DAYS };
  if (!consumeRateLimit(`holder-trial:${user.id}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ ...base, state: 'unavailable' });
  }
  try {
    const stripe = isStripeConfigured() ? getStripe() : null;
    const ent = await getEntitlementForUser(user.id, user.email);
    if (ent.isPremium) return NextResponse.json({ ...base, state: 'none' });
    const d = await checkHolderTrial(stripe, user.id, ent.customerId);
    return NextResponse.json({ ...base, state: publicTrialState(d) });
  } catch {
    return NextResponse.json({ ...base, state: 'unavailable' });
  }
}
