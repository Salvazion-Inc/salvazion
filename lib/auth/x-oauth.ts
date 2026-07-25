/**
 * X (Twitter) OAuth via Supabase Auth.
 *
 * Supabase has two separate providers:
 * - `x`       → X / Twitter (OAuth 2.0)  — uses API v2 /2/users/me
 * - `twitter` → Twitter (OAuth 1.0a)     — uses /1.1/account/verify_credentials.json
 *
 * "Error getting user profile from external provider" almost always means
 * OAuth 2.0 tokens were issued but GET /2/users/me failed (email flag, wrong
 * Client Secret, or API access). In that case enable legacy Twitter (OAuth 1.0a)
 * with API Key + Secret and set NEXT_PUBLIC_X_AUTH_PROVIDER=twitter.
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

/**
 * Which Supabase provider to try first.
 * - `twitter` = OAuth 1.0a (API Key + Secret) — often more reliable on Free tier
 * - `x` = OAuth 2.0 (Client ID + Secret) — recommended by Supabase docs
 *
 * Set NEXT_PUBLIC_X_AUTH_PROVIDER=twitter in Vercel if OAuth 2.0 profile fetch fails.
 */
export function preferredXProvider(): 'x' | 'twitter' {
  const raw = (process.env.NEXT_PUBLIC_X_AUTH_PROVIDER || 'twitter').toLowerCase();
  return raw === 'x' ? 'x' : 'twitter';
}

/**
 * Start X OAuth (login or signup).
 * Default order: OAuth 1.0a first (twitter), then OAuth 2.0 (x).
 * Override with NEXT_PUBLIC_X_AUTH_PROVIDER=x|twitter
 */
export async function signInWithX(options?: {
  next?: string;
}): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const next = options?.next || '/hub/dashboard';
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const first = preferredXProvider();
    const order: Provider[] =
      first === 'x' ? (['x', 'twitter'] as Provider[]) : (['twitter', 'x'] as Provider[]);

    let lastError = '';

    for (const provider of order) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          // Let GoTrue use its built-in scopes for each provider.
          // Custom scopes can break X Free tier /users/me.
        },
      });

      if (!error) {
        return { error: null };
      }

      lastError = error.message;
      if (!isProviderDisabledError(error.message)) {
        // Real auth error (not "disabled") — surface it
        return { error: error.message };
      }
      // else try next provider
    }

    return {
      error:
        lastError ||
        'X/Twitter no está activado en Supabase. Activa “Twitter (OAuth 1.0a)” con API Key+Secret ' +
          'y/o “X / Twitter (OAuth 2.0)” con Client ID+Secret. Ver docs/auth-x.md',
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'No se pudo iniciar sesión con X',
    };
  }
}
