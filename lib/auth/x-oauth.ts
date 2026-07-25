/**
 * X OAuth via Supabase Auth (OAuth 2.0).
 *
 * Primary provider: `x`  → Supabase “X / Twitter (OAuth 2.0)”
 *   Credentials: Client ID + Client Secret from developer.x.com
 *
 * Legacy `twitter` (OAuth 1.0a) is deprecated by Supabase/X and is only
 * used if NEXT_PUBLIC_X_AUTH_ALLOW_LEGACY=true (emergency fallback).
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
  const loose = u.replace(/[^A-Za-z0-9_]/g, '');
  return loose || null;
}

export function extractXIdentity(user: User | null | undefined): XIdentity | null {
  if (!user) return null;

  const identities = user.identities || [];
  // Prefer modern `x` identity; still accept legacy `twitter` for old sessions
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

function allowLegacyTwitter(): boolean {
  return (process.env.NEXT_PUBLIC_X_AUTH_ALLOW_LEGACY || '').toLowerCase() === 'true';
}

/**
 * Start X OAuth 2.0 (login or signup).
 * Uses Supabase provider `x` only, unless legacy fallback is explicitly enabled.
 */
export async function signInWithX(options?: {
  next?: string;
}): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const next = options?.next || '/hub/dashboard';
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    // Primary: X OAuth 2.0
    const primary = await supabase.auth.signInWithOAuth({
      provider: 'x' as Provider,
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });

    if (!primary.error) {
      return { error: null };
    }

    // Optional emergency fallback to deprecated Twitter OAuth 1.0a
    if (allowLegacyTwitter() && isProviderDisabledError(primary.error.message)) {
      const legacy = await supabase.auth.signInWithOAuth({
        provider: 'twitter' as Provider,
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });
      if (!legacy.error) return { error: null };
      return { error: legacy.error.message };
    }

    if (isProviderDisabledError(primary.error.message)) {
      return {
        error:
          'X (OAuth 2.0) no está activado en Supabase. ' +
          'Authentication → Providers → “X / Twitter (OAuth 2.0)” → Enable + ' +
          'Client ID y Client Secret de developer.x.com → Save. ' +
          'En Vercel: NEXT_PUBLIC_X_AUTH_PROVIDER=x (opcional) y Redeploy. Ver docs/auth-x.md',
      };
    }

    return { error: primary.error.message };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'No se pudo iniciar sesión con X',
    };
  }
}
