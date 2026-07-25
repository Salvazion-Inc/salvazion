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
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
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
