import { BIBLE_BOOKS } from '@/data/bible/sample';
import { BibleLanguage } from './types';
import { getBook, getBooks } from './engine';

export type TestamentFilter = 'all' | 'OT' | 'NT';

export interface IndexedVerse {
  bookId: string;
  bookName: string;
  bookNameEs: string;
  testament: 'OT' | 'NT';
  chapter: number;
  verse: number;
  text: string;
  /** lowercase + accent-stripped for matching */
  norm: string;
}

export interface SearchHit {
  verse: IndexedVerse;
  score: number;
  /** character ranges in original text for highlight [start, end) */
  ranges: [number, number][];
}

export interface ConcordanceEntry {
  verse: IndexedVerse;
  /** surrounding snippet with the word centered when possible */
  snippet: string;
  ranges: [number, number][];
}

export interface CorpusStatus {
  language: BibleLanguage;
  ready: boolean;
  loadedBooks: number;
  totalBooks: number;
  verseCount: number;
}

interface BookFilePayload {
  book: string;
  bookId: string;
  version: string;
  chapters: { chapter: number; verses: { number: number; text: string }[] }[];
}

const corpusCache = new Map<BibleLanguage, IndexedVerse[]>();
const loadPromises = new Map<BibleLanguage, Promise<IndexedVerse[]>>();

const STORAGE_RECENT = 'salvazion_bible_recent_searches';
const MAX_RECENT = 12;

/** Normalize for accent-insensitive search (ES/EN). Keeps Hebrew/Greek letters. */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(query: string): string[] {
  return normalizeText(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);
}

/** Find highlight ranges in original text for a list of terms (accent-insensitive). */
export function findHighlightRanges(text: string, terms: string[]): [number, number][] {
  if (!terms.length || !text) return [];
  const ranges: [number, number][] = [];
  const normTerms = terms.map(normalizeText).filter(Boolean);

  // Map each original index → norm stream for approximate mapping via walk
  // Simpler: scan original with case/accent fold per potential match window
  const lower = text;
  for (const term of normTerms) {
    if (!term) continue;
    // Sliding scan
    let i = 0;
    while (i < lower.length) {
      // take a slice of similar length + accents slack
      const maxLen = Math.min(lower.length - i, term.length + 8);
      let matched = false;
      for (let len = Math.min(maxLen, term.length + 4); len >= Math.max(1, term.length - 2); len--) {
        const slice = lower.slice(i, i + len);
        if (normalizeText(slice) === term) {
          ranges.push([i, i + len]);
          i += len;
          matched = true;
          break;
        }
      }
      if (!matched) i += 1;
    }
  }

  // merge overlapping
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

async function fetchBookFile(
  bookId: string,
  language: BibleLanguage
): Promise<BookFilePayload | null> {
  try {
    const res = await fetch(`/bible/${language}/books/${bookId}.json`, {
      cache: 'force-cache',
    });
    if (!res.ok) return null;
    return (await res.json()) as BookFilePayload;
  } catch {
    return null;
  }
}

/**
 * Load full verse corpus for a language (cached in memory).
 * Calls onProgress during first load.
 */
export async function ensureCorpus(
  language: BibleLanguage,
  onProgress?: (status: CorpusStatus) => void
): Promise<IndexedVerse[]> {
  if (corpusCache.has(language)) {
    const verses = corpusCache.get(language)!;
    onProgress?.({
      language,
      ready: true,
      loadedBooks: getBooks().length,
      totalBooks: getBooks().length,
      verseCount: verses.length,
    });
    return verses;
  }

  if (loadPromises.has(language)) {
    return loadPromises.get(language)!;
  }

  const promise = (async () => {
    const books = getBooks();
    const all: IndexedVerse[] = [];
    let loaded = 0;

    // Parallel batches of 6 for speed without flooding
    const batchSize = 6;
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      const files = await Promise.all(batch.map((b) => fetchBookFile(b.id, language)));
      batch.forEach((meta, idx) => {
        const file = files[idx];
        loaded++;
        if (!file?.chapters) return;
        for (const ch of file.chapters) {
          for (const v of ch.verses || []) {
            const text = (v.text || '').trim();
            if (!text) continue;
            all.push({
              bookId: meta.id,
              bookName: meta.name,
              bookNameEs: meta.nameEs,
              testament: meta.testament,
              chapter: ch.chapter,
              verse: v.number,
              text,
              norm: normalizeText(text),
            });
          }
        }
      });
      onProgress?.({
        language,
        ready: false,
        loadedBooks: loaded,
        totalBooks: books.length,
        verseCount: all.length,
      });
    }

    corpusCache.set(language, all);
    onProgress?.({
      language,
      ready: true,
      loadedBooks: books.length,
      totalBooks: books.length,
      verseCount: all.length,
    });
    return all;
  })();

  loadPromises.set(language, promise);
  try {
    return await promise;
  } finally {
    loadPromises.delete(language);
  }
}

