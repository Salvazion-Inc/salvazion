import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/billing/subscription';
import { toPublicEntitlement } from '@/lib/billing/types';
import { billingLog } from '@/lib/billing/redact';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    }
    if (!user.email_confirmed_at && !user.confirmed_at) {
      return NextResponse.json({ error: 'email_unverified' }, { status: 403 });
    }
    const ent = await getEntitlementForUser(user.id, user.email);
    return NextResponse.json(toPublicEntitlement(ent, true));
  } catch (e) {
    billingLog('billing/status', e);
    return NextResponse.json({ error: 'status_failed' }, { status: 500 });
  }
}
