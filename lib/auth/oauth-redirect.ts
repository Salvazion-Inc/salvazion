/**
 * Stable OAuth return URL for PKCE.
 * Using window.location.origin alone breaks when users open a Vercel preview
 * URL or www vs non-www — the code_verifier cookie won't match the callback host.
 */
export function getOAuthRedirectTo(next: string = '/hub/dashboard'): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const origin =
    configured ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const path = next.startsWith('/') ? next : `/${next}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(path)}`;
}
