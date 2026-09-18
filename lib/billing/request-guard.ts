import type { NextRequest } from 'next/server';
import { APP_ALLOWED_HOSTS, getAppBaseUrl } from '@/lib/config/site';

const buckets = new Map<string, { count: number; resetAt: number }>();

function allowedHost(hostname: string): boolean {
  if ((APP_ALLOWED_HOSTS as readonly string[]).includes(hostname)) return true;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  try {
    return hostname === new URL(getAppBaseUrl()).hostname;
  } catch {
    return false;
  }
}

/**
 * CSRF-safe origin check for billing mutations (cookie session).
 * POST from the app always sends Origin. GET (top-level redirect) may omit it.
 */
export function isAllowedBillingOrigin(
  req: NextRequest,
  method: string
): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const candidates = [origin, referer].filter(
    (v): v is string => Boolean(v)
  );

  if (candidates.length === 0) {
    return method === 'GET';
  }

  for (const raw of candidates) {
    try {
      const url = new URL(raw);
      if (allowedHost(url.hostname)) return true;
    } catch {
      // ignore malformed
    }
  }
  return false;
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

/** Checkout session creation: 6 / 10 minutes per user. */
export const CHECKOUT_RATE = { limit: 6, windowMs: 10 * 60 * 1000 } as const;
/** Portal session creation: 10 / 10 minutes per user. */
export const PORTAL_RATE = { limit: 10, windowMs: 10 * 60 * 1000 } as const;
