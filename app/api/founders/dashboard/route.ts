import { NextResponse } from 'next/server';
import { isFounderEmail } from '@/lib/founders/access';
import { loadLiveDashboard } from '@/lib/founders/live';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRIVATE = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401, headers: PRIVATE });
    }
    if (!user.email_confirmed_at && !user.confirmed_at) {
      return NextResponse.json({ error: 'email_unverified' }, { status: 403, headers: PRIVATE });
    }
    if (!isFounderEmail(user.email)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: PRIVATE });
    }

    const dashboard = await loadLiveDashboard();
    return NextResponse.json(dashboard, { headers: PRIVATE });
  } catch (error) {
    console.error('[founders/dashboard]', error);
    return NextResponse.json({ error: 'dashboard_failed' }, { status: 500, headers: PRIVATE });
  }
}
