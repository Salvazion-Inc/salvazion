export type BibleLanguage = 'es' | 'en' | 'pt' | 'original';

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  book: string;
  bookId: string;
  chapter: number;
  verses: BibleVerse[];
  version: string;
  language: BibleLanguage;
}

export interface BibleBook {
  id: string;
  name: string;
  nameEs: string;
  namePt: string;
  testament: 'OT' | 'NT';
  chapters: number;
}

export function bookDisplayName(
  book: BibleBook,
  lang: BibleLanguage | string
): string {
  if (lang === 'en') return book.name;
  if (lang === 'pt') return book.namePt;
  return book.nameEs;
}

export interface ReadingProgress {
  bookId: string;
  chapter: number;
  completedAt: string;
}
