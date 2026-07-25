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

  // If already logged in, skip login/signup (but not update-password / callback / confirm)
  if (user && (path.startsWith('/auth/login') || path.startsWith('/auth/signup'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/hub/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, images, PWA files.
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
