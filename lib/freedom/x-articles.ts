/**
 * X Articles library — @salvazion_
 * Long-form pieces with cover image + title; open on X to read.
 * Ranked by user interests (profile.currentFocus) and unread state.
 * Pillars (Salvation · Health · Freedom) power marketing blog filters + SEO.
 */

import catalogJson from '@/data/freedom/x-articles-catalog.json';
import esMapJson from '@/data/freedom/x-articles-es.json';
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
  preview: string;
  /** Spanish preview for marketing blog / i18n */
  previewEs: string;
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

type EsEntry = { titleEs?: string; previewEs?: string };
const ES_MAP = esMapJson as Record<string, EsEntry>;

const STORAGE_READ = 'salvazion_x_articles_read';
const STORAGE_VALUE_JOURNEY = 'salvazion_value_journey';

/** Keyword → interest mapping for auto-tagging */
const INTEREST_RULES: { interest: InterestFocus; keys: string[] }[] = [
  { interest: 'fe', keys: ['faith', 'christ', 'christian', 'bible', 'lion', 'judah', 'prayer', 'god', 'islamic', 'west', 'spirit', 'salvazion', 'fe', 'oración'] },
  { interest: 'familia', keys: ['family', 'marriage', 'children', 'parent', 'familia', 'matrimonio'] },
  { interest: 'salud', keys: ['health', 'bio', 'body', 'food', 'sleep', 'salud', 'medical'] },
  { interest: 'libertad', keys: ['freedom', 'liberty', 'communism', 'immigration', 'deep state', 'nato', 'europe', 'milei', 'sovereignty', 'border', 'libertad', 'patriot', 'mega'] },
  { interest: 'liderazgo', keys: ['leader', 'musk', 'milei', 'orbán', 'orban', 'huang', 'nvidia', 'elon', 'project', 'elite', 'mkultra', 'epstein'] },
  { interest: 'proposito', keys: ['solana', 'bitcoin', 'salvazion', 'technology', 'ai', 'machine learning', 'exponencial', 'infrastructure', 'purpose'] },
  { interest: 'oracion', keys: ['prayer', 'spirit', 'christ', 'devotion'] },
  { interest: 'perseverancia', keys: ['virtue', 'discipline', 'constancy', 'persever'] },
];

/**
 * Pillar keyword rules for marketing blog filters (SEO: Salvation · Health · Freedom).
 * Title hits score higher than body. Default pillar is Freedom (largest corpus).
 */
const PILLAR_RULES: { pillar: ArticlePillar; keys: string[] }[] = [
  {
    pillar: 'salvation',
    keys: [
      'faith', 'christ', 'christian', 'bible', 'prayer', 'gospel', 'salvation',
      'church', 'jesus', 'worship', 'devotion', 'christmas', 'spiritual',
      'revival', 'religion', 'theology', 'scripture', 'heaven', 'revelation',
      'luther', 'vatican', 'crusade', 'templar', 'billy graham', 'stoicism',
      'virtue', 'soul', 'prophet', 'western christian', 'spiritual warfare',
      'islamic world', 'how can i get to heaven', 'fe ', 'oración', 'dios',
      'biblia', 'iglesia', 'cristianismo', 'salvación',
    ],
  },
  {
    pillar: 'health',
    keys: [
      'health', 'medical', 'medicine', 'longevity', 'transhuman', 'biotech',
      'biotechnology', 'wellbeing', 'pandemic', 'monkeypox', 'bird flu',
      'disease', 'fitness', 'nutrition', 'vaccine', 'exercise', 'diet',
      'obesity', 'cancer', 'diabetes', 'mental health', 'depression',
      'anxiety', 'pharma', 'hormone', 'fertility', 'birth rate',
      'population collapse', 'aging', 'supplement', 'fasting', 'covid',
      'plandemia', 'virus', 'genome', 'dna', 'crispr', 'neuro', 'addiction',
      'synthetic meat', 'eating bugs', 'insects', 'internet of bodies',
      'graphene', 'laughter', "women's sports", 'trans women', 'biohacking',
      'biomarker', 'sleep', 'hydration', 'ludopathy', 'salud', 'medicina',
      'longevidad', 'vacuna', 'deporte',
    ],
  },
  {
    pillar: 'freedom',
    keys: [
      'freedom', 'liberty', 'solana', 'bitcoin', 'crypto', 'trump', 'desantis',
      'politic', 'geopolitic', 'nato', 'border', 'immigration', 'communism',
      'milei', 'musk', 'sovereignty', 'patriot', 'deep state', 'web3',
      'blockchain', 'meloni', 'bukele', 'zuckerberg', 'bezos', 'monopoly',
      'dei', 'war', 'journalism', 'homeless', 'polariz', 'democracy',
      'censorship', 'media', 'elite', 'epstein', 'china', 'russia', 'europe',
      'military', 'speech', 'privacy', 'surveillance', 'artificial intelligence',
      'machine learning', 'nvidia', 'elon', 'economy', 'inflation', 'token',
      'defi', 'rothschild', 'rockefeller', 'orwell', 'jack ma', 'bunker',
      'libertad', 'soberanía', 'frontera', 'censura',
    ],
  },
];

