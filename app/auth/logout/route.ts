import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/** GET/POST /auth/logout: end the Supabase session, clear sb-* cookies, go home. */
async function logout(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.nextUrl.origin), 303);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: { name: string; value: string; options?: Record<string, unknown> }[]) => list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    });
    try {
      await supabase.auth.signOut();
    } catch {
      /* clear cookies anyway */
    }
  }
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith('sb-')) response.cookies.set(c.name, '', { path: '/', maxAge: 0 });
  }
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const GET = logout;
export const POST = logout;
