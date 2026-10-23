import { NextResponse, type NextRequest } from 'next/server';

// Alias: the recovery form lives inside /auth/login (mode=forgot).
export function GET(request: NextRequest) {
  const url = new URL('/auth/login', request.nextUrl.origin);
  url.searchParams.set('mode', 'forgot');
  const email = request.nextUrl.searchParams.get('email');
  if (email) url.searchParams.set('email', email);
  return NextResponse.redirect(url, 307);
}
