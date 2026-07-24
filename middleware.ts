import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);

  const path = request.nextUrl.pathname;

  // Protect the entire Hub
  if (path.startsWith('/hub')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }
  }

  // If already logged in, skip auth pages
  if (user && (path.startsWith('/auth/login') || path.startsWith('/auth/signup'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/hub/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and images.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
