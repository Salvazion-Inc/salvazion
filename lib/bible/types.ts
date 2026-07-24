export type BibleLanguage = 'es' | 'en' | 'original';

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
  testament: 'OT' | 'NT';
  chapters: number;
}

export interface ReadingProgress {
  bookId: string;
  chapter: number;
  completedAt: string;
}
