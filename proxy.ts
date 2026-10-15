import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { decideServiceAccess, isEmailVerified } from '@/lib/auth/service-access';

function withSessionCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export async function proxy(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);
  const accessUser = user
    ? {
        id: user.id,
        email: user.email ?? null,
        emailConfirmedAt: isEmailVerified(user) ? user.email_confirmed_at || user.confirmed_at || 'verified' : null,
      }
    : null;

  const decision = decideServiceAccess({
    pathname: request.nextUrl.pathname,
    method: request.method,
    search: request.nextUrl.search,
    user: accessUser,
  });

  if (decision.action === 'allow') return supabaseResponse;

  if (decision.action === 'redirect') {
    return withSessionCookies(
      supabaseResponse,
      NextResponse.redirect(new URL(decision.location, request.nextUrl))
    );
  }

  const status = decision.action === 'unauthorized' ? 401 : 403;
  const error = decision.action === 'unauthorized' ? 'auth_required' : 'email_unverified';
  const denied = NextResponse.json({ error }, { status });
  denied.headers.set('Cache-Control', 'no-store');
  return withSessionCookies(supabaseResponse, denied);
}

export const config = {
  // Home, /privacy and /terms are intentionally absent: getUser() on the
  // public site caused 504 MIDDLEWARE_INVOCATION_TIMEOUT when Supabase hung.
  // Service routes (hub, founder board, premium, APIs, auth) are gated here.
  matcher: [
    '/hub/:path*',
    '/auth/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/premium/:path*',
    '/api/:path*',
  ],
};
