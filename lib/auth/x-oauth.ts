/**
 * X (Twitter) OAuth via Supabase Auth.
 *
 * Supabase now has two providers:
 * - `x`      → X / Twitter (OAuth 2.0)  ← recommended
 * - `twitter`→ legacy Twitter (OAuth 1.0a)
 *
 * We try `x` first, then fall back to `twitter` if only the legacy one is enabled.
 */

import type { Provider, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

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
  // X handles: letters, numbers, underscore
  const loose = u.replace(/[^A-Za-z0-9_]/g, '');
  return loose || null;
}

/**
 * Pull X handle + avatar from Supabase user (identities + user_metadata).
 */
export function extractXIdentity(user: User | null | undefined): XIdentity | null {
  if (!user) return null;

  const identities = user.identities || [];
  const xId =
    identities.find((i) => i.provider === 'twitter' || i.provider === 'x') || null;

  const meta = {
    ...(user.user_metadata || {}),
    ...(xId?.identity_data || {}),
  } as Record<string, unknown>;

  const username =
    cleanUsername(meta.user_name) ||
    cleanUsername(meta.preferred_username) ||
    cleanUsername(meta.screen_name) ||
    cleanUsername(meta.username) ||
    cleanUsername(meta.nickname);

  if (!username) {
    const isX =
      user.app_metadata?.provider === 'twitter' ||
      user.app_metadata?.provider === 'x' ||
      identities.some((i) => i.provider === 'twitter' || i.provider === 'x');
    if (!isX) return null;
    return null;
  }

  const displayName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.fullName === 'string' && meta.fullName) ||
    undefined;

  const avatarUrl =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    (typeof meta.profile_image_url === 'string' && meta.profile_image_url) ||
    (typeof meta.profile_image_url_https === 'string' &&
      meta.profile_image_url_https) ||
    undefined;

  const userId =
    (typeof meta.provider_id === 'string' && meta.provider_id) ||
    (typeof meta.id === 'string' && meta.id) ||
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

function isProviderDisabledError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('not enabled') ||
    m.includes('unsupported provider') ||
    m.includes('provider is not enabled')
  );
}

/**
 * Start X OAuth (login or signup — same flow; Supabase creates account if new).
 * Prefer OAuth 2.0 provider `x`; fall back to legacy `twitter`.
 */
export async function signInWithX(options?: {
  next?: string;
}): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const next = options?.next || '/hub/dashboard';
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    // 1) Preferred: X OAuth 2.0 (Supabase dashboard: "X / Twitter (OAuth 2.0)")
    const primary = await supabase.auth.signInWithOAuth({
      provider: 'x' as Provider,
      options: {
        redirectTo,
        scopes: 'tweet.read users.read offline.access',
        skipBrowserRedirect: false,
      },
    });

    if (!primary.error) {
      return { error: null };
    }

    // 2) Fallback: legacy Twitter OAuth 1.0a if only that is enabled
    if (isProviderDisabledError(primary.error.message)) {
      const legacy = await supabase.auth.signInWithOAuth({
        provider: 'twitter' as Provider,
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });

      if (!legacy.error) {
        return { error: null };
      }

      if (isProviderDisabledError(legacy.error.message)) {
        return {
          error:
            'X no está activado en Supabase. En Authentication → Providers habilita ' +
            '“X / Twitter (OAuth 2.0)” con Client ID y Client Secret de X, y guarda. ' +
            'Proyecto: kppylfrsclkdmtpobpxd',
        };
      }
      return { error: legacy.error.message };
    }

    return { error: primary.error.message };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'No se pudo iniciar sesión con X',
    };
  }
}
