import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/auth/paths';

/**
 * Handles OAuth / magic-link / email-confirm redirect from Supabase (PKCE code flow).
 * Exchanges the code for a session cookie and redirects to the intended page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'), '/hub/dashboard');

  // Supabase may bounce back with error params
  const oauthError = searchParams.get('error');
  if (oauthError) {
    const desc = searchParams.get('error_description') || oauthError;
    const url = new URL('/auth/login', origin);
    url.searchParams.set('error', 'auth_callback_failed');
    url.searchParams.set('detail', desc.slice(0, 200));
    return NextResponse.redirect(url);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Best-effort: stamp X username / avatar on profile after OAuth
        try {
          const user = data.session?.user;
          if (user) {
            const meta = {
              ...(user.user_metadata || {}),
              ...(user.identities?.find(
                (i) => i.provider === 'twitter' || i.provider === 'x'
              )?.identity_data || {}),
            } as Record<string, unknown>;
            const raw =
              meta.user_name ||
              meta.preferred_username ||
              meta.screen_name ||
              meta.username;
            const username =
              typeof raw === 'string'
                ? raw.trim().replace(/^@+/, '')
                : '';
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
              if (avatar) payload.avatar_url = String(avatar).replace('_normal', '_400x400');
              if (typeof meta.provider_id === 'string') payload.x_user_id = meta.provider_id;

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

        // After recovery links, prefer update-password if that was the next target
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error('[auth/callback] exchangeCodeForSession', error.message);
    } catch (e) {
      console.error('[auth/callback] exception', e);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
