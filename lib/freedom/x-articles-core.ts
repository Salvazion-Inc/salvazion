/**
 * Catalog-free helpers for X articles (no JSON import), so client bundles that
 * only need formatting/ranking do not ship the 363-article catalog.
 * Perf: DEC-20261028-33.
 */
import type { PillarId } from '@/lib/theme/pillars';

export type InterestFocus =
  | 'fe'
  | 'familia'
  | 'proposito'
  | 'salud'
  | 'libertad'
  | 'oracion'
  | 'liderazgo'
  | 'perseverancia';

/** Primary Salvazion pillar for blog filters / SEO */
export type ArticlePillar = PillarId;

export interface XArticle {
  id: string;
  statusId?: string | null;
  title: string;
  /** Spanish title for marketing blog / i18n */
  titleEs: string;
  /** Brazilian Portuguese title for marketing blog / i18n */
  titlePt: string;
  preview: string;
  /** Spanish preview for marketing blog / i18n */
  previewEs: string;
  /** Brazilian Portuguese preview for marketing blog / i18n */
  previewPt: string;
  image: string;
  url: string;
  createdAt?: string | null;
  source: string;
  verified: boolean;
  /** Interest tags for ranking */
  interests: InterestFocus[];
  /** Primary pillar: salvation | health | freedom */
  pillar: ArticlePillar;
  tags: string[];
  readMin: number;
}


/** Localized title + preview for marketing blog and in-app feed. */
export function localizeArticle(
  article: XArticle,
  lang: 'en' | 'es' | 'pt'
): { title: string; preview: string } {
  if (lang === 'es') {
    return {
      title: article.titleEs || article.title,
      preview: article.previewEs || article.preview,
    };
  }
  if (lang === 'pt') {
    return {
      title: article.titlePt || article.title,
      preview: article.previewPt || article.preview,
    };
  }
  return { title: article.title, preview: article.preview };
}

/** Normalize free-text into search tokens (accents stripped, min length 2). */
export function normalizeArticleSearchQuery(query: string): string[] {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[\s,;|/]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
}

function articleSearchHaystack(article: XArticle): string {
  return [
    article.title,
    article.titleEs,
    article.titlePt,
    article.preview,
    article.previewEs,
    article.previewPt,
    article.pillar,
    ...(article.tags || []),
    ...(article.interests || []),
  ]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** True when every keyword token appears in title, preview, tags or pillar. */
export function articleMatchesQuery(article: XArticle, query: string): boolean {
  const tokens = normalizeArticleSearchQuery(query);
  if (!tokens.length) return true;
  const hay = articleSearchHaystack(article);
  return tokens.every((t) => hay.includes(t));
}

export function formatArticleDate(
  createdAt?: string | null,
  lang: 'es' | 'en' | 'pt' = 'en'
): string {
  const locale = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';
  if (!createdAt) return '';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) {
    // Twitter format: Wed Jul 24 22:54:55 +0000 2024
    const t = Date.parse(createdAt);
    if (Number.isNaN(t)) return '';
    return new Date(t).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    // Deterministic on server (UTC) and every visitor's timezone: avoids
    // React #418 hydration mismatch on the landing blog (DEC-20261028-29).
    timeZone: 'UTC',
  });
}

export function interestScore(article: XArticle, focus: string[]): number {
  if (!focus.length) return 0;
  let score = 0;
  for (const f of focus) {
    if (article.interests.includes(f as InterestFocus)) score += 3;
    if (article.tags.some((t) => t.toLowerCase().includes(f.toLowerCase()))) score += 1;
  }
  return score;
}

export interface BlogArticleRankCore {
  focus?: string[];
}

/** Same ordering as getBlogArticles (without read-state), over a given list. */
export function rankBlogArticles(
  source: XArticle[],
  pillar?: ArticlePillar | 'all',
  query?: string,
  rank?: BlogArticleRankCore
): XArticle[] {
  let list = [...source];
  if (pillar && pillar !== 'all') list = list.filter((a) => a.pillar === pillar);
  if (query?.trim()) list = list.filter((a) => articleMatchesQuery(a, query));
  const focus = (rank?.focus || []).filter(Boolean);
  list.sort((a, b) => {
    if (focus.length) {
      const sa = interestScore(a, focus);
      const sb = interestScore(b, focus);
      if (sa !== sb) return sb - sa;
    }
    const ta = Date.parse(a.createdAt || '') || 0;
    const tb = Date.parse(b.createdAt || '') || 0;
    return tb - ta;
  });
  return list;
}
