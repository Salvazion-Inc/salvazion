import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Supabase client for Server Components, Route Handlers and Server Actions.
 * Cookie-based session so middleware and RSC stay in sync.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignore. Middleware will refresh.
          }
        },
      },
    }
  );
}
