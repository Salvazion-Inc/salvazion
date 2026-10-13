import { getBlogPillarCounts } from '@/lib/freedom/x-articles';
import { HYMNS } from '@/lib/salvation/hymns';
import { SALVAZION_MINT } from '@/lib/solana/config';
import { SEO } from '@/lib/seo/config';
import {
  normalizeCapsules,
  normalizeCatalogCounts,
  normalizeDex,
  normalizeFx,
  normalizeMarinas,
  normalizePartners,
  normalizeYachts,
} from './normalize';
import type { LiveDashboard } from './types';

const KAENZ = 'https://kaenz.com';
const MAPUCOIN = 'https://mapucoin.com';

async function readJson(url: string, ms = 8000): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadLiveDashboard(): Promise<LiveDashboard> {
  const [yachtsRaw, marinasRaw, catalogRaw, partnersRaw, fxRaw, dexRaw] = await Promise.all([
    readJson(`${KAENZ}/api/yachts`),
    readJson(`${KAENZ}/api/marinas`),
    readJson(`${MAPUCOIN}/api/catalog`),
    readJson(`${MAPUCOIN}/api/partners/approved`),
    readJson('https://mindicador.cl/api/dolar'),
    readJson(`https://api.dexscreener.com/latest/dex/tokens/${SALVAZION_MINT}`),
  ]);

  const articles = getBlogPillarCounts();
  const yachts = normalizeYachts(yachtsRaw);
  const marinas = normalizeMarinas(marinasRaw);
  const capsules = normalizeCapsules(catalogRaw);
  const counts = normalizeCatalogCounts(catalogRaw);

  return {
    fetchedAt: new Date().toISOString(),
    fx: { clpPerUsd: normalizeFx(fxRaw) },
    salvazion: {
      premiumMonthly: SEO.pricing.premiumMonthly,
      premiumAnnual: SEO.pricing.premiumAnnual,
      articles: {
        freedom: articles.freedom,
        salvation: articles.salvation,
        health: articles.health,
        total: articles.all,
      },
      hymns: HYMNS.length,
    },
    kaenz: {
      ok: yachtsRaw !== null && yachts.length > 0,
      yachts,
      checkoutMarinas: marinas.checkoutMarinas,
      mapHubs: marinas.mapHubs,
    },
    mapucoin: {
      ok: catalogRaw !== null && capsules.length > 0,
      capsules,
      destinations: counts.destinations,
      parks: counts.parks,
      gastronomy: counts.gastronomy,
      activities: counts.activities,
      partners: normalizePartners(partnersRaw),
    },
    token: normalizeDex(dexRaw),
  };
}
