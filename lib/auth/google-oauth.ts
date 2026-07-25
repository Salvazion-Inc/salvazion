/**
 * Gmail / Google OAuth via Supabase Auth.
 * Provider id: "google"
 *
 * Keys go in Supabase Dashboard → Authentication → Providers → Google
 * (Client ID + Client Secret from Google Cloud Console). Not in Vercel.
 */

import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getOAuthRedirectTo } from '@/lib/auth/oauth-redirect';

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

/** Which Supabase project the app is talking to (from NEXT_PUBLIC_SUPABASE_URL). */
function supabaseProjectHint(): string {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const host = new URL(raw).hostname; // xxx.supabase.co
    return host.replace('.supabase.co', '') || raw || 'desconocido';
  } catch {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || 'desconocido';
  }
}

/**
 * Read public auth settings to see if Google is enabled on THIS project.
 */
export async function isGoogleProviderEnabled(): Promise<{
  enabled: boolean;
  projectRef: string;
  external?: Record<string, boolean>;
}> {
  const projectRef = supabaseProjectHint();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) {
    return { enabled: false, projectRef };
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/auth/v1/settings`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { enabled: false, projectRef };
    }
    const json = (await res.json()) as {
      external?: Record<string, boolean | string>;
    };
    const external: Record<string, boolean> = {};
    if (json.external) {
      for (const [k, v] of Object.entries(json.external)) {
        external[k] = v === true || v === 'true';
      }
    }
    return {
      enabled: external.google === true,
      projectRef,
      external,
    };
  } catch {
    return { enabled: false, projectRef };
  }
}

export async function signInWithGoogle(options?: {
  next?: string;
}): Promise<{ error: string | null }> {
  try {
    const projectRef = supabaseProjectHint();

    // Pre-flight: surface clear error if Google is off on this project
    const status = await isGoogleProviderEnabled();
    if (!status.enabled) {
      return {
        error:
          `Google no está habilitado en el proyecto Supabase que usa la app (${projectRef}). ` +
          `Abre ese proyecto en supabase.com → Authentication → Providers → Google → ` +
          `Enable ON + Client ID y Client Secret → Save. ` +
          `Comprueba en Vercel que NEXT_PUBLIC_SUPABASE_URL sea https://${projectRef}.supabase.co ` +
          `y haz Redeploy. Las keys de Google NO van en Vercel.`,
      };
    }

    const supabase = createClient();
    const next = options?.next || '/hub/dashboard';
    const redirectTo = getOAuthRedirectTo(next);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
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
            `Google sigue “not enabled” en Supabase (proyecto ${projectRef}). ` +
            `En el dashboard de ESE proyecto: Providers → Google → Enable + Client ID/Secret → Save. ` +
            `Si ya lo hiciste en otro proyecto, actualiza NEXT_PUBLIC_SUPABASE_URL en Vercel.`,
        };
      }
      return { error: error.message };
    }
    if (data?.url) {
      window.location.assign(data.url);
      return { error: null };
    }
    return { error: 'No se recibió URL de Google' };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google',
    };
  }
}
