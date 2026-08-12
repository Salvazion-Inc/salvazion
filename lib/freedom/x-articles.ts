/**
 * X Articles library — @salvazion_
 * Long-form pieces with cover image + title; open on X to read.
 * Ranked by user interests (profile.currentFocus) and unread state.
 * Pillars power blog filters + SEO:
 * Salvation (faith, Christianity, family, conservatism),
 * Health (food, healthtech, exercise, sleep),
 * Freedom (speech, entrepreneurship, political ideas, technology).
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

/** Deleted on X or not an article — never surface in web/app catalog */
const EXCLUDED_IDS = new Set([
  '2080090098029523147',
  '1802085193563398144', // Qolitica
  '1801640234548965376', // Gepardo
]);

const STORAGE_READ = 'salvazion_x_articles_read';
const STORAGE_VALUE_JOURNEY = 'salvazion_value_journey';

/** Keyword → interest mapping for auto-tagging */
const INTEREST_RULES: { interest: InterestFocus; keys: string[] }[] = [
  { interest: 'fe', keys: ['faith', 'christ', 'christian', 'bible', 'lion', 'judah', 'prayer', 'god', 'islamic', 'west', 'spirit', 'salvazion', 'fe', 'oración', 'homeschool', 'gospel'] },
  { interest: 'familia', keys: ['family', 'marriage', 'children', 'parent', 'familia', 'matrimonio', 'homeschool', 'parental', 'formación integral'] },
  { interest: 'salud', keys: ['health', 'bio', 'body', 'food', 'sleep', 'salud', 'medical', 'fasting', 'nutrition'] },
  { interest: 'libertad', keys: ['freedom', 'liberty', 'communism', 'immigration', 'deep state', 'nato', 'europe', 'milei', 'sovereignty', 'border', 'libertad', 'patriot', 'mega', 'mining', 'rare earth', 'chicago boys', 'chile', 'socialist'] },
  { interest: 'liderazgo', keys: ['leader', 'musk', 'milei', 'orbán', 'orban', 'huang', 'nvidia', 'elon', 'project', 'elite', 'mkultra', 'epstein', 'chicago boys', 'grok'] },
  { interest: 'proposito', keys: ['solana', 'bitcoin', 'salvazion', 'technology', 'ai', 'machine learning', 'exponencial', 'infrastructure', 'purpose', 'jupiter', 'web3', 'autonomous', 'grok', 'mining'] },
  { interest: 'oracion', keys: ['prayer', 'spirit', 'christ', 'devotion'] },
  { interest: 'perseverancia', keys: ['virtue', 'discipline', 'constancy', 'persever', 'formation'] },
];

/**
 * Pillar taxonomy (blog filters + SEO):
 * - Salvation: faith, Christianity, family, conservatism
 * - Health: food/nutrition, healthtech, exercise, sleep
 * - Freedom: free speech, entrepreneurship, political ideas, technology
 * Title matches dominate; short keys use word boundaries.
 */
