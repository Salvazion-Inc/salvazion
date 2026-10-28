/**
 * X login via Supabase — OAuth 2.0 only (`provider: 'x'`).
 * Does NOT use deprecated Twitter OAuth 1.0a.
 *
 * Supabase: Authentication → Providers → “X / Twitter (OAuth 2.0)”
 * Credentials: Client ID + Client Secret from developer.x.com (OAuth 2.0 section)
 *
 * Guide: docs/auth-x.md
 */

import type { Provider, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getOAuthRedirectTo } from '@/lib/auth/oauth-redirect';
import { fetchExternalProviders } from '@/lib/auth/provider-status';

export { extractXIdentity, type XIdentity } from '@/lib/auth/x-identity';

export function formatXHandle(username: string): string {
  return `@${username.replace(/^@+/, '')}`;
}

export function xProfileUrl(username: string): string {
  return `https://x.com/${username.replace(/^@+/, '')}`;
}

/** @deprecated No-op — Twitter OAuth 1.0a is not used */
export function markXProfileFetchFailed(): void {
  /* intentionally empty */
}

export function clearXLegacyFlag(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('salvazion_x_use_legacy');
  } catch {
    /* ignore */
  }
}

export function isXProfileProviderError(message: string | null | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('user profile from external provider') ||
    m.includes('getting user profile') ||
    m.includes('user email from external provider') ||
    m.includes('client-not-enrolled') ||
    m.includes('client not enrolled')
  );
}

/**
 * Start X OAuth 2.0 only (Supabase provider `x`).
 */
export async function signInWithX(options?: {
  next?: string;
}): Promise<{ error: string | null }> {
  try {
    clearXLegacyFlag();

    const { external, projectRef } = await fetchExternalProviders();
    // Public settings often omit `x` even when enabled; only block if explicitly false
    if (external.x === false && Object.keys(external).length > 0) {
      return {
        error:
          `X (OAuth 2.0) no está habilitado en Supabase (proyecto ${projectRef}). ` +
          `Authentication → Providers → “X / Twitter (OAuth 2.0)” → Enable + ` +
          `Client ID y Client Secret de developer.x.com → Save. ` +
          `No uses el provider “Twitter” (OAuth 1.0a).`,
      };
    }

    const supabase = createClient();
    const next = options?.next || '/hub/dashboard';
    const redirectTo = getOAuthRedirectTo(next);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'x' as Provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes('not enabled') || m.includes('unsupported provider')) {
        return {
          error:
            `X (OAuth 2.0) no está activado en Supabase (${projectRef}). ` +
            `Providers → “X / Twitter (OAuth 2.0)” → Enable + Client ID/Secret → Save. ` +
            `No uses el provider Twitter (OAuth 1.0a).`,
        };
      }
      return { error: error.message };
    }

    if (data?.url) {
      // Reject accidental OAuth 1.0a authorize URLs
      if (
        data.url.includes('api.twitter.com/oauth/') ||
        data.url.includes('api.x.com/oauth/authenticate') ||
        (data.url.includes('/oauth/authenticate') && !data.url.includes('oauth2'))
      ) {
        return {
          error:
            'Se intentó usar Twitter OAuth 1.0a (no permitido). ' +
            'En Supabase activa solo “X / Twitter (OAuth 2.0)” con Client ID/Secret.',
        };
      }
      window.location.assign(data.url);
      return { error: null };
    }

    return { error: 'No se recibió URL de autorización de X' };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'No se pudo iniciar sesión con X',
    };
  }
}
