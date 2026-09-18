import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/billing/subscription';
import {
  emptyPublicEntitlement,
  toPublicEntitlement,
} from '@/lib/billing/types';
import { billingLog } from '@/lib/billing/redact';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(emptyPublicEntitlement(), { status: 200 });
    }
    const ent = await getEntitlementForUser(user.id, user.email);
    return NextResponse.json(toPublicEntitlement(ent, true));
  } catch (e) {
    billingLog('billing/status', e);
    return NextResponse.json(emptyPublicEntitlement());
  }
}
