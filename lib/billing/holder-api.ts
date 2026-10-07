/** Shared guards for /api/wallet/holder/* and /api/events (server only). */
import type { NextRequest } from 'next/server';
import type { HolderLang } from '@/lib/solana/holder-proof';

/** HMAC key for challenge tokens. Dedicated secret preferred; service key as fallback. */
export function holderSecret(): string | null {
  return process.env.HOLDER_VERIFY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

/** Host the user is on (bound into the signed message). */
export function requestHost(req: NextRequest): string {
  return (req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host)
    .split(',')[0]
    .trim()
    .toLowerCase();
}

/**
 * CSRF: cookie-authenticated mutations must come from this same host
 * (works on salvazion.org and on Vercel preview hosts alike).
 */
export function isSameOrigin(req: NextRequest): boolean {
  const host = requestHost(req);
  const raw = req.headers.get('origin') || req.headers.get('referer');
  if (!raw) return false;
  try {
    return new URL(raw).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

export function parseLang(v: unknown): HolderLang {
  return v === 'en' || v === 'pt' ? v : 'es';
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
