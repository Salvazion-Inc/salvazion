import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/billing/subscription';
import { toPublicEntitlement } from '@/lib/billing/types';
import { billingLog } from '@/lib/billing/redact';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // ?soft=1: anonymous probe from public pages. 204 keeps the same client
      // behaviour as 401 without logging a console error (Lighthouse BP).
      if (new URL(req.url).searchParams.get('soft') === '1') {
        return new NextResponse(null, { status: 204 });
      }
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
