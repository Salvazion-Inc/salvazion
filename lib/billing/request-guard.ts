import type { NextRequest } from 'next/server';
import { APP_ALLOWED_HOSTS, getAppBaseUrl } from '@/lib/config/site';

/** Team-scoped Vercel preview hosts, e.g. salvazion-abc123-salvazion.vercel.app */
const PREVIEW_ORIGIN_RE = /^https:\/\/salvazion-[a-z0-9-]+-salvazion\.vercel\.app$/;

/** Only when VERCEL_ENV === 'preview'; production behaviour is unchanged. */
export function isAllowedPreviewOrigin(
  url: URL,
  vercelEnv: string | undefined = process.env.VERCEL_ENV
): boolean {
  if (vercelEnv !== 'preview') return false;
  return PREVIEW_ORIGIN_RE.test(url.origin);
}

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
      if (isAllowedPreviewOrigin(url)) return true;
    } catch {
      // ignore malformed
    }
  }
  return false;
}

/**
 * Base URL for Stripe success_url / cancel_url (DEC-20261021-06): the first
 * Origin/Referer that passes the same allowlist as isAllowedBillingOrigin,
 * so a preview returns to its own host and production to salvazion.org.
 * Anything else (no header, disallowed, malformed) falls back to `fallback`.
 */
export function checkoutBaseUrlFromHeaders(
  origin: string | null,
  referer: string | null,
  fallback: string,
  vercelEnv: string | undefined = process.env.VERCEL_ENV
): string {
  for (const raw of [origin, referer]) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
      if (allowedHost(url.hostname) || isAllowedPreviewOrigin(url, vercelEnv)) {
        return url.origin;
      }
    } catch {
      // ignore malformed
    }
  }
  return fallback.replace(/\/$/, '');
}

export function checkoutBaseUrl(req: NextRequest, fallback: string): string {
  return checkoutBaseUrlFromHeaders(
    req.headers.get('origin'),
    req.headers.get('referer'),
    fallback
  );
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
