import { BibleChapter, BibleLanguage, BibleBook, ReadingProgress } from './types';
import { BIBLE_BOOKS, SAMPLE_CHAPTERS } from '@/data/bible/sample';

const STORAGE_PROGRESS = 'salvazion_bible_progress';

// Chapter cache + book-file cache (one fetch per book)
const chapterCache = new Map<string, BibleChapter>();
const bookFileCache = new Map<string, BookFilePayload>();

interface BookFilePayload {
  book: string;
  bookId: string;
  version: string;
  chapters: { chapter: number; verses: { number: number; text: string }[] }[];
}

const VERSION_LABEL: Record<BibleLanguage, string> = {
  es: 'Reina Valera 1909',
  en: 'King James Version',
  original: 'Original (Hebreo / Griego)',
};

export function getBooks(): BibleBook[] {
  return BIBLE_BOOKS;
}

export function getBook(bookId: string): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => b.id === bookId);
}

export function getAvailableChapters(bookId: string, _language: BibleLanguage = 'es'): number[] {
  const book = getBook(bookId);
  if (!book) return [];
  return Array.from({ length: book.chapters }, (_, i) => i + 1);
}

function versionLabelFor(language: BibleLanguage, book?: BibleBook, fromFile?: string): string {
  if (fromFile) return fromFile;
  if (language === 'original' && book) {
    return book.testament === 'OT'
      ? 'Hebreo · Westminster Leningrad Codex'
      : 'Griego · Textus Receptus';
  }
  return VERSION_LABEL[language];
}

/** Prefer book-level offline JSON: /bible/{lang}/books/{bookId}.json */
function getBookJsonPath(bookId: string, language: BibleLanguage): string {
  return `/bible/${language}/books/${bookId}.json`;
}

/** Legacy per-chapter path still supported */
function getChapterJsonPath(bookId: string, chapter: number, language: BibleLanguage): string {
  return `/bible/${language}/${bookId}-${chapter}.json`;
}

async function loadBookFile(
  bookId: string,
  language: BibleLanguage
): Promise<BookFilePayload | null> {
  const key = `${language}:${bookId}`;
  if (bookFileCache.has(key)) return bookFileCache.get(key)!;

  if (typeof window === 'undefined') return null;

  try {
    const res = await fetch(getBookJsonPath(bookId, language), { cache: 'force-cache' });
    if (!res.ok) return null;
    const data = (await res.json()) as BookFilePayload;
    if (!data?.chapters?.length) return null;
    bookFileCache.set(key, data);
    return data;
  } catch {
    return null;
  }
}

/**
 * Full chapter loader — offline book JSON first, then legacy chapter JSON,
 * then curated samples, then a clear placeholder.
 */
export async function getChapter(
  bookId: string,
  chapter: number,
  language: BibleLanguage = 'es'
): Promise<BibleChapter | null> {
  const book = getBook(bookId);
  if (!book || chapter < 1 || chapter > book.chapters) return null;

  const cacheKey = `${language}:${bookId}:${chapter}`;
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey)!;
  }

  // 1. Book-level offline dataset (full canon)
  const bookFile = await loadBookFile(bookId, language);
  if (bookFile) {
    const ch = bookFile.chapters.find((c) => c.chapter === chapter);
    if (ch && ch.verses?.length) {
      const chapterData: BibleChapter = {
        book: bookFile.book || (language === 'en' ? book.name : book.nameEs),
        bookId,
        chapter,
        language,
        version: versionLabelFor(language, book, bookFile.version),
        verses: ch.verses.map((v) => ({ number: v.number, text: v.text })),
      };
      chapterCache.set(cacheKey, chapterData);
      return chapterData;
    }
  }

  // 2. Legacy per-chapter JSON
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(getChapterJsonPath(bookId, chapter, language), {
        cache: 'force-cache',
      });
      if (res.ok) {
        const data = await res.json();
        const chapterData: BibleChapter = {
          book: data.book || (language === 'en' ? book.name : book.nameEs),
          bookId,
          chapter,
          language,
          version: versionLabelFor(language, book, data.version),
          verses: data.verses || [],
        };
        chapterCache.set(cacheKey, chapterData);
        return chapterData;
      }
    } catch {
      // fall through
    }
  }

  // 3. Curated samples
  const sampleLang = language === 'original' ? 'es' : language;
  const sample = SAMPLE_CHAPTERS.find(
    (c) => c.bookId === bookId && c.chapter === chapter && c.language === sampleLang
  );
  if (sample) {
    const chapterData: BibleChapter = {
      ...sample,
      language,
      version:
        language === 'original'
          ? versionLabelFor(language, book) + ' — muestra'
          : sample.version,
    };
    chapterCache.set(cacheKey, chapterData);
    return chapterData;
  }

  // 4. Placeholder
  const isEnglish = language === 'en';
  const bookName = isEnglish ? book.name : book.nameEs;
  const placeholder: BibleChapter = {
    book: bookName,
    bookId,
    chapter,
    language,
    version: versionLabelFor(language, book) + ' — cargando dataset',
    verses: [
      {
        number: 1,
        text: isEnglish
          ? `Chapter ${chapter} of ${bookName} is not in the offline pack yet. Run: node scripts/build-bible.mjs`
          : `El capítulo ${chapter} de ${bookName} aún no está en el paquete offline. Ejecuta: node scripts/build-bible.mjs`,
      },
    ],
  };
  chapterCache.set(cacheKey, placeholder);
  return placeholder;
}

export function getChapterSync(
  bookId: string,
  chapter: number,
  language: BibleLanguage = 'es'
): BibleChapter | null {
  const book = getBook(bookId);
  if (!book || chapter < 1 || chapter > book.chapters) return null;

  const sampleLang = language === 'original' ? 'es' : language;
  return (
    SAMPLE_CHAPTERS.find(
      (c) => c.bookId === bookId && c.chapter === chapter && c.language === sampleLang
    ) || null
  );
}

export function loadReadingProgress(): ReadingProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markChapterRead(bookId: string, chapter: number): void {
  if (typeof window === 'undefined') return;
  const progress = loadReadingProgress();
  const exists = progress.some((p) => p.bookId === bookId && p.chapter === chapter);
  if (!exists) {
    progress.push({
      bookId,
      chapter,
      completedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress));
  }
}

export function isChapterRead(bookId: string, chapter: number): boolean {
  return loadReadingProgress().some((p) => p.bookId === bookId && p.chapter === chapter);
}

export function getReadCount(): number {
  return loadReadingProgress().length;
}

export function getTotalChapters(): number {
  return BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
}

export function getBibleVersionLabel(language: BibleLanguage): string {
  return VERSION_LABEL[language];
}
