import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { safeNextPath } from '@/lib/auth/paths';

/**
 * OAuth / magic-link / email-confirm redirect (PKCE code flow).
 *
 * Critical: session cookies must be written onto the *redirect* NextResponse,
 * otherwise exchangeCodeForSession appears to fail and the user lands on login.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeNextPath(requestUrl.searchParams.get('next'), '/hub/dashboard');

  // Prefer public host behind Vercel so redirects stay on salvazion.org
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  const oauthError = requestUrl.searchParams.get('error');
  if (oauthError) {
    const desc =
      requestUrl.searchParams.get('error_description') || oauthError;
    const url = new URL('/auth/login', origin);
    url.searchParams.set('error', 'auth_callback_failed');
    url.searchParams.set('detail', desc.slice(0, 200));
    return NextResponse.redirect(url);
  }

  if (!code) {
    const url = new URL('/auth/login', origin);
    url.searchParams.set('error', 'auth_callback_failed');
    url.searchParams.set('detail', 'missing_code');
    return NextResponse.redirect(url);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const url = new URL('/auth/login', origin);
    url.searchParams.set('error', 'auth_callback_failed');
    url.searchParams.set('detail', 'missing_supabase_env');
    return NextResponse.redirect(url);
  }

  // Build the success redirect first so we can attach Set-Cookie to it
  let response = NextResponse.redirect(`${origin}${next}`);

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // ignore if cookie store is read-only in this context
          }
          // Must set on the response that will be returned (redirect)
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession', error.message);
    const url = new URL('/auth/login', origin);
    url.searchParams.set('error', 'auth_callback_failed');
    url.searchParams.set('detail', error.message.slice(0, 200));
    return NextResponse.redirect(url);
  }

  // Best-effort: stamp X username / avatar on profile
  try {
    const user = data.session?.user;
    if (user) {
      const identity = user.identities?.find(
        (i) => i.provider === 'twitter' || i.provider === 'x'
      );
      const meta = {
        ...(user.user_metadata || {}),
        ...(identity?.identity_data || {}),
      } as Record<string, unknown>;

      const raw =
        meta.user_name ||
        meta.preferred_username ||
        meta.screen_name ||
        meta.username;
      const username =
        typeof raw === 'string' ? raw.trim().replace(/^@+/, '') : '';

      if (username) {
        const displayName =
          (typeof meta.full_name === 'string' && meta.full_name) ||
          (typeof meta.name === 'string' && meta.name) ||
          username;
        const avatar =
          (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
          (typeof meta.picture === 'string' && meta.picture) ||
          null;

        const payload: Record<string, unknown> = {
          id: user.id,
          x_username: username,
          updated_at: new Date().toISOString(),
        };
        if (displayName) payload.name = displayName;
        if (avatar) {
          payload.avatar_url = String(avatar).replace('_normal', '_400x400');
        }
        if (typeof meta.provider_id === 'string') {
          payload.x_user_id = meta.provider_id;
        }

        const { error: upErr } = await supabase.from('profiles').upsert(payload);
        if (upErr && String(upErr.message || '').includes('x_username')) {
          delete payload.x_username;
          delete payload.x_user_id;
          await supabase.from('profiles').upsert(payload);
        }
      }
    }
  } catch (stampErr) {
    console.warn('[auth/callback] X profile stamp failed', stampErr);
  }

  return response;
}
