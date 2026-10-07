import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/billing/ai-usage';
import { isSameOrigin, readJson } from '@/lib/billing/holder-api';
import { consumeRateLimit } from '@/lib/billing/request-guard';
import { logProductEvent } from '@/lib/analytics/product-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Client-reported events. Only `upgrade_click` is accepted from the browser. */
const CLIENT_EVENTS = new Set(['upgrade_click']);

function cleanProps(raw: unknown): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 8)) {
    if (!/^[a-z_]{1,32}$/.test(k)) continue;
    if (typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) out[k] = v;
    else if (typeof v === 'string') out[k] = v.slice(0, 64);
  }
  return out;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  const body = await readJson(req);
  if (typeof body.event !== 'string' || !CLIENT_EVENTS.has(body.event)) {
    return NextResponse.json({ error: 'unknown_event' }, { status: 400 });
  }
  if (!consumeRateLimit(`events:${user.id}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  await logProductEvent('upgrade_click', user.id, cleanProps(body.props), req.headers);
  return NextResponse.json({ ok: true });
}
