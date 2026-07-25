/**
 * X login via Supabase.
 *
 * Prefer OAuth 2.0 provider `x`. If it is disabled, or a previous attempt failed
 * with "Error getting user profile from external provider", automatically use
 * legacy `twitter` (OAuth 1.0a) when that provider is enabled — so login works
 * while X OAuth 2.0 app/API access is fixed.
 */

import type { Provider, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getOAuthRedirectTo } from '@/lib/auth/oauth-redirect';
import { fetchExternalProviders } from '@/lib/auth/provider-status';

const LEGACY_FLAG = 'salvazion_x_use_legacy';

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

/** Call from login page when OAuth returned a profile-fetch failure for X. */
export function markXProfileFetchFailed(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(LEGACY_FLAG, '1');
  } catch {
    /* ignore */
  }
}

export function clearXLegacyFlag(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(LEGACY_FLAG);
  } catch {
    /* ignore */
  }
}

function shouldPreferLegacy(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(LEGACY_FLAG) === '1') return true;
  } catch {
    /* ignore */
  }
  const env = (process.env.NEXT_PUBLIC_X_AUTH_PROVIDER || '').toLowerCase();
  if (env === 'twitter') return true;
  if ((process.env.NEXT_PUBLIC_X_AUTH_ALLOW_LEGACY || '').toLowerCase() === 'true') {
    return true;
  }
  return false;
}

function isProviderDisabledError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('not enabled') ||
    m.includes('unsupported provider') ||
    m.includes('provider is not enabled')
  );
}

/**
 * Decide provider order: OAuth 2.0 `x` first unless legacy is required/preferred.
 */
async function resolveProviderOrder(): Promise<Provider[]> {
  const { external, projectRef } = await fetchExternalProviders();
  const xOn = external.x === true;
  const twitterOn = external.twitter === true;
  const preferLegacy = shouldPreferLegacy();

  if (preferLegacy && twitterOn) {
    return xOn ? (['twitter', 'x'] as Provider[]) : (['twitter'] as Provider[]);
  }
  if (xOn && twitterOn) {
    return ['x', 'twitter'] as Provider[];
  }
  if (xOn) return ['x'] as Provider[];
  if (twitterOn) return ['twitter'] as Provider[];

  // Unknown settings — still try x then twitter
  void projectRef;
  return ['x', 'twitter'] as Provider[];
}

export async function signInWithX(options?: {
  next?: string;
}): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const next = options?.next || '/hub/dashboard';
    const redirectTo = getOAuthRedirectTo(next);
    const order = await resolveProviderOrder();

    let lastError = '';

    for (const provider of order) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        lastError = error.message;
        if (isProviderDisabledError(error.message)) {
          continue;
        }
        return { error: error.message };
      }

      if (data?.url) {
        // Full navigation so PKCE cookies + redirect stay on the same configured host
        window.location.assign(data.url);
        return { error: null };
      }

      lastError = 'No se recibió URL de autorización de X';
    }

    if (lastError && isProviderDisabledError(lastError)) {
      return {
        error:
          'Ni X (OAuth 2.0) ni Twitter (OAuth 1.0a) están habilitados en Supabase para este proyecto. ' +
          'Authentication → Providers → activa “X / Twitter (OAuth 2.0)” con Client ID/Secret, ' +
          'o “Twitter” con API Key/Secret. Ver docs/auth-x.md',
      };
    }

    return {
      error: lastError || 'No se pudo iniciar sesión con X',
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'No se pudo iniciar sesión con X',
    };
  }
}
