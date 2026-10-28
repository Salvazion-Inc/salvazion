/**
 * Who may use Salvazion.
 * A session is not enough: the email must be verified (`email_confirmed_at`).
 * Anonymous product use is closed. This module is the decision table the
 * proxy and the route handlers share.
 */

import { safeNextPath } from '@/lib/auth/paths';

export type ServiceUser = {
  id: string;
  /** Null when the session has no address (for example Continue with X). */
  email?: string | null;
  emailConfirmedAt?: string | null;
};

export type AccessDecision =
  | { action: 'allow' }
  | { action: 'redirect'; location: string }
  | { action: 'unauthorized' }
  | { action: 'unverified' };

const OPEN_PAGES = new Set(['/', '/privacy', '/terms']);

/** Liveness probes only. `/api/health/vision` is the AI vision service. */
const OPEN_HEALTH = new Set(['/api/health', '/api/healthz', '/healthz']);

export function isEmailVerified(
  user:
    | {
        email_confirmed_at?: string | null;
        confirmed_at?: string | null;
        emailConfirmedAt?: string | null;
      }
    | null
    | undefined
): boolean {
  if (!user) return false;
  return Boolean(user.email_confirmed_at || user.confirmed_at || user.emailConfirmedAt);
}

/** A usable account has a confirmed timestamp and a real email address. */
export function canUseService(user: ServiceUser | null): boolean {
  if (!isEmailVerified(user)) return false;
  const email = user?.email?.trim() ?? '';
  return email.includes('@');
}

function isWebhookRoute(pathname: string): boolean {
  return /\/webhook$/.test(pathname);
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname || '/';
}

function searchParams(search: string): URLSearchParams {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  params.delete('_rsc');
  return params;
}

function checkoutInterval(params: URLSearchParams): 'month' | 'year' {
  const raw = params.get('plan') || params.get('checkout') || params.get('interval');
  return raw === 'year' ? 'year' : 'month';
}

/** Where to send someone after they sign up or verify. */
export function serviceReturnPath(pathname: string, search: string): string {
  const path = normalizePath(pathname);
  const params = searchParams(search);
  if (path === '/premium/checkout' || path === '/premium/welcome') {
    return `/hub/premium?checkout=${checkoutInterval(params)}`;
  }
  const q = params.toString();
  const safe = safeNextPath(`${path}${q ? `?${q}` : ''}`, '/hub/dashboard');
  if (
    safe.startsWith('/auth/verify-email') ||
    safe.startsWith('/auth/login') ||
    safe.startsWith('/auth/signup')
  ) {
    return '/hub/dashboard';
  }
  return safe;
}

function signupLocation(pathname: string, search: string): string {
  const next = serviceReturnPath(pathname, search);
  return `/auth/signup?next=${encodeURIComponent(next)}`;
}

function verifyLocation(pathname: string, search: string): string {
  const next = serviceReturnPath(pathname, search);
  return `/auth/verify-email?next=${encodeURIComponent(next)}`;
}

function verifyLocationForNext(search: string): string {
  const requested = searchParams(search).get('next');
  const dest = requested ? safeNextPath(requested, '/hub/dashboard') : '/hub/dashboard';
  const cleaned =
    dest.startsWith('/auth/verify-email') ||
    dest.startsWith('/auth/login') ||
    dest.startsWith('/auth/signup')
      ? '/hub/dashboard'
      : dest;
  return `/auth/verify-email?next=${encodeURIComponent(cleaned)}`;
}

function isWearableCallback(pathname: string): boolean {
  return /^\/api\/wearables\/oauth\/[^/]+\/callback$/.test(pathname);
}

function isAuthCallback(pathname: string): boolean {
  return (
    pathname === '/auth/callback' ||
    pathname.startsWith('/auth/callback/') ||
    pathname === '/auth/confirm' ||
    pathname.startsWith('/auth/confirm/')
  );
}

