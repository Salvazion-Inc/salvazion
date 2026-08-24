import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Fail fast so Vercel middleware never hits the 25s invocation wall. */
const GET_USER_TIMEOUT_MS = 2500;

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.includes('auth-token') || c.name.startsWith('sb-'));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('auth_timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Refreshes the auth session and returns the user (if any).
 * Used by the root middleware.
 *
 * If Supabase env vars are missing (e.g. build without secrets), pass through
 * without blocking the deploy — auth simply won't be available until configured.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { supabase: null, user: null, supabaseResponse };
  }

  // Anonymous visitors: do not call Supabase. A hung getUser() is what
  // produced MIDDLEWARE_INVOCATION_TIMEOUT (504) on the public site.
  if (!hasSupabaseAuthCookie(request)) {
    return { supabase: null, user: null, supabaseResponse };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await withTimeout(supabase.auth.getUser(), GET_USER_TIMEOUT_MS);
    return { supabase, user, supabaseResponse };
  } catch {
    return { supabase, user: null, supabaseResponse };
  }
}
