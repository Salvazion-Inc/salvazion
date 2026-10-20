import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/billing/subscription';
import { emptyEntitlement, toPublicEntitlement } from '@/lib/billing/types';
import { billingLog } from '@/lib/billing/redact';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const res = NextResponse.json(toPublicEntitlement(emptyEntitlement(), false));
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
    const ent = await getEntitlementForUser(user.id, user.email);
    const res = NextResponse.json(toPublicEntitlement(ent, true));
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (e) {
    billingLog('billing/status', e);
    return NextResponse.json({ error: 'status_failed' }, { status: 500 });
  }
}
