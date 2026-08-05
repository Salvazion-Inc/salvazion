/**
 * Brand / distribution metrics from X (@salvazion_) for Salvazion Inc.
 * Business relevance: top-of-funnel reach, content inventory, social→product.
 *
 * Primary: public fxtwitter profile API (no OAuth).
 * Optional: X_BEARER_TOKEN / TWITTER_BEARER_TOKEN for official API v2.
 */

import catalogJson from '@/data/freedom/x-articles-catalog.json';

export const X_BRAND_HANDLE = 'salvazion_';
export const X_BRAND_USER_ID = '1076132104226983948';
export const X_BRAND_URL = `https://x.com/${X_BRAND_HANDLE}`;

export type XBrandMetrics = {
  handle: string;
  url: string;
  name: string | null;
  followers: number | null;
  following: number | null;
  tweets: number | null;
  mediaCount: number | null;
  likes: number | null;
  verified: boolean | null;
  description: string | null;
  website: string | null;
  /** Long-form X Articles in product catalog */
  articlesCatalog: number;
  /** Articles with createdAt in last 30 days (catalog) */
  articlesLast30d: number;
  source: 'fxtwitter' | 'x_api_v2' | 'catalog_only' | 'none';
  fetchedAt: string;
  error?: string;
  /** ms latency of live fetch */
  latencyMs?: number;
};

type CacheEntry = { at: number; data: XBrandMetrics };

/** Short TTL so the business console stays near real-time */
const CACHE_TTL_MS = 25_000;
let cache: CacheEntry | null = null;

function catalogStats(): { total: number; last30d: number } {
  const list = Array.isArray(catalogJson) ? catalogJson : [];
  const cutoff = Date.now() - 30 * 86400000;
  let last30d = 0;
  for (const a of list as { createdAt?: string | null }[]) {
    if (!a?.createdAt) continue;
    const t = Date.parse(a.createdAt);
    if (Number.isFinite(t) && t >= cutoff) last30d += 1;
  }
  return { total: list.length, last30d };
}

async function fetchViaFxTwitter(handle: string): Promise<Partial<XBrandMetrics>> {
  const r = await fetch(`https://api.fxtwitter.com/${encodeURIComponent(handle)}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SalvazionBusiness/1.0 (+https://salvazion.org)',
    },
    // Next.js route handlers: force live
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`fxtwitter ${r.status}`);
  const j = (await r.json()) as {
    code?: number;
    user?: {
      screen_name?: string;
      name?: string;
      followers?: number;
      following?: number;
      tweets?: number;
      media_count?: number;
      likes?: number;
      description?: string;
      website?: { url?: string };
      verification?: { verified?: boolean };
    };
  };
  const u = j.user;
  if (!u) throw new Error('fxtwitter empty user');
  return {
    handle: u.screen_name || handle,
    name: u.name ?? null,
    followers: u.followers ?? null,
    following: u.following ?? null,
    tweets: u.tweets ?? null,
    mediaCount: u.media_count ?? null,
    likes: u.likes ?? null,
    verified: u.verification?.verified ?? null,
    description: u.description ?? null,
    website: u.website?.url ?? null,
    source: 'fxtwitter',
  };
}

/** Official API when bearer is configured (preferred for production reliability). */
async function fetchViaOfficialApi(handle: string): Promise<Partial<XBrandMetrics>> {
  const bearer =
    process.env.X_BEARER_TOKEN?.trim() ||
    process.env.TWITTER_BEARER_TOKEN?.trim() ||
    '';
  if (!bearer) throw new Error('no_bearer');

  const url = new URL('https://api.x.com/2/users/by/username/' + encodeURIComponent(handle));
  url.searchParams.set(
    'user.fields',
    'public_metrics,description,url,verified,verified_type,created_at,profile_image_url'
  );

  const r = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${bearer}`,
      'User-Agent': 'SalvazionBusiness/1.0',
    },
    cache: 'no-store',
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`x_api ${r.status} ${t.slice(0, 120)}`);
  }
  const j = (await r.json()) as {
    data?: {
      username?: string;
      name?: string;
      description?: string;
      url?: string;
      verified?: boolean;
      public_metrics?: {
        followers_count?: number;
        following_count?: number;
        tweet_count?: number;
        listed_count?: number;
        like_count?: number;
        media_count?: number;
      };
    };
  };
  const d = j.data;
  if (!d) throw new Error('x_api empty');
  const m = d.public_metrics || {};
  return {
    handle: d.username || handle,
    name: d.name ?? null,
    followers: m.followers_count ?? null,
    following: m.following_count ?? null,
    tweets: m.tweet_count ?? null,
    mediaCount: m.media_count ?? null,
    likes: m.like_count ?? null,
    verified: d.verified ?? null,
    description: d.description ?? null,
    website: d.url ?? null,
    source: 'x_api_v2',
  };
}

/**
 * Live brand metrics for @salvazion_ (+ catalog articles).
 * Cached ~25s for multi-tab / poll without hammering upstream.
 */
export async function fetchXBrandMetrics(opts?: {
  force?: boolean;
}): Promise<XBrandMetrics> {
  const now = Date.now();
  if (!opts?.force && cache && now - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }

  const cat = catalogStats();
  const base: XBrandMetrics = {
    handle: X_BRAND_HANDLE,
    url: X_BRAND_URL,
    name: null,
    followers: null,
    following: null,
    tweets: null,
    mediaCount: null,
    likes: null,
    verified: null,
    description: null,
    website: null,
    articlesCatalog: cat.total,
    articlesLast30d: cat.last30d,
    source: 'none',
    fetchedAt: new Date().toISOString(),
  };

  const t0 = Date.now();
  try {
    let partial: Partial<XBrandMetrics>;
    try {
      partial = await fetchViaOfficialApi(X_BRAND_HANDLE);
    } catch {
      partial = await fetchViaFxTwitter(X_BRAND_HANDLE);
    }
    const data: XBrandMetrics = {
      ...base,
      ...partial,
      articlesCatalog: cat.total,
      articlesLast30d: cat.last30d,
      handle: partial.handle || X_BRAND_HANDLE,
      url: `https://x.com/${partial.handle || X_BRAND_HANDLE}`,
      source: (partial.source as XBrandMetrics['source']) || 'fxtwitter',
      fetchedAt: new Date().toISOString(),
      latencyMs: Date.now() - t0,
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    const data: XBrandMetrics = {
      ...base,
      source: cat.total > 0 ? 'catalog_only' : 'none',
      error: e instanceof Error ? e.message : 'x_fetch_failed',
      latencyMs: Date.now() - t0,
      fetchedAt: new Date().toISOString(),
    };
    // Cache failures briefly to avoid stampede
    cache = { at: Date.now(), data };
    return data;
  }
}

export function clearXMetricsCache() {
  cache = null;
}
