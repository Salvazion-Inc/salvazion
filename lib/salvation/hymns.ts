import catalog from '@/data/salvation/hymns-catalog.json';
import type { Language } from '@/lib/types';

export type HymnRecord = {
  n: number;
  es: string;
  en?: string;
  pt?: string;
  url: string;
  hasDemo: boolean;
  author?: string;
  music?: string;
  translator?: string;
  tune?: string;
  meter?: string;
  key?: string;
  tempo?: string;
  theme?: string;
  subtheme?: string;
  verses?: string[];
  /** Public hymn page that links a score PDF, when one exists. */
  scorePage?: string;
};

export type HymnCatalog = {
  source: string;
  hymnal: string;
  count: number;
  acquireUrl: string;
  hymns: HymnRecord[];
};

const data = catalog as HymnCatalog;

export const HYMN_SOURCE = data.source;
export const HYMNAL_NAME = data.hymnal;
export const HYMNAL_ACQUIRE_URL = data.acquireUrl;
export const HYMNS: HymnRecord[] = data.hymns;

export function hymnTitle(hymn: HymnRecord, lang: Language | string): string {
  if (lang === 'en') return hymn.en || hymn.es;
  if (lang === 'pt') return hymn.pt || hymn.en || hymn.es;
  return hymn.es;
}

export function hymnThemes(hymns: HymnRecord[] = HYMNS): string[] {
  const set = new Set<string>();
  for (const hymn of hymns) {
    if (hymn.theme) set.add(hymn.theme);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function filterHymns(
  hymns: HymnRecord[],
  query: string,
  theme: string,
): HymnRecord[] {
  const q = fold(query.trim());
  return hymns.filter((hymn) => {
    if (theme !== 'all' && hymn.theme !== theme) return false;
    if (!q) return true;
    if (String(hymn.n) === q || String(hymn.n).padStart(3, '0') === q) return true;
    const hay = [
      hymn.es,
      hymn.en,
      hymn.pt,
      hymn.author,
      hymn.music,
      hymn.tune,
      hymn.theme,
      hymn.subtheme,
    ]
      .filter(Boolean)
      .join(' ');
    return fold(hay).includes(q);
  });
}
