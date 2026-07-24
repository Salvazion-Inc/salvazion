import { BibleChapter, BibleLanguage, BibleBook, ReadingProgress } from './types';
import { BIBLE_BOOKS, SAMPLE_CHAPTERS, ORIGINAL_NOTES } from '@/data/bible/sample';

const STORAGE_PROGRESS = 'salvazion_bible_progress';

export function getBooks(): BibleBook[] {
  return BIBLE_BOOKS;
}

export function getChapter(
  bookId: string,
  chapter: number,
  language: BibleLanguage = 'es'
): BibleChapter | null {
  if (language === 'original') {
    // Devuelve la versión ES + nota de original cuando existe
    const base = SAMPLE_CHAPTERS.find(
      c => c.bookId === bookId && c.chapter === chapter && c.language === 'es'
    );
    if (!base) return null;
    return {
      ...base,
      language: 'original',
      version: 'Original (Hebreo/Griego) — muestra',
      verses: base.verses.map(v => ({
        ...v,
        text: v.number === 1 && ORIGINAL_NOTES[`${bookId}-${chapter}`]
          ? `${ORIGINAL_NOTES[`${bookId}-${chapter}`]}\n\n${v.text}`
          : v.text
      }))
    };
  }

  return (
    SAMPLE_CHAPTERS.find(
      c => c.bookId === bookId && c.chapter === chapter && c.language === language
    ) || null
  );
}

export function getAvailableChapters(bookId: string, language: BibleLanguage): number[] {
  return SAMPLE_CHAPTERS
    .filter(c => c.bookId === bookId && (c.language === language || language === 'original'))
    .map(c => c.chapter)
    .sort((a, b) => a - b);
}

/** Progreso de lectura */
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
      completedAt: new Date().toISOString()
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
