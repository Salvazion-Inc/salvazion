import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isBusinessAdminEmail, BUSINESS_ADMIN_EMAIL } from '@/lib/business/access';
import { computeBusinessKpis } from '@/lib/business/kpis';
import { clearXMetricsCache } from '@/lib/business/x-metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Salvazion Inc. business KPIs — restricted to info@salvazion.org.
 * Near real-time: no HTTP cache; optional ?fresh=1 busts X metrics cache.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (!isBusinessAdminEmail(user.email)) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: `Business console is only for ${BUSINESS_ADMIN_EMAIL}`,
        },
        { status: 403 }
      );
    }

    const fresh =
      req.nextUrl.searchParams.get('fresh') === '1' ||
      req.nextUrl.searchParams.get('force') === '1';
    if (fresh) clearXMetricsCache();

    const kpis = await computeBusinessKpis({ forceX: fresh });
    return NextResponse.json(
      {
        ok: true,
        admin: user.email,
        kpis,
        serverTime: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (e) {
    console.error('[business/kpis]', e);
    return NextResponse.json(
      {
        error: 'kpis_failed',
        message: e instanceof Error ? e.message : 'failed',
      },
      { status: 500 }
    );
  }
}