/**
 * Open on purpose:
 * home, /privacy, /terms, auth pages and callbacks, every /webhook route,
 * the public confirmation resend, liveness probes, the smoke checkout (`?e2e=1`), HEAD on /premium/checkout
 * (must not create a Checkout Session), the Stripe success return
 * /premium/welcome (finishes an already-paid session; does not open the hub),
 * and the internal metrics read (its own bearer token, no user rows).
 */
export function decideServiceAccess(input: {
  pathname: string;
  method?: string;
  search?: string;
  user: ServiceUser | null;
}): AccessDecision {
  const pathname = normalizePath(input.pathname);
  const method = (input.method || 'GET').toUpperCase();
  const search = input.search || '';
  const params = searchParams(search);
  const user = input.user;
  const verified = canUseService(user);
  const api = pathname.startsWith('/api/');

  if (OPEN_PAGES.has(pathname) || OPEN_HEALTH.has(pathname)) return { action: 'allow' };
  if (isWebhookRoute(pathname)) return { action: 'allow' };
  if (pathname === '/api/auth/resend-confirmation') return { action: 'allow' };
  // Partner funnel events (DEC-20261022-02): anon view/start/submit; the route
  // enforces same-origin, rate limit, whitelist and partner_verified auth itself.
  if (pathname === '/api/partners/events') return { action: 'allow' };
  if (pathname === '/api/internal/holder-metrics') return { action: 'allow' };
  // Anonymous plan probe from public pages (DEC-20261028-26): only GET with
  // soft=1 and no session. The route answers 204 with no data; signed-in or
  // other requests keep the normal gate.
  if (
    pathname === '/api/billing/status' &&
    method === 'GET' &&
    params.get('soft') === '1' &&
    !user
  ) {
    return { action: 'allow' };
  }

  // Stripe return for a Checkout that already happened. The page provisions
  // (idempotent) and asks the person to sign in. It does not open the hub.
  if (pathname === '/premium/welcome') return { action: 'allow' };

  if (pathname === '/premium/checkout') {
    if (method === 'HEAD') return { action: 'allow' };
    if (params.get('e2e') === '1') return { action: 'allow' };
    if (!user) return { action: 'redirect', location: signupLocation(pathname, search) };
    if (!verified) return { action: 'redirect', location: verifyLocation(pathname, search) };
    return { action: 'allow' };
  }

  if (pathname === '/auth/verify-email') {
    if (verified) {
      const dest = safeNextPath(params.get('next'), '/hub/dashboard');
      const cleaned =
        dest.startsWith('/auth/') ? '/hub/dashboard' : dest;
      return { action: 'redirect', location: cleaned };
    }
    // No session: public resend form. Session without a verified email: stay.
    return { action: 'allow' };
  }

  if (pathname === '/auth/login' || pathname === '/auth/signup') {
    if (user && verified) {
      return {
        action: 'redirect',
        location: safeNextPath(params.get('next'), '/hub/dashboard'),
      };
    }
    if (user && !verified) {
      return { action: 'redirect', location: verifyLocationForNext(search) };
    }
    return { action: 'allow' };
  }

  if (pathname === '/auth/update-password') {
    if (!user) return { action: 'redirect', location: '/auth/login?error=session_missing' };
    return { action: 'allow' };
  }

  if (isAuthCallback(pathname) || pathname.startsWith('/auth/')) return { action: 'allow' };

  if (isWearableCallback(pathname) && (method === 'GET' || method === 'HEAD')) {
    const back = '/hub/profile?settings=1&tab=wearables';
    if (!user) return { action: 'redirect', location: signupLocation(back, '') };
    if (!verified) return { action: 'redirect', location: verifyLocation(back, '') };
    return { action: 'allow' };
  }

  if (!user) {
    if (api) return { action: 'unauthorized' };
    return { action: 'redirect', location: signupLocation(pathname, search) };
  }
  if (!verified) {
    if (api) return { action: 'unverified' };
    return { action: 'redirect', location: verifyLocation(pathname, search) };
  }
  return { action: 'allow' };
}