function inferInterests(title: string, preview: string, tags: string[] = []): InterestFocus[] {
  const hay = `${title} ${preview} ${tags.join(' ')}`.toLowerCase();
  const found = new Set<InterestFocus>();
  for (const rule of INTEREST_RULES) {
    if (rule.keys.some((k) => hay.includes(k.toLowerCase()))) {
      found.add(rule.interest);
    }
  }
  if (found.size === 0) found.add('libertad');
  return [...found];
}

function scorePillar(hay: string, titleHay: string, keys: string[]): number {
  let score = 0;
  for (const key of keys) {
    const k = key.toLowerCase();
    if (titleHay.includes(k)) score += 4;
    else if (hay.includes(k)) score += 1;
  }
  return score;
}

/** Map app interest tags → pillar boost */
function interestPillarBoost(interests: InterestFocus[]): Record<ArticlePillar, number> {
  const boost: Record<ArticlePillar, number> = { salvation: 0, health: 0, freedom: 0 };
  for (const i of interests) {
    if (i === 'fe' || i === 'oracion' || i === 'familia') boost.salvation += 2;
    else if (i === 'salud') boost.health += 3;
    else if (i === 'libertad' || i === 'liderazgo' || i === 'proposito' || i === 'perseverancia') {
      boost.freedom += 2;
    }
  }
  return boost;
}

