import { BibleChapter, BibleLanguage, BibleBook, ReadingProgress } from './types';
import { BIBLE_BOOKS, SAMPLE_CHAPTERS, ORIGINAL_NOTES } from '@/data/bible/sample';

const STORAGE_PROGRESS = 'salvazion_bible_progress';

// Simple in-memory cache for offline JSON chapters
const chapterCache = new Map<string, BibleChapter>();

export function getBooks(): BibleBook[] {
  return BIBLE_BOOKS;
}

export function getBook(bookId: string): BibleBook | undefined {
  return BIBLE_BOOKS.find(b => b.id === bookId);
}

/**
 * Returns every chapter number for the book (1..N).
 * Full Protestant canon (66 books · 1189 chapters).
 */
export function getAvailableChapters(bookId: string, _language: BibleLanguage = 'es'): number[] {
  const book = getBook(bookId);
  if (!book) return [];
  return Array.from({ length: book.chapters }, (_, i) => i + 1);
}

/**
 * Builds the public path for a chapter JSON.
 * Convention: /bible/{lang}/{bookId}-{chapter}.json
 * Example: /bible/es/gen-1.json  /bible/en/psa-23.json
 */
function getChapterJsonPath(bookId: string, chapter: number, language: BibleLanguage): string {
  const lang = language === 'original' ? 'es' : language;
  return `/bible/${lang}/${bookId}-${chapter}.json`;
}

/**
 * Async loader — prefers offline JSON from public/bible/.
 * Falls back to curated SAMPLE_CHAPTERS, then to a respectful placeholder.
 * Once the full dataset is dropped into public/bible/{es|en}/ the app becomes
 * fully offline without any code change.
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

  // 1. Try offline JSON first (full dataset path)
  if (typeof window !== 'undefined') {
    try {
      const path = getChapterJsonPath(bookId, chapter, language);
      const res = await fetch(path, { cache: 'force-cache' });
      if (res.ok) {
        const data = await res.json();
        const version =
          language === 'en'
            ? 'King James Version'
            : language === 'original'
              ? 'Original (Hebreo/Griego)'
              : 'Reina Valera 1960';

        let verses = data.verses || [];
        if (language === 'original' && ORIGINAL_NOTES[`${bookId}-${chapter}`] && verses.length > 0) {
          verses = verses.map((v: { number: number; text: string }, idx: number) =>
            idx === 0
              ? { ...v, text: `${ORIGINAL_NOTES[`${bookId}-${chapter}`]}\n\n${v.text}` }
              : v
          );
        }

        const chapterData: BibleChapter = {
          book: data.book || (language === 'en' ? book.name : book.nameEs),
          bookId,
          chapter,
          language,
          version,
          verses,
        };
        chapterCache.set(cacheKey, chapterData);
        return chapterData;
      }
    } catch {
      // network or file missing → fall through
    }
  }

  // 2. Curated sample (always available, even SSR)
  if (language === 'original') {
    const base = SAMPLE_CHAPTERS.find(
      c => c.bookId === bookId && c.chapter === chapter && c.language === 'es'
    );
    if (base) {
      const chapterData: BibleChapter = {
        ...base,
        language: 'original',
        version: 'Original (Hebreo/Griego) — muestra',
        verses: base.verses.map(v => ({
          ...v,
          text:
            v.number === 1 && ORIGINAL_NOTES[`${bookId}-${chapter}`]
              ? `${ORIGINAL_NOTES[`${bookId}-${chapter}`]}\n\n${v.text}`
              : v.text,
        })),
      };
      chapterCache.set(cacheKey, chapterData);
      return chapterData;
    }
  }

  const sample = SAMPLE_CHAPTERS.find(
    c => c.bookId === bookId && c.chapter === chapter && c.language === (language === 'original' ? 'es' : language)
  );
  if (sample) {
    chapterCache.set(cacheKey, sample);
    return sample;
  }

  // 3. Placeholder — structure is complete, full text still being populated
  const isEnglish = language === 'en';
  const bookName = isEnglish ? book.name : book.nameEs;
  const versionLabel = isEnglish
    ? 'King James Version — full text loading'
    : 'Reina Valera 1960 — texto completo en preparación';

  const placeholder: BibleChapter = {
    book: bookName,
    bookId,
    chapter,
    language,
    version: versionLabel,
    verses: [
      {
        number: 1,
        text: isEnglish
          ? `Chapter ${chapter} of ${bookName}. The full Protestant canon (66 books · 1189 chapters) is ready. Drop the complete offline JSON files into /public/bible/en/ (and /es/) following the pattern {bookId}-{chapter}.json and this chapter will appear automatically. Key passages already present: Genesis 1, Psalm 23, John 1, Romans 12, Revelation 5 (Lion of Judah).`
          : `Capítulo ${chapter} de ${bookName}. El catálogo canónico completo (66 libros · 1189 capítulos) está listo. Coloca los JSON offline en /public/bible/es/ (y /en/) con el patrón {bookId}-{chapter}.json y este capítulo aparecerá automáticamente. Pasajes clave ya cargados: Génesis 1, Salmos 23, Juan 1, Romanos 12, Apocalipsis 5 (León de Judá).`,
      },
    ],
  };
  chapterCache.set(cacheKey, placeholder);
  return placeholder;
}

/** Synchronous helper for SSR / initial render (uses samples only) */
export function getChapterSync(
  bookId: string,
  chapter: number,
  language: BibleLanguage = 'es'
): BibleChapter | null {
  const book = getBook(bookId);
  if (!book || chapter < 1 || chapter > book.chapters) return null;

  if (language === 'original') {
    const base = SAMPLE_CHAPTERS.find(
      c => c.bookId === bookId && c.chapter === chapter && c.language === 'es'
    );
    if (base) {
      return {
        ...base,
        language: 'original',
        version: 'Original (Hebreo/Griego) — muestra',
        verses: base.verses.map(v => ({
          ...v,
          text:
            v.number === 1 && ORIGINAL_NOTES[`${bookId}-${chapter}`]
              ? `${ORIGINAL_NOTES[`${bookId}-${chapter}`]}\n\n${v.text}`
              : v.text,
        })),
      };
    }
  }

  return (
    SAMPLE_CHAPTERS.find(
      c => c.bookId === bookId && c.chapter === chapter && c.language === language
    ) || null
  );
}

/** Reading progress (local) */
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
  const exists = progress.some(p => p.bookId === bookId && p.chapter === chapter);
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
  return loadReadingProgress().some(p => p.bookId === bookId && p.chapter === chapter);
}

export function getReadCount(): number {
  return loadReadingProgress().length;
}

/** Total chapters in the complete Protestant canon */
export function getTotalChapters(): number {
  return BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
}
