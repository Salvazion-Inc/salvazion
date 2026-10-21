import { APP_URL } from '@/lib/config/site';

/** Team-scoped Vercel preview hosts, e.g. salvazion-abc123-salvazion.vercel.app */
const PREVIEW_ORIGIN_RE = /^https:\/\/salvazion-[a-z0-9-]+-salvazion\.vercel\.app$/;
const LOCAL_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Origin for Supabase email links (confirm / resend / magic link / recovery).
 * Preview host only when VERCEL_ENV=preview; localhost in dev; otherwise
 * always https://salvazion.org. Supabase falls back to the Site URL root
 * (/?code=…) for any redirect_to that is not on its allowlist.
 */
export function authRedirectOrigin(
  currentOrigin: string | null | undefined,
  vercelEnv: string | undefined = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV
): string {
  const o = (currentOrigin || '').replace(/\/$/, '');
  if (vercelEnv === 'preview' && PREVIEW_ORIGIN_RE.test(o)) return o;
  if (LOCAL_ORIGIN_RE.test(o) && vercelEnv !== 'production') return o;
  return APP_URL;
}

export function authEmailRedirectTo(
  next: string,
  currentOrigin?: string | null,
  vercelEnv?: string
): string {
  const origin = authRedirectOrigin(
    currentOrigin ?? (typeof window !== 'undefined' ? window.location.origin : null),
    vercelEnv
  );
  const path = next.startsWith('/') ? next : `/${next}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(path)}`;
}

/**
 * Supabase sent the user to "<site>/?code=…" (redirect_to rejected). Build the
 * /auth/callback URL that finishes the PKCE exchange. Null when not applicable.
 */
export function strayAuthCodeTarget(url: URL): URL | null {
  if (url.pathname.startsWith('/auth/callback') || url.pathname.startsWith('/api/')) return null;
  const code = url.searchParams.get('code');
  const err = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (!code && !err) return null;
  const target = new URL('/auth/callback', url);
  if (code) target.searchParams.set('code', code);
  if (err) target.searchParams.set('error', err.slice(0, 200));
  const next = url.searchParams.get('next');
  target.searchParams.set('next', next && next.startsWith('/') && !next.startsWith('//') ? next : '/hub/onboarding');
  return target;
}