export function formatRef(v: IndexedVerse, language: BibleLanguage): string {
  const name = language === 'en' ? v.bookName : v.bookNameEs;
  return `${name} ${v.chapter}:${v.verse}`;
}

/**
 * Full-text / multi-word verse search.
 * - Phrase (quoted) exact-ish match on normalized text
 * - Otherwise all tokens must match (AND), scored by density + order
 */
export async function searchVerses(
  query: string,
  opts: {
    language: BibleLanguage;
    testament?: TestamentFilter;
    limit?: number;
    onProgress?: (s: CorpusStatus) => void;
  }
): Promise<{ hits: SearchHit[]; total: number; status: CorpusStatus }> {
  const language = opts.language;
  const limit = opts.limit ?? 80;
  const testament = opts.testament ?? 'all';
  const q = query.trim();

  const corpus = await ensureCorpus(language, opts.onProgress);
  const status: CorpusStatus = {
    language,
    ready: true,
    loadedBooks: getBooks().length,
    totalBooks: getBooks().length,
    verseCount: corpus.length,
  };

  if (!q) return { hits: [], total: 0, status };

  // Reference jump: "Juan 3:16" / "John 3:16" / "1jn 4:8"
  const ref = parseReference(q, language);
  if (ref) {
    const hits = corpus
      .filter(
        (v) =>
          v.bookId === ref.bookId &&
          v.chapter === ref.chapter &&
          (ref.verse == null || v.verse === ref.verse) &&
          (testament === 'all' || v.testament === testament)
      )
      .slice(0, limit)
      .map((verse) => ({
        verse,
        score: 1000,
        ranges: [] as [number, number][],
      }));
    return { hits, total: hits.length, status };
  }

  const phraseMatch = q.match(/^["“](.+)["”]$/);
  const isPhrase = !!phraseMatch;
  const terms = isPhrase ? [normalizeText(phraseMatch![1])] : tokenize(q);
  if (!terms.length) return { hits: [], total: 0, status };

  const filtered = corpus.filter((v) => testament === 'all' || v.testament === testament);
  const hits: SearchHit[] = [];

  for (const verse of filtered) {
    if (isPhrase) {
      if (!verse.norm.includes(terms[0])) continue;
      hits.push({
        verse,
        score: 50 + (verse.norm.startsWith(terms[0]) ? 10 : 0),
        ranges: findHighlightRanges(verse.text, terms),
      });
      continue;
    }

    let score = 0;
    let all = true;
    for (const t of terms) {
      if (!verse.norm.includes(t)) {
        all = false;
        break;
      }
      score += 10;
      // whole-word bonus
      const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeReg(t)}(?:$|[^\\p{L}\\p{N}])`, 'u');
      if (re.test(verse.norm)) score += 6;
    }
    if (!all) continue;
    // prefer shorter verses slightly (density)
    score += Math.max(0, 20 - Math.floor(verse.norm.length / 40));
    hits.push({
      verse,
      score,
      ranges: findHighlightRanges(verse.text, terms),
    });
  }

  hits.sort((a, b) => b.score - a.score || a.verse.bookId.localeCompare(b.verse.bookId));
  const total = hits.length;
  return { hits: hits.slice(0, limit), total, status };
}

/**
 * Concordance: exact-ish whole-word occurrences of a single term.
 */
export async function concordance(
  word: string,
  opts: {
    language: BibleLanguage;
    testament?: TestamentFilter;
    limit?: number;
    onProgress?: (s: CorpusStatus) => void;
  }
): Promise<{ entries: ConcordanceEntry[]; total: number; status: CorpusStatus }> {
  const language = opts.language;
  const limit = opts.limit ?? 100;
  const testament = opts.testament ?? 'all';
  const term = normalizeText(word).replace(/[^\p{L}\p{N}]/gu, '');

  const corpus = await ensureCorpus(language, opts.onProgress);
  const status: CorpusStatus = {
    language,
    ready: true,
    loadedBooks: getBooks().length,
    totalBooks: getBooks().length,
    verseCount: corpus.length,
  };

  if (term.length < 2) return { entries: [], total: 0, status };

  const wordRe = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeReg(term)}(?:$|[^\\p{L}\\p{N}])`, 'u');
  const entries: ConcordanceEntry[] = [];

  for (const verse of corpus) {
    if (testament !== 'all' && verse.testament !== testament) continue;
    if (!wordRe.test(verse.norm) && !verse.norm.includes(term)) continue;
    // Prefer whole word; allow partial if word is longer (stems)
    const whole = wordRe.test(verse.norm);
    if (!whole && term.length < 4) continue;
    if (!verse.norm.includes(term)) continue;

    const ranges = findHighlightRanges(verse.text, [term]);
    entries.push({
      verse,
      snippet: verse.text,
      ranges,
    });
  }

  // Sort: NT first slightly for common gospel words? Keep canonical book order
  const bookOrder = new Map(BIBLE_BOOKS.map((b, i) => [b.id, i]));
  entries.sort((a, b) => {
    const bo = (bookOrder.get(a.verse.bookId) ?? 0) - (bookOrder.get(b.verse.bookId) ?? 0);
    if (bo !== 0) return bo;
    if (a.verse.chapter !== b.verse.chapter) return a.verse.chapter - b.verse.chapter;
    return a.verse.verse - b.verse.verse;
  });

  const total = entries.length;
  return { entries: entries.slice(0, limit), total, status };
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Parse human Bible references into book/chapter/verse */
export function parseReference(
  input: string,
  _language?: BibleLanguage
): { bookId: string; chapter: number; verse?: number } | null {
  const raw = input.trim();
  // Patterns: "1 Juan 4:8", "Juan 3:16", "gen 1:1", "Salmos 23", "Ps 23:1"
  const m = raw.match(
    /^((?:\d\s*)?[\p{L}\.][\p{L}\s\.]*?)\s+(\d{1,3})(?:\s*[:.,]\s*(\d{1,3}))?$/u
  );
  if (!m) return null;

  const bookPart = m[1].trim().toLowerCase().replace(/\./g, '');
  const chapter = parseInt(m[2], 10);
  const verse = m[3] ? parseInt(m[3], 10) : undefined;
  if (!chapter || chapter < 1) return null;

  const bookId = resolveBookId(bookPart);
  if (!bookId) return null;
  const book = getBook(bookId);
  if (!book || chapter > book.chapters) return null;
  return { bookId, chapter, verse };
}

const ALIASES: Record<string, string> = {
  // ES
  genesis: 'gen', génesis: 'gen', gen: 'gen',
  exodo: 'exo', éxodo: 'exo', exo: 'exo', ex: 'exo',
  levitico: 'lev', levítico: 'lev', lev: 'lev',
  numeros: 'num', números: 'num', num: 'num', nm: 'num',
  deuteronomio: 'deu', deu: 'deu', dt: 'deu',
  josue: 'jos', josué: 'jos', jos: 'jos',
  jueces: 'jdg', jdg: 'jdg',
  rut: 'rut', ruth: 'rut',
  '1 samuel': '1sa', '1samuel': '1sa', '1sa': '1sa',
  '2 samuel': '2sa', '2samuel': '2sa', '2sa': '2sa',
  '1 reyes': '1ki', '1reyes': '1ki', '1ki': '1ki',
  '2 reyes': '2ki', '2reyes': '2ki', '2ki': '2ki',
  '1 cronicas': '1ch', '1 crónicas': '1ch', '1ch': '1ch',
  '2 cronicas': '2ch', '2 crónicas': '2ch', '2ch': '2ch',
  esdras: 'ezr', ezr: 'ezr',
  nehemias: 'neh', nehemías: 'neh', neh: 'neh',
  ester: 'est', esther: 'est', est: 'est',
  job: 'job',
  salmos: 'psa', salmo: 'psa', psa: 'psa', ps: 'psa', psalm: 'psa', psalms: 'psa',
  proverbios: 'pro', pro: 'pro', prov: 'pro',
  eclesiastes: 'ecc', eclesiastés: 'ecc', ecc: 'ecc',
  cantares: 'sng', cantar: 'sng', sng: 'sng',
  isaias: 'isa', isaías: 'isa', isa: 'isa',
  jeremias: 'jer', jeremías: 'jer', jer: 'jer',
  lamentaciones: 'lam', lam: 'lam',
  ezequiel: 'ezk', ezk: 'ezk', eze: 'ezk',
  daniel: 'dan', dan: 'dan',
  oseas: 'hos', hos: 'hos',
  joel: 'jol', jol: 'jol',
  amos: 'amo', amós: 'amo', amo: 'amo',
  abdias: 'oba', abdías: 'oba', oba: 'oba',
  jonas: 'jon', jonás: 'jon', jon: 'jon',
  miqueas: 'mic', mic: 'mic',
  nahum: 'nam', nahúm: 'nam', nam: 'nam',
  habacuc: 'hab', hab: 'hab',
  sofonias: 'zep', sofonías: 'zep', zep: 'zep',
  hageo: 'hag', hag: 'hag',
  zacarias: 'zec', zacarías: 'zec', zec: 'zec',
  malaquias: 'mal', malaquías: 'mal', mal: 'mal',
  mateo: 'mat', matthew: 'mat', mat: 'mat', mt: 'mat',
  marcos: 'mrk', mark: 'mrk', mrk: 'mrk', mk: 'mrk',
  lucas: 'luk', luke: 'luk', luk: 'luk', lc: 'luk',
  juan: 'jhn', john: 'jhn', jhn: 'jhn', jn: 'jhn',
  hechos: 'act', acts: 'act', act: 'act',
  romanos: 'rom', romans: 'rom', rom: 'rom', ro: 'rom',
  '1 corintios': '1co', '1corintios': '1co', '1co': '1co',
  '2 corintios': '2co', '2corintios': '2co', '2co': '2co',
  galatas: 'gal', gálatas: 'gal', galatians: 'gal', gal: 'gal',
  efesios: 'eph', ephesians: 'eph', eph: 'eph',
  filipenses: 'php', philippians: 'php', php: 'php',
  colosenses: 'col', colossians: 'col', col: 'col',
  '1 tesalonicenses': '1th', '1th': '1th',
  '2 tesalonicenses': '2th', '2th': '2th',
  '1 timoteo': '1ti', '1ti': '1ti',
  '2 timoteo': '2ti', '2ti': '2ti',
  tito: 'tit', titus: 'tit', tit: 'tit',
  filemon: 'phm', filemón: 'phm', philemon: 'phm', phm: 'phm',
  hebreos: 'heb', hebrews: 'heb', heb: 'heb',
  santiago: 'jas', james: 'jas', jas: 'jas',
  '1 pedro': '1pe', '1pe': '1pe',
  '2 pedro': '2pe', '2pe': '2pe',
  '1 juan': '1jn', '1juan': '1jn', '1jn': '1jn', '1 john': '1jn',
  '2 juan': '2jn', '2juan': '2jn', '2jn': '2jn',
  '3 juan': '3jn', '3juan': '3jn', '3jn': '3jn',
  judas: 'jud', jude: 'jud', jud: 'jud',
  apocalipsis: 'rev', revelation: 'rev', rev: 'rev', ap: 'rev',
  // EN common (only keys not already listed above)
  exodus: 'exo',
  leviticus: 'lev',
  numbers: 'num',
  deuteronomy: 'deu',
  joshua: 'jos',
  judges: 'jdg',
  proverbs: 'pro',
  ecclesiastes: 'ecc',
  isaiah: 'isa',
  jeremiah: 'jer',
  ezekiel: 'ezk',
  hosea: 'hos',
  obadiah: 'oba',
  jonah: 'jon',
  micah: 'mic',
  habakkuk: 'hab',
  zephaniah: 'zep',
  haggai: 'hag',
  zechariah: 'zec',
  malachi: 'mal',
};

function resolveBookId(part: string): string | null {
  const key = part.toLowerCase().replace(/\s+/g, ' ').trim();
  if (ALIASES[key]) return ALIASES[key];

  // direct id
  if (getBook(key)) return key;

  // match name / nameEs
  const books = getBooks();
  const found = books.find((b) => {
    const en = b.name.toLowerCase();
    const es = b.nameEs.toLowerCase();
    return en === key || es === key || en.startsWith(key) || es.startsWith(key);
  });
  return found?.id ?? null;
}

export function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_RECENT);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(q: string): string[] {
  if (typeof window === 'undefined') return [];
  const cleaned = q.trim();
  if (cleaned.length < 2) return loadRecentSearches();
  const prev = loadRecentSearches().filter((x) => x.toLowerCase() !== cleaned.toLowerCase());
  const next = [cleaned, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_RECENT, JSON.stringify(next));
  return next;
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_RECENT);
}

/** Suggested starter words per language for empty state */
export const SUGGESTED_SEARCHES: Record<BibleLanguage, string[]> = {
  es: ['amor', 'fe', 'perdón', 'león', 'salvación', 'Juan 3:16', 'Salmos 23'],
  en: ['love', 'faith', 'grace', 'lion', 'salvation', 'John 3:16', 'Psalm 23'],
  original: ['αγαπη', 'πιστις', 'λογος', 'θεος', 'יהוה', 'בראשית'],
};

export const SUGGESTED_CONCORDANCE: Record<BibleLanguage, string[]> = {
  es: ['Dios', 'amor', 'fe', 'Jesús', 'espíritu', 'corazón', 'vida'],
  en: ['God', 'love', 'faith', 'Jesus', 'spirit', 'heart', 'life'],
  original: ['θεος', 'αγαπη', 'κυριος', 'χριστος', 'πνευμα'],
};
