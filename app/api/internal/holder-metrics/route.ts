import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkMetricsAuth } from '@/lib/analytics/metrics-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENTS = ['bono_activado', 'upgrade_click'] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

/**
 * Read-only AGGREGATE metrics for the verify-holdings funnel.
 * Auth: `Authorization: Bearer <METRICS_READ_TOKEN>`. No session.
 * Returns counts only — never user ids, emails, wallets or per-user rows.
 * Rows tagged as tests (props->>'test' not null) are excluded.
 */
export async function GET(req: NextRequest) {
  const auth = checkMetricsAuth(req.headers.get('authorization'), process.env.METRICS_READ_TOKEN);
  if (auth === 'not_configured') return json({ error: 'not_configured' }, 503);
  if (auth !== 'ok') return json({ error: 'unauthorized' }, 401);

  const admin = createAdminClient();
  if (!admin) return json({ error: 'not_configured' }, 503);

  const now = Date.now();
  const since24h = new Date(now - DAY_MS).toISOString();
  const since7d = new Date(now - 7 * DAY_MS).toISOString();

  const countEvent = async (event: string, since?: string): Promise<number> => {
    let q = admin
      .from('product_events')
      .select('id', { count: 'exact', head: true })
      .eq('event', event)
      .is('props->>test', null);
    if (since) q = q.gte('created_at', since);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  };

  try {
    const [eventCounts, activeBonus] = await Promise.all([
      Promise.all(
        EVENTS.map(async (event) => {
          const [last_24h, last_7d, total] = await Promise.all([
            countEvent(event, since24h),
            countEvent(event, since7d),
            countEvent(event),
          ]);
          return [event, { last_24h, last_7d, total }] as const;
        })
      ),
      (async () => {
        const { count, error } = await admin
          .from('wallet_holder_links')
          .select('user_id', { count: 'exact', head: true })
          .eq('bonus_active', true);
        if (error) throw new Error(error.message);
        return count ?? 0;
      })(),
    ]);

    return json({
      generated_at: new Date(now).toISOString(),
      events: Object.fromEntries(eventCounts),
      wallet_links_bonus_active: activeBonus,
    });
  } catch (e) {
    console.warn('[internal/holder-metrics]', e instanceof Error ? e.message : e);
    return json({ error: 'unavailable' }, 500);
  }
}
