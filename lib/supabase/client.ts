import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser (client) Supabase client.
 * Uses the public anon key. RLS enforces all access.
 *
 * Call this only inside event handlers / effects — not during render —
 * so static prerender (Vercel build) does not require env vars at SSR time.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Add them in .env.local (local) and Vercel → Settings → Environment Variables.'
    );
  }

  return createBrowserClient(url, key);
}
