import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { safeNextPath } from '@/lib/auth/paths';

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);

  const path = request.nextUrl.pathname;

  // Protect the entire Hub
  if (path.startsWith('/hub')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('next', safeNextPath(path + request.nextUrl.search, '/hub/dashboard'));
      return NextResponse.redirect(url);
    }
  }

  // Password update requires a recovery/session user
  if (path.startsWith('/auth/update-password')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('error', 'session_missing');
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // If already logged in, skip login/signup (but not update-password / callback / confirm).
  // Honor `next` so a Premium click can resume Checkout after auth.
  if (user && (path.startsWith('/auth/login') || path.startsWith('/auth/signup'))) {
    const next = safeNextPath(request.nextUrl.searchParams.get('next'), '/hub/dashboard');
    return NextResponse.redirect(new URL(next, request.nextUrl));
  }

  return supabaseResponse;
}

export const config = {
  // Only auth-sensitive routes. Running getUser() on the public site
  // caused 504 MIDDLEWARE_INVOCATION_TIMEOUT when Supabase hung.
  matcher: ['/hub/:path*', '/auth/:path*'],
};
