import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  emptyEntitlement,
  getEntitlementForUser,
} from '@/lib/billing/subscription';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(emptyEntitlement(), { status: 200 });
    }
    const ent = await getEntitlementForUser(user.id, user.email);
    return NextResponse.json(ent);
  } catch (e) {
    console.error('[billing/status]', e);
    return NextResponse.json(emptyEntitlement());
  }
}
