import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { safeNextPath } from '@/lib/auth/paths';
import { APP_URL } from '@/lib/config/site';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

/**
 * OAuth / magic-link callback (PKCE).
 * Writes auth cookies onto the redirect response (required for Next.js App Router).
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeNextPath(requestUrl.searchParams.get('next'), '/hub/dashboard');

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  // Prefer configured product host, then proxy host, then request origin
  const configured = (process.env.NEXT_PUBLIC_APP_URL || APP_URL).replace(/\/$/, '');
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : configured || requestUrl.origin;

  const fail = (detail: string) => {
    const url = new URL('/auth/login', origin);
    url.searchParams.set('error', 'auth_callback_failed');
    url.searchParams.set('detail', detail.slice(0, 220));
    return NextResponse.redirect(url);
  };

  const oauthError = requestUrl.searchParams.get('error');
  if (oauthError) {
    const desc =
      requestUrl.searchParams.get('error_description') || oauthError;
    return fail(desc);
  }

  if (!code) {
    return fail('missing_code');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return fail('missing_supabase_env');
  }

  let response = NextResponse.redirect(`${origin}${next}`);
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const opts = {
            ...options,
            path: options?.path ?? '/',
            sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
            secure:
              options?.secure ??
              (process.env.NODE_ENV === 'production' || origin.startsWith('https')),
          };
          try {
            cookieStore.set(name, value, opts);
          } catch {
            /* ignore */
          }
          response.cookies.set(name, value, opts);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession', error.message);
    // Client-side recovery page can retry with browser cookies
    const recover = new URL('/auth/callback/recover', origin);
    recover.searchParams.set('code', code);
    recover.searchParams.set('next', next);
    recover.searchParams.set('err', error.message.slice(0, 120));
    return NextResponse.redirect(recover);
  }

  // Stamp social profile fields (best-effort; never block login)
  try {
    const user = data.session?.user;
    if (user) {
      const identities = user.identities || [];
      const xIdentity = identities.find(
        (i) => i.provider === 'twitter' || i.provider === 'x'
      );
      const googleIdentity = identities.find((i) => i.provider === 'google');
      const meta = {
        ...(user.user_metadata || {}),
        ...(xIdentity?.identity_data || {}),
        ...(googleIdentity?.identity_data || {}),
      } as Record<string, unknown>;

      // Never overwrite a user-uploaded / Storage avatar with OAuth CDN photos.
      // Mobile re-login used to clobber profiles.avatar_url → web photo never sticks.
      const { data: existing } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      const existingAvatar =
        typeof existing?.avatar_url === 'string' ? existing.avatar_url : '';
      const isOAuthCdn = (url: string) =>
        /twimg\.com|twitter\.com|pbs\.twimg|googleusercontent\.com|ggpht\.com/i.test(
          url
        );
      const hasCustomAvatar =
        !!existingAvatar &&
        /^https?:\/\//i.test(existingAvatar) &&
        !isOAuthCdn(existingAvatar);

      const payload: Record<string, unknown> = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      const displayName =
        (typeof meta.full_name === 'string' && meta.full_name) ||
        (typeof meta.name === 'string' && meta.name) ||
        (typeof meta.given_name === 'string' && meta.given_name) ||
        null;
      // Only fill name when empty — do not stomp a profile name the user set
      if (displayName && !String(existing?.name || '').trim()) {
        payload.name = displayName;
      }

      const avatar =
        (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
        (typeof meta.picture === 'string' && meta.picture) ||
        (typeof meta.profile_image_url_https === 'string' &&
          meta.profile_image_url_https) ||
        null;
      if (avatar && !hasCustomAvatar) {
        // Empty or previous OAuth CDN only — safe to seed from provider
        if (!existingAvatar || isOAuthCdn(existingAvatar)) {
          payload.avatar_url = String(avatar).replace('_normal', '_400x400');
        }
      }

      if (xIdentity) {
        const raw =
          meta.user_name ||
          meta.preferred_username ||
          meta.screen_name ||
          meta.username;
        const username =
          typeof raw === 'string' ? raw.trim().replace(/^@+/, '') : '';
        if (username) {
          payload.x_username = username;
          if (typeof meta.provider_id === 'string') {
            payload.x_user_id = meta.provider_id;
          } else if (typeof meta.sub === 'string') {
            payload.x_user_id = meta.sub;
          }
        }
      }

      const { error: upErr } = await supabase.from('profiles').upsert(payload);
      if (upErr && String(upErr.message || '').includes('x_username')) {
        delete payload.x_username;
        delete payload.x_user_id;
        await supabase.from('profiles').upsert(payload);
      }
    }
  } catch (stampErr) {
    console.warn('[auth/callback] social profile stamp failed', stampErr);
  }

  return response;
}
