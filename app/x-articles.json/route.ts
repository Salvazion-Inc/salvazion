import { X_ARTICLES } from '@/lib/freedom/x-articles';

/**
 * Public, static catalog of @salvazion_ X articles for the landing carousel
 * (loaded on demand instead of shipping it in the client bundle).
 * Perf: DEC-20261028-33.
 */
export const dynamic = 'force-static';

export function GET() {
  return Response.json(X_ARTICLES, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
