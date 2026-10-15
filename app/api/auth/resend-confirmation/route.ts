import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { safeNextPath } from '@/lib/auth/paths';
import { consumeRateLimit } from '@/lib/billing/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GENERIC = {
  ok: true,
  message: 'If an account is waiting for confirmation, we sent another link.',
} as const;

function clientAddress(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function isEmailShape(value: string): boolean {
  if (value.length < 3 || value.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Public confirmation resend. The body is the same whether or not the
 * address belongs to an account. Rate limits do not name the address.
 */
function sameDeployment(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameDeployment(req)) {
    return NextResponse.json(GENERIC, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }

  let body: { email?: unknown; next?: unknown } = {};
  try {
    body = (await req.json()) as { email?: unknown; next?: unknown };
  } catch {
    body = {};
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isEmailShape(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const ip = clientAddress(req);
  const windowMs = 15 * 60 * 1000;
  const ipOk = consumeRateLimit(`resend-ip:${ip}`, 8, windowMs);
  const emailOk = consumeRateLimit(`resend-email:${email}`, 3, windowMs);
  if (!ipOk || !emailOk) {
    return NextResponse.json(
      { ok: true, limited: true },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const next = safeNextPath(typeof body.next === 'string' ? body.next : null, '/hub/dashboard');
    const origin = req.nextUrl.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectTo },
      });
    } catch {
      /* generic response either way */
    }
  }

  return NextResponse.json(GENERIC, { headers: { 'Cache-Control': 'no-store' } });
}
