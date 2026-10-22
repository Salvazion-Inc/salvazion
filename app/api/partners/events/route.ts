import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/billing/ai-usage';
import { isSameOrigin, readJson } from '@/lib/billing/holder-api';
import { consumeRateLimit } from '@/lib/billing/request-guard';
import { logProductEvent } from '@/lib/analytics/product-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Partner (church/pastor) funnel events. Reuses `product_events` (no migration).
 * view/start/submit may be anonymous; `partner_verified` requires a confirmed email.
 * Props are whitelisted: no PII (no name/email/church), only crm_id, role, lang, utm_*.
 */
const ANON = new Set(['partner_view', 'partner_start', 'partner_submit']);
const KEYS = new Set(['crm_id', 'role', 'lang', 'prefilled', 'utm_source', 'utm_medium', 'utm_campaign']);

function clean(raw: unknown): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!KEYS.has(k)) continue;
    if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string') out[k] = v.slice(0, 64);
  }
  return out;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await readJson(req);
  const event = body.event;
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim();
  if (!consumeRateLimit(`partner-events:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const user = await getRequestUser();
  if (event === 'partner_verified') {
    if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    if (!user.emailConfirmedAt) return NextResponse.json({ error: 'email_unverified' }, { status: 403 });
    await logProductEvent('partner_verified', user.id, clean(body.props), req.headers);
    return NextResponse.json({ ok: true });
  }
  if (typeof event !== 'string' || !ANON.has(event)) {
    return NextResponse.json({ error: 'unknown_event' }, { status: 400 });
  }
  await logProductEvent(
    event as 'partner_view' | 'partner_start' | 'partner_submit',
    user?.id ?? null,
    clean(body.props),
    req.headers
  );
  return NextResponse.json({ ok: true });
}
