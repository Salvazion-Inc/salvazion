/**
 * X (Twitter) OAuth via Supabase Auth.
 * Provider id remains "twitter" in Supabase even after the X rebrand.
 */

import type { User } from '@supabase/supabase-js';
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
  if (!u || !/^[A-Za-z0-9_]{1,15}$/.test(u) && !/^[A-Za-z0-9_]{1,50}$/.test(u)) {
    // X allows longer handles in some edge cases; keep alnum underscore
    const loose = u.replace(/[^A-Za-z0-9_]/g, '');
    return loose || null;
  }
  return u;
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
    // Only treat as X login if provider is twitter/x
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

/**
 * Start X OAuth (login or signup — same flow; Supabase creates account if new).
 */
export async function signInWithX(options?: {
  next?: string;
}): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const next = options?.next || '/hub/dashboard';
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo,
        // Request profile for username; scopes depend on X app config
        scopes: 'tweet.read users.read offline.access',
      },
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'No se pudo iniciar sesión con X',
    };
  }
}