export function inferPillar(
  title: string,
  preview: string,
  interests: InterestFocus[] = [],
  tags: string[] = []
): ArticlePillar {
  const titleHay = title.toLowerCase();
  const hay = `${title} ${preview} ${tags.join(' ')}`.toLowerCase();
  const boost = interestPillarBoost(interests);
  const scores: Record<ArticlePillar, number> = {
    salvation: boost.salvation,
    health: boost.health,
    freedom: boost.freedom,
  };
  for (const rule of PILLAR_RULES) {
    scores[rule.pillar] += scorePillar(hay, titleHay, rule.keys);
  }
  const ordered = (Object.entries(scores) as [ArticlePillar, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  if (ordered[0][1] <= 0) return 'freedom';
  return ordered[0][0];
}

function estimateReadMin(preview: string): number {
  const words = preview.split(/\s+/).length;
  // Long-form X articles typically 8–15 min
  return Math.min(18, Math.max(6, Math.round(words / 40) + 8));
}

function normalizeEntry(raw: {
  id: string;
  statusId?: string | null;
  title: string;
  preview: string;
  image: string;
  url: string;
  createdAt?: string | null;
  source?: string;
  verified?: boolean;
  tags?: string[];
  pillar?: ArticlePillar;
}): XArticle {
  const tags = raw.tags || [];
  const interests = inferInterests(raw.title, raw.preview, tags);
  let title = raw.title;
  if (!raw.verified || title === 'Artículo @salvazion_') {
    const d = formatArticleDate(raw.createdAt);
    title = d ? `Artículo @salvazion_ · ${d}` : 'Artículo @salvazion_';
  }
  const pillar =
    raw.pillar && (['salvation', 'health', 'freedom'] as const).includes(raw.pillar)
      ? raw.pillar
      : inferPillar(raw.title, raw.preview, interests, tags);
  const es = ES_MAP[raw.id] || {};
  const preview =
    raw.preview || 'Long-form de @salvazion_ en X. Ábrelo para leer el contenido completo.';
  return {
    id: raw.id,
    statusId: raw.statusId,
    title,
    titleEs: es.titleEs || title,
    preview,
    previewEs: es.previewEs || preview,
    image: raw.image || '/logo-icon.png',
    url: raw.url || `https://x.com/i/article/${raw.id}`,
    createdAt: raw.createdAt,
    source: raw.source || '@salvazion_',
    verified: !!raw.verified && raw.title !== 'Artículo @salvazion_',
    interests,
    pillar,
    tags,
    readMin: estimateReadMin(raw.preview || ''),
  };
}

export const X_ARTICLES: XArticle[] = (catalogJson as Array<Parameters<typeof normalizeEntry>[0]>).map(
  normalizeEntry
);

/** Localized title + preview for marketing blog (EN default / ES on language switch) */
export function localizeArticle(
  article: XArticle,
  lang: 'en' | 'es'
): { title: string; preview: string } {
  if (lang === 'es') {
    return {
      title: article.titleEs || article.title,
      preview: article.previewEs || article.preview,
    };
  }
  return { title: article.title, preview: article.preview };
}

/** Total articles in the public catalog (verified marketing count) */
export const X_ARTICLES_COUNT = X_ARTICLES.length;

/** Articles sorted newest-first (for marketing blog) */
export function getBlogArticles(pillar?: ArticlePillar | 'all'): XArticle[] {
  let list = [...X_ARTICLES];
  if (pillar && pillar !== 'all') {
    list = list.filter((a) => a.pillar === pillar);
  }
  list.sort((a, b) => {
    const ta = Date.parse(a.createdAt || '') || 0;
    const tb = Date.parse(b.createdAt || '') || 0;
    return tb - ta;
  });
  return list;
}

export function getBlogPillarCounts(): Record<ArticlePillar | 'all', number> {
  const counts: Record<ArticlePillar | 'all', number> = {
    all: X_ARTICLES.length,
    salvation: 0,
    health: 0,
    freedom: 0,
  };
  for (const a of X_ARTICLES) {
    counts[a.pillar] += 1;
  }
  return counts;
}

export function formatArticleDate(createdAt?: string | null, lang: 'es' | 'en' = 'en'): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) {
    // Twitter format: Wed Jul 24 22:54:55 +0000 2024
    const t = Date.parse(createdAt);
    if (Number.isNaN(t)) return '';
    return new Date(t).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function loadReadArticleIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_READ);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markArticleRead(articleId: string): void {
  if (typeof window === 'undefined') return;
  const list = loadReadArticleIds();
  if (!list.includes(articleId)) {
    list.push(articleId);
    localStorage.setItem(STORAGE_READ, JSON.stringify(list));
  }
}

export function isArticleRead(articleId: string): boolean {
  return loadReadArticleIds().includes(articleId);
}

export function getArticleProgress(): { read: number; total: number } {
  const read = loadReadArticleIds().filter((id) => X_ARTICLES.some((a) => a.id === id)).length;
  return { read, total: X_ARTICLES.length };
}

function interestScore(article: XArticle, focus: string[]): number {
  if (!focus.length) return 0;
  let score = 0;
  for (const f of focus) {
    if (article.interests.includes(f as InterestFocus)) score += 3;
    if (article.tags.some((t) => t.toLowerCase().includes(f.toLowerCase()))) score += 1;
  }
  return score;
}

export interface ArticleFeedOptions {
  focus?: string[];
  /** Prefer unread first (default true) */
  unreadFirst?: boolean;
  /** Only unread */
  unreadOnly?: boolean;
  /** Only verified titles/images */
  verifiedOnly?: boolean;
  limit?: number;
}

/**
 * Feed ranked for the user: unread first, then interest match, then recency.
 */
export function getArticleFeed(opts: ArticleFeedOptions = {}): XArticle[] {
  const {
    focus = [],
    unreadFirst = true,
    unreadOnly = false,
    verifiedOnly = false,
    limit,
  } = opts;
  const readSet = new Set(loadReadArticleIds());

  let list = [...X_ARTICLES];
  if (verifiedOnly) list = list.filter((a) => a.verified);
  if (unreadOnly) list = list.filter((a) => !readSet.has(a.id));

  list.sort((a, b) => {
    if (unreadFirst) {
      const ar = readSet.has(a.id) ? 1 : 0;
      const br = readSet.has(b.id) ? 1 : 0;
      if (ar !== br) return ar - br;
    }
    const sa = interestScore(a, focus);
    const sb = interestScore(b, focus);
    if (sa !== sb) return sb - sa;
    // Prefer verified
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    const ta = Date.parse(a.createdAt || '') || 0;
    const tb = Date.parse(b.createdAt || '') || 0;
    return tb - ta;
  });

  if (limit && limit > 0) return list.slice(0, limit);
  return list;
}

export function getRecommendedArticles(focus: string[], limit = 7): XArticle[] {
  return getArticleFeed({ focus, unreadOnly: true, limit });
}

// —— Value journey completion (shared key) ——

export function loadValueJourneyDone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_VALUE_JOURNEY) === 'done';
  } catch {
    return false;
  }
}

export function saveValueJourneyDone(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_VALUE_JOURNEY, 'done');
  } catch {
    // ignore
  }
}

export function loadValueJourneyStep(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(`${STORAGE_VALUE_JOURNEY}_step`);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function saveValueJourneyStep(step: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_VALUE_JOURNEY}_step`, String(step));
  } catch {
    // ignore
  }
}
