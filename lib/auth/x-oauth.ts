/**
 * X login via Supabase — OAuth 2.0 only (`provider: 'x'`).
 * Does NOT redirect to deprecated Twitter OAuth 1.0a.
 *
 * Supabase: Authentication → Providers → “X / Twitter (OAuth 2.0)”
 * Credentials: Client ID + Client Secret from developer.x.com (OAuth 2.0 section)
 */

import type { Provider, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getOAuthRedirectTo } from '@/lib/auth/oauth-redirect';
import { fetchExternalProviders } from '@/lib/auth/provider-status';

export interface XIdentity {
  username: string;
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
}

function cleanUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const u = raw.trim().replace(/^@+/, '');
  if (!u) return null;
  return u.replace(/[^A-Za-z0-9_]/g, '') || null;
}

export function extractXIdentity(user: User | null | undefined): XIdentity | null {
  if (!user) return null;

  const identities = user.identities || [];
  // Prefer modern `x`; still read legacy twitter identities for profile display only
  const xId =
    identities.find((i) => i.provider === 'x') ||
    identities.find((i) => i.provider === 'twitter') ||
    null;

  const meta = {
    ...(user.user_metadata || {}),
    ...(xId?.identity_data || {}),
  } as Record<string, unknown>;

  const username =
    cleanUsername(meta.user_name) ||
    cleanUsername(meta.preferred_username) ||
    cleanUsername(meta.screen_name) ||
    cleanUsername(meta.username) ||
    cleanUsername(meta.nickname) ||
    cleanUsername(meta.UserNameKey);

  if (!username) return null;

  const displayName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    undefined;

  const avatarUrl =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    (typeof meta.profile_image_url_https === 'string' &&
      meta.profile_image_url_https) ||
    undefined;

  const userId =
    (typeof meta.provider_id === 'string' && meta.provider_id) ||
    (typeof meta.sub === 'string' && meta.sub) ||
    xId?.id ||
    undefined;

  return {
    username,
    userId,
    displayName: displayName || undefined,
    avatarUrl: avatarUrl?.replace('_normal', '_400x400'),
  };
}

export function formatXHandle(username: string): string {
  return `@${username.replace(/^@+/, '')}`;
}

export function xProfileUrl(username: string): string {
  return `https://x.com/${username.replace(/^@+/, '')}`;
}

/** @deprecated No-op — legacy Twitter fallback removed */
export function markXProfileFetchFailed(): void {
  /* intentionally empty — we no longer switch to Twitter OAuth 1.0a */
}

export function clearXLegacyFlag(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('salvazion_x_use_legacy');
  } catch {
    /* ignore */
  }
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
    if (external.x === false && Object.keys(external).length > 0) {
      return {
        error:
          `X (OAuth 2.0) no está habilitado en Supabase (proyecto ${projectRef}). ` +
          `Authentication → Providers → “X / Twitter (OAuth 2.0)” → Enable + ` +
          `Client ID y Client Secret de developer.x.com → Save. ` +
          `No uses el provider “Twitter” (OAuth 1.0a, deprecado).`,
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
            `No actives el login con el provider Twitter V1 deprecado.`,
        };
      }
      return { error: error.message };
    }

    if (data?.url) {
      // Ensure we never open twitter.com OAuth 1.0a authorize endpoints by mistake
      if (
        data.url.includes('api.twitter.com/oauth/') ||
        data.url.includes('api.x.com/oauth/authenticate') ||
        data.url.includes('/oauth/authenticate')
      ) {
        return {
          error:
            'Se intentó usar Twitter OAuth 1.0a (deprecado). Revisa que en Supabase solo esté ' +
            'activo “X / Twitter (OAuth 2.0)” con Client ID/Secret, no el provider Twitter V1.',
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
