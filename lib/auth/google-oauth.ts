/**
 * Gmail / Google OAuth via Supabase Auth.
 * Provider id: "google"
 *
 * Keys go in Supabase Dashboard → Authentication → Providers → Google
 * (Client ID + Client Secret from Google Cloud Console). Not in Vercel.
 */

import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface GoogleIdentity {
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  userId?: string;
}

export function extractGoogleIdentity(user: User | null | undefined): GoogleIdentity | null {
  if (!user) return null;

  const identity = user.identities?.find((i) => i.provider === 'google') || null;
  const isGoogle =
    user.app_metadata?.provider === 'google' ||
    Boolean(identity) ||
    (Array.isArray(user.app_metadata?.providers) &&
      (user.app_metadata.providers as string[]).includes('google'));

  if (!isGoogle && !identity) return null;

  const meta = {
    ...(user.user_metadata || {}),
    ...(identity?.identity_data || {}),
  } as Record<string, unknown>;

  const email =
    (typeof meta.email === 'string' && meta.email) ||
    user.email ||
    undefined;

  const displayName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.given_name === 'string' && meta.given_name) ||
    undefined;

  const avatarUrl =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    undefined;

  const userId =
    (typeof meta.provider_id === 'string' && meta.provider_id) ||
    (typeof meta.sub === 'string' && meta.sub) ||
    identity?.id ||
    undefined;

  return { email, displayName, avatarUrl, userId };
}

export async function signInWithGoogle(options?: {
  next?: string;
}): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const next = options?.next || '/hub/dashboard';
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
        queryParams: {
          // Force account picker (handy when multiple Gmail accounts)
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes('not enabled') || m.includes('unsupported provider')) {
        return {
          error:
            'Google no está activado en Supabase. Authentication → Providers → Google → Enable + Client ID/Secret de Google Cloud → Save.',
        };
      }
      return { error: error.message };
    }
    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google',
    };
  }
}