const PILLAR_RULES: { pillar: ArticlePillar; keys: string[] }[] = [
  {
    pillar: 'salvation',
    keys: [
      'christian', 'christianity', 'bible', 'gospel', 'jesus', 'christ',
      'prayer', 'praises', 'spiritual gift', 'spiritual warfare', 'kingdom of god',
      'one true god', 'christian habits', 'billy graham', 'martin luther',
      'vatican', 'revelation', 'crusades', 'monaster', 'templar', 'occult',
      'satanism', 'paganism', 'christmas', 'heaven', 'eternal life',
      'western christian', 'alerci', 'islamic world', 'virtuous people',
      'virtue', 'faith', 'religion', 'theology', 'scripture', 'church',
      'worship', 'devotion', 'salvation', 'prophet', 'biblia', 'iglesia',
      'cristianismo', 'salvación', 'oración', 'homeschool', 'homeschooling',
      'family and marriage', 'marriage as a', 'tradwife', 'traditional wife',
      'christian values and family', 'importance of family',
      'teach our children', 'parental', 'familia', 'matrimonio',
      'conservatism', 'conservative', 'conservadurismo',
      'woke', 'progressivism', 'feminism', 'lgbtq', 'gender ideology',
      'trans women', 'morphological freedom', 'homotrans',
      'procreative freedom', 'eugenics', 'abortion', 'euthanasia',
      'birth rate', 'population collapse', 'bioconserv',
      'anthropological war', 'dei principles', 'traditions, institutions',
      'roger scruton', 'thomas aquinas', 'postmodernism', 'relativism',
      'hedonism', 'deconstructionist', 'adolescentism',
      'christian masculinity', 'spiritual',
    ],
  },
  {
    pillar: 'health',
    keys: [
      'healthtech', 'healthcare', 'telehealth', 'telemedicine', 'ehealth',
      'mhealth', 'digital health', 'nanomedicine', 'biomarker',
      'medicine', 'medical', 'longevity and technology',
      'ludopathy', 'insomnia', 'sleep disorder', 'restless',
      'mental health', 'depression and anxiety', 'depression ​and anxiety',
      'eating bugs', 'synthetic meat', 'sugar, fat, and alcohol',
      'superfoods', 'nutrition', 'healthy eating', 'intermittent fasting',
      'fasting', 'diet', 'exercise', 'workout', 'fitness',
      'lose weight', 'fat burner', 'lower back pain', 'exoskeleton',
      'internet of bodies', 'fatphobia', 'laughter and happiness in medicine',
      'digital twin in health', 'digital therapeutics', 'wearables in health',
      'wearables in healthtech', 'genetics in human', 'clinical trial',
      '3d printing in health', 'robotics and robots in health',
      'ai in healthcare', 'machine learning and artificial intelligence in healthcare',
      'metaverse in health', 'blockchain, crypto and web3 in health',
      'standards and interoperability in digital health',
      'create value in healthtech', 'neurochemistry', 'beta-endorphins',
      'dopamine', 'serotonin', 'salud', 'medicina', 'deporte',
      'cancer', 'diabetes', 'stroke', 'hypertension',
      'robotic prosthes', 'synthetic biology', 'biotechnology',
      'in healthtech', 'in healthcare', 'in health', 'in medicine',
      'medical devices', 'mobile health', 'on health', 'about drugs',
    ],
  },
  {
    pillar: 'freedom',
    keys: [
      'freedom of speech', 'freedom of expression', 'libertad de expresión',
      'libertarian', 'solana', 'bitcoin', 'crypto', 'web3',
      'blockchain', 'dao', 'defi', 'token', 'dogecoin', 'ethereum', 'satoshi',
      'trump', 'desantis', 'milei', 'meloni', 'bukele', 'musk', 'elon',
      'orban', 'orbán', 'thatcher', 'reagan', 'maga', 'politic', 'politician',
      'geopolitic', 'nato', 'immigration', 'communism', 'socialism', 'capitalism',
      'free market', 'sovereignty', 'sovereignist', 'patriot', 'deep state',
      'censorship', 'propaganda', 'journalism', 'monopoly',
      'epstein', 'globalism', 'globalist', 'collectivism', 'nationalism',
      'populism', 'zionism', 'federal reserve', 'cbdc', 'bilderberg',
      'world economic forum', 'united nations', 'terrorism', 'military',
      'weapons of mass', 'democracy', 'monarchy', 'fascism', 'anarchism',
      'founding fathers', 'american dream', 'silicon valley', 'nvidia',
      'machine learning', 'artificial intelligence', 'agi', 'quantum',
      'cybersecurity', 'hacker', 'snowden', 'assange', 'startup', 'venture',
      'entrepreneur', 'economy', 'inflation', 'investor', 'growth hacking',
      'network effects', 'no-code', 'exponential technolog', 'gepard',
      'homeless', 'prison', 'crime', 'delinquency', 'gangs', 'trafficking',
      'corruption', 'voter fraud', 'racism', 'indigenism', 'colonialism',
      'rothschild', 'rockefeller', 'powerful families', 'metacapital',
      'blackrock', 'vanguard', 'area 51', 'qanon', 'project blue beam',
      'mkultra', 'bunker', 'chernobyl', 'twin towers', 'abraham accords',
      'hamas', 'iran', 'russian revolution', 'orwell', 'arendt',
      'shakespeare', 'da vinci', 'tesla', 'edison', 'henry ford', 'steve jobs',
      'jack ma', 'bezos', 'zuckerberg', 'bill gates', 'harari', 'buterin',
      'tucker carlson', 'charlemagne', 'benjamin franklin',
      'spanishness', 'hispanidad', 'qolitica', 'renaissance', 'graphene',
      '5g technology', 'dark web', 'project 2025', 'mandate for leadership',
      'libertad', 'soberanía', 'frontera', 'censura', 'politica',
      'grok', 'jupiter', 'mining', 'rare earth', 'chicago boys',
      'autonomous agent', 'spacex', 'plandemia', 'chemtrails',
      'adrenochrome', 'big pharma', 'depopulation', 'geoengineering',
      'environmentalism', 'transhuman', 'cyborg', 'android',
      'biological weapon', 'remote, asynchronous', 'decentralized work',
      'stoicism', 'chinese communist', 'human rights', 'fundamental rights',
      'liberty',
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Phrase / long-token includes; short tokens need a word boundary. */
function hayHasKey(hay: string, key: string): boolean {
  const k = key.toLowerCase();
  if (k.length <= 4) {
    return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(k)}(?:[^a-z0-9]|$)`, 'i').test(
      hay
    );
  }
  return hay.includes(k);
}

function scorePillarKeys(titleHay: string, bodyHay: string, keys: string[]): number {
  let score = 0;
  for (const key of keys) {
    const k = key.toLowerCase();
    if (hayHasKey(titleHay, k)) {
      score += k.length >= 12 ? 12 : k.length >= 6 ? 8 : 5;
    } else if (k.length >= 10 && hayHasKey(bodyHay, k)) {
      // Body only counts distinctive phrases — avoid "religion" / "family" noise
      score += k.length >= 12 ? 2 : 1;
    }
  }
  return score;
}

/**
 * Infer primary pillar. Title dominates; body is a tie-breaker only.
 * Default: Freedom (largest Salvazion corpus).
 */
export function inferPillar(
  title: string,
  preview: string,
  _interests: InterestFocus[] = [],
  tags: string[] = []
): ArticlePillar {
  const titleHay = title.toLowerCase();
  const bodyHay = `${preview} ${tags.join(' ')}`.toLowerCase();

  // Salvation: faith · Christianity · family · conservatism
  if (
    /homeschool|family and marriage|christian|bible|gospel|kingdom of god|spiritual gifts?|prayers? and\s+praises|billy graham|martin luther|vatican|crusades|monaster|how can i get to heaven|spiritual warfare|western christian|alerci|christmas|salvazion app|salvation, health and freedom|thomas aquinas|tradwife|traditional wife|teach our children|gender ideology|trans women|morphological freedom|procreative freedom|eugenics|abortion|euthanasia|population collapse|birth rate|anthropological war|bioconserv|bioethics|dei principles|roger scruton|traditions, institutions, and conservatism|all about conservatism|\bconservatism\b|progressivism \(woke\)|woke virus|lgbtq|feminism|postmodernism|relativism|adolescentism|hedonism|deconstructionist|christian masculinity|virtuous people|paganism/i.test(
      title
    )
  ) {
    return 'salvation';
  }

  // Freedom: speech · entrepreneurship · political ideas · technology
  if (
    /\bhuman rights\b|fundamental rights|freedom of speech|great depression/i.test(
      title
    )
  ) {
    return 'freedom';
  }

  // Health: food · healthtech · exercise · sleep
  if (
    /healthtech|healthcare|telehealth|telemedicine|ehealth|mhealth|biomarker|longevity and technology|mental health|diabetes|cancer|stroke|hypertension|insomnia|sleep disorder|exercise and|workout|nutrition|superfood|synthetic meat|eating bugs|ludopathy|digital health|nanomedicine|wearables in health|robotic prosthes|genetics in human|clinical trial|3d printing in health|digital therapeutics|internet of bodies|exoskeleton|fatphobia|laughter.*medicine|neurochemistry|beta-endorphin|create value in healthtech|synthetic biology|socio-health|lose weight|fat burner|lower back pain|machine learning.*healthcare|ai in healthcare|robotics.*health|metaverse in health|blockchain.*web3 in health|virtual, augmented|medical devices|standards and interoperability in digital health|depression\s+and\s+anxiety|health problems|intermittent fasting|healthy eating|about drugs|effects on health|on health|in medicine|in health\b|in healthcare|in healthtech/i.test(
      title
    )
  ) {
    return 'health';
  }

  const scores: Record<ArticlePillar, number> = {
    salvation: 0,
    health: 0,
    freedom: 0,
  };
  for (const rule of PILLAR_RULES) {
    scores[rule.pillar] = scorePillarKeys(titleHay, bodyHay, rule.keys);
  }

  const titleOnly: Record<ArticlePillar, number> = {
    salvation: 0,
    health: 0,
    freedom: 0,
  };
  for (const rule of PILLAR_RULES) {
    for (const key of rule.keys) {
      if (hayHasKey(titleHay, key.toLowerCase())) {
        const k = key.toLowerCase();
        titleOnly[rule.pillar] += k.length >= 12 ? 12 : k.length >= 6 ? 8 : 5;
      }
    }
  }
  const titleOrdered = (Object.entries(titleOnly) as [ArticlePillar, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  if (titleOrdered[0][1] >= 8 && titleOrdered[0][1] > titleOrdered[1][1] + 3) {
    return titleOrdered[0][0];
  }

  const ordered = (Object.entries(scores) as [ArticlePillar, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  if (ordered[0][1] <= 0) return 'freedom';
  if (ordered[0][1] === ordered[1][1]) {
    if (ordered.some(([p, s]) => p === 'freedom' && s === ordered[0][1])) {
      return 'freedom';
    }
  }
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

/** Dedupe catalog by id + normalized title (prefer article URL entries). */
function dedupeCatalog(
  raw: Array<Parameters<typeof normalizeEntry>[0]>
): Array<Parameters<typeof normalizeEntry>[0]> {
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const quality = (a: Parameters<typeof normalizeEntry>[0]) => {
    let s = 0;
    if (a.id && String(a.id) !== 'undefined') s += 10;
    if (a.url?.includes('/i/article/')) s += 5;
    if (a.verified) s += 2;
    return s;
  };
  const byTitle = new Map<string, Parameters<typeof normalizeEntry>[0]>();
  for (const a of raw) {
    if (!a?.id || String(a.id) === 'undefined') continue;
    if (EXCLUDED_IDS.has(String(a.id))) continue;
    const key = norm(a.title || '');
    const prev = byTitle.get(key);
    if (!prev || quality(a) > quality(prev)) byTitle.set(key, a);
  }
  const seen = new Set<string>();
  const out: Array<Parameters<typeof normalizeEntry>[0]> = [];
  for (const a of byTitle.values()) {
    const id = String(a.id);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(a);
  }
  return out;
}

export const X_ARTICLES: XArticle[] = dedupeCatalog(
  catalogJson as Array<Parameters<typeof normalizeEntry>[0]>
).map(normalizeEntry);

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
    article.preview,
    article.previewEs,
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

export interface BlogArticleRank {
  /** profile.currentFocus — unread + interest + recency */
  focus?: string[];
  /** Prefer unread first (app feed). Default false. */
  unreadFirst?: boolean;
}

/**
 * Articles for landing blog + Freedom feed.
 * Optional pillar filter + keyword search.
 * When `rank.focus` is set, order is unread (optional) → interest match → recency.
 * Otherwise newest-first.
 */
export function getBlogArticles(
  pillar?: ArticlePillar | 'all',
  query?: string,
  rank?: BlogArticleRank
): XArticle[] {
  let list = [...X_ARTICLES];
  if (pillar && pillar !== 'all') {
    list = list.filter((a) => a.pillar === pillar);
  }
  if (query?.trim()) {
    list = list.filter((a) => articleMatchesQuery(a, query));
  }

  const focus = (rank?.focus || []).filter(Boolean);
  const unreadFirst = !!rank?.unreadFirst;
  const readSet = unreadFirst ? new Set(loadReadArticleIds()) : null;

  list.sort((a, b) => {
    if (readSet) {
      const ar = readSet.has(a.id) ? 1 : 0;
      const br = readSet.has(b.id) ? 1 : 0;
      if (ar !== br) return ar - br;
    }
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
