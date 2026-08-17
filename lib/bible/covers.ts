/**
 * Portadas de libros bíblicos — assets en /public/bible/covers/{bookId}.jpg
 * Cinematográficas 3:4, tema de cada libro, acento #8FD99A.
 */

export const BIBLE_COVER_BASE = '/bible/covers';

/** Orden canónico 66 libros (coincide con data/bible/sample BIBLE_BOOKS). */
export const BIBLE_COVER_BOOK_IDS = [
  'gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut',
  '1sa', '2sa', '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est',
  'job', 'psa', 'pro', 'ecc', 'sng',
  'isa', 'jer', 'lam', 'ezk', 'dan',
  'hos', 'jol', 'amo', 'oba', 'jon', 'mic', 'nam', 'hab', 'zep', 'hag', 'zec', 'mal',
  'mat', 'mrk', 'luk', 'jhn', 'act',
  'rom', '1co', '2co', 'gal', 'eph', 'php', 'col',
  '1th', '2th', '1ti', '2ti', 'tit', 'phm',
  'heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev',
] as const;

export type BibleCoverBookId = (typeof BIBLE_COVER_BOOK_IDS)[number];

/** Extensión preferida de los assets generados. */
export const BIBLE_COVER_EXT = 'jpg';

export function getBookCoverSrc(bookId: string): string {
  return `${BIBLE_COVER_BASE}/${bookId}.${BIBLE_COVER_EXT}`;
}

/** Tema de color sutil por testamento / sección (para fallback y marcos). */
export function getBookCoverAccent(bookId: string, testament: 'OT' | 'NT'): string {
  if (testament === 'NT') {
    if (['mat', 'mrk', 'luk', 'jhn'].includes(bookId)) return 'from-[#1a2e1c] to-[#040404]';
    if (bookId === 'act') return 'from-[#1e3320] to-[#040404]';
    if (bookId === 'rev') return 'from-[#243828] to-[#040404]';
    return 'from-[#152418] to-[#040404]';
  }
  // OT
  if (['gen', 'exo', 'lev', 'num', 'deu'].includes(bookId)) return 'from-[#1a281c] to-[#040404]';
  if (['psa', 'pro', 'ecc', 'sng', 'job'].includes(bookId)) return 'from-[#18241c] to-[#040404]';
  if (['isa', 'jer', 'lam', 'ezk', 'dan'].includes(bookId)) return 'from-[#1c2618] to-[#040404]';
  return 'from-[#141c14] to-[#040404]';
}
