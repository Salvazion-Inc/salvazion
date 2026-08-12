/**
 * Build offline Bible chapter/book JSON for Salvazion.
 *
 * Sources (getbible.net API · public domain / freely redistributable):
 * - en: King James Version (kjv)
 * - es: Reina Valera 1909 (valera) — dominio público
 *        (RV1960® es marca/copyright de SBU; no redistribuible sin licencia)
 * - pt: Almeida (almeida) — historic public-domain Almeida labeled ARC
 *        (modern 1995/2009 ARC® is copyright SBB; not redistributable)
 * - original: Westminster Leningrad Codex (codex) OT + Textus Receptus (textusreceptus) NT
 *
 * Usage: node scripts/build-bible.mjs [es|en|pt|original]
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'bible');

/** Protestant 66-book order matching data/bible/sample.ts BIBLE_BOOKS */
const BOOKS = [
  { id: 'gen', n: 1, name: 'Genesis', nameEs: 'Génesis', namePt: 'Gênesis', testament: 'OT' },
  { id: 'exo', n: 2, name: 'Exodus', nameEs: 'Éxodo', namePt: 'Êxodo', testament: 'OT' },
  { id: 'lev', n: 3, name: 'Leviticus', nameEs: 'Levítico', namePt: 'Levítico', testament: 'OT' },
  { id: 'num', n: 4, name: 'Numbers', nameEs: 'Números', namePt: 'Números', testament: 'OT' },
  { id: 'deu', n: 5, name: 'Deuteronomy', nameEs: 'Deuteronomio', namePt: 'Deuteronômio', testament: 'OT' },
  { id: 'jos', n: 6, name: 'Joshua', nameEs: 'Josué', namePt: 'Josué', testament: 'OT' },
  { id: 'jdg', n: 7, name: 'Judges', nameEs: 'Jueces', namePt: 'Juízes', testament: 'OT' },
  { id: 'rut', n: 8, name: 'Ruth', nameEs: 'Rut', namePt: 'Rute', testament: 'OT' },
  { id: '1sa', n: 9, name: '1 Samuel', nameEs: '1 Samuel', namePt: '1 Samuel', testament: 'OT' },
  { id: '2sa', n: 10, name: '2 Samuel', nameEs: '2 Samuel', namePt: '2 Samuel', testament: 'OT' },
  { id: '1ki', n: 11, name: '1 Kings', nameEs: '1 Reyes', namePt: '1 Reis', testament: 'OT' },
  { id: '2ki', n: 12, name: '2 Kings', nameEs: '2 Reyes', namePt: '2 Reis', testament: 'OT' },
  { id: '1ch', n: 13, name: '1 Chronicles', nameEs: '1 Crónicas', namePt: '1 Crônicas', testament: 'OT' },
  { id: '2ch', n: 14, name: '2 Chronicles', nameEs: '2 Crónicas', namePt: '2 Crônicas', testament: 'OT' },
  { id: 'ezr', n: 15, name: 'Ezra', nameEs: 'Esdras', namePt: 'Esdras', testament: 'OT' },
  { id: 'neh', n: 16, name: 'Nehemiah', nameEs: 'Nehemías', namePt: 'Neemias', testament: 'OT' },
  { id: 'est', n: 17, name: 'Esther', nameEs: 'Ester', namePt: 'Ester', testament: 'OT' },
  { id: 'job', n: 18, name: 'Job', nameEs: 'Job', namePt: 'Jó', testament: 'OT' },
  { id: 'psa', n: 19, name: 'Psalms', nameEs: 'Salmos', namePt: 'Salmos', testament: 'OT' },
  { id: 'pro', n: 20, name: 'Proverbs', nameEs: 'Proverbios', namePt: 'Provérbios', testament: 'OT' },
  { id: 'ecc', n: 21, name: 'Ecclesiastes', nameEs: 'Eclesiastés', namePt: 'Eclesiastes', testament: 'OT' },
  { id: 'sng', n: 22, name: 'Song of Solomon', nameEs: 'Cantares', namePt: 'Cânticos', testament: 'OT' },
  { id: 'isa', n: 23, name: 'Isaiah', nameEs: 'Isaías', namePt: 'Isaías', testament: 'OT' },
  { id: 'jer', n: 24, name: 'Jeremiah', nameEs: 'Jeremías', namePt: 'Jeremias', testament: 'OT' },
  { id: 'lam', n: 25, name: 'Lamentations', nameEs: 'Lamentaciones', namePt: 'Lamentações', testament: 'OT' },
  { id: 'ezk', n: 26, name: 'Ezekiel', nameEs: 'Ezequiel', namePt: 'Ezequiel', testament: 'OT' },
  { id: 'dan', n: 27, name: 'Daniel', nameEs: 'Daniel', namePt: 'Daniel', testament: 'OT' },
  { id: 'hos', n: 28, name: 'Hosea', nameEs: 'Oseas', namePt: 'Oseias', testament: 'OT' },
  { id: 'jol', n: 29, name: 'Joel', nameEs: 'Joel', namePt: 'Joel', testament: 'OT' },
  { id: 'amo', n: 30, name: 'Amos', nameEs: 'Amós', namePt: 'Amós', testament: 'OT' },
  { id: 'oba', n: 31, name: 'Obadiah', nameEs: 'Abdías', namePt: 'Obadias', testament: 'OT' },
  { id: 'jon', n: 32, name: 'Jonah', nameEs: 'Jonás', namePt: 'Jonas', testament: 'OT' },
  { id: 'mic', n: 33, name: 'Micah', nameEs: 'Miqueas', namePt: 'Miqueias', testament: 'OT' },
  { id: 'nam', n: 34, name: 'Nahum', nameEs: 'Nahúm', namePt: 'Naum', testament: 'OT' },
  { id: 'hab', n: 35, name: 'Habakkuk', nameEs: 'Habacuc', namePt: 'Habacuque', testament: 'OT' },
  { id: 'zep', n: 36, name: 'Zephaniah', nameEs: 'Sofonías', namePt: 'Sofonias', testament: 'OT' },
  { id: 'hag', n: 37, name: 'Haggai', nameEs: 'Hageo', namePt: 'Ageu', testament: 'OT' },
  { id: 'zec', n: 38, name: 'Zechariah', nameEs: 'Zacarías', namePt: 'Zacarias', testament: 'OT' },
  { id: 'mal', n: 39, name: 'Malachi', nameEs: 'Malaquías', namePt: 'Malaquias', testament: 'OT' },
  { id: 'mat', n: 40, name: 'Matthew', nameEs: 'Mateo', namePt: 'Mateus', testament: 'NT' },
  { id: 'mrk', n: 41, name: 'Mark', nameEs: 'Marcos', namePt: 'Marcos', testament: 'NT' },
  { id: 'luk', n: 42, name: 'Luke', nameEs: 'Lucas', namePt: 'Lucas', testament: 'NT' },
  { id: 'jhn', n: 43, name: 'John', nameEs: 'Juan', namePt: 'João', testament: 'NT' },
  { id: 'act', n: 44, name: 'Acts', nameEs: 'Hechos', namePt: 'Atos', testament: 'NT' },
  { id: 'rom', n: 45, name: 'Romans', nameEs: 'Romanos', namePt: 'Romanos', testament: 'NT' },
  { id: '1co', n: 46, name: '1 Corinthians', nameEs: '1 Corintios', namePt: '1 Coríntios', testament: 'NT' },
  { id: '2co', n: 47, name: '2 Corinthians', nameEs: '2 Corintios', namePt: '2 Coríntios', testament: 'NT' },
  { id: 'gal', n: 48, name: 'Galatians', nameEs: 'Gálatas', namePt: 'Gálatas', testament: 'NT' },
  { id: 'eph', n: 49, name: 'Ephesians', nameEs: 'Efesios', namePt: 'Efésios', testament: 'NT' },
  { id: 'php', n: 50, name: 'Philippians', nameEs: 'Filipenses', namePt: 'Filipenses', testament: 'NT' },
  { id: 'col', n: 51, name: 'Colossians', nameEs: 'Colosenses', namePt: 'Colossenses', testament: 'NT' },
  { id: '1th', n: 52, name: '1 Thessalonians', nameEs: '1 Tesalonicenses', namePt: '1 Tessalonicenses', testament: 'NT' },
  { id: '2th', n: 53, name: '2 Thessalonians', nameEs: '2 Tesalonicenses', namePt: '2 Tessalonicenses', testament: 'NT' },
  { id: '1ti', n: 54, name: '1 Timothy', nameEs: '1 Timoteo', namePt: '1 Timóteo', testament: 'NT' },
  { id: '2ti', n: 55, name: '2 Timothy', nameEs: '2 Timoteo', namePt: '2 Timóteo', testament: 'NT' },
  { id: 'tit', n: 56, name: 'Titus', nameEs: 'Tito', namePt: 'Tito', testament: 'NT' },
  { id: 'phm', n: 57, name: 'Philemon', nameEs: 'Filemón', namePt: 'Filemom', testament: 'NT' },
  { id: 'heb', n: 58, name: 'Hebrews', nameEs: 'Hebreos', namePt: 'Hebreus', testament: 'NT' },
  { id: 'jas', n: 59, name: 'James', nameEs: 'Santiago', namePt: 'Tiago', testament: 'NT' },
  { id: '1pe', n: 60, name: '1 Peter', nameEs: '1 Pedro', namePt: '1 Pedro', testament: 'NT' },
  { id: '2pe', n: 61, name: '2 Peter', nameEs: '2 Pedro', namePt: '2 Pedro', testament: 'NT' },
  { id: '1jn', n: 62, name: '1 John', nameEs: '1 Juan', namePt: '1 João', testament: 'NT' },
  { id: '2jn', n: 63, name: '2 John', nameEs: '2 Juan', namePt: '2 João', testament: 'NT' },
  { id: '3jn', n: 64, name: '3 John', nameEs: '3 Juan', namePt: '3 João', testament: 'NT' },
  { id: 'jud', n: 65, name: 'Jude', nameEs: 'Judas', namePt: 'Judas', testament: 'NT' },
  { id: 'rev', n: 66, name: 'Revelation', nameEs: 'Apocalipsis', namePt: 'Apocalipse', testament: 'NT' },
];

const VERSIONS = {
  en: {
    dir: 'en',
    translation: 'kjv',
    versionLabel: 'King James Version',
    bookName: (b) => b.name,
  },
  es: {
    dir: 'es',
    translation: 'valera',
    versionLabel: 'Reina Valera 1909',
    bookName: (b) => b.nameEs,
  },
  pt: {
    dir: 'pt',
    translation: 'almeida',
    versionLabel: 'Almeida Revista e Corrigida (ARC)',
    bookName: (b) => b.namePt,
  },
};

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'SalvazionBibleBuilder/1.0' } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          httpGetJson(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeVerses(chapterObj) {
  const verses = chapterObj.verses || [];
  return verses.map((v) => ({
    number: Number(v.verse ?? v.number ?? 0),
    text: String(v.text || '')
      .replace(/\s+/g, ' ')
      .trim(),
  })).filter((v) => v.number > 0 && v.text);
}

function toBookPayload(bookMeta, apiBook, versionLabel, bookTitle) {
  const chapters = (apiBook.chapters || []).map((ch) => ({
    chapter: Number(ch.chapter),
    verses: normalizeVerses(ch),
  }));
  return {
    book: bookTitle,
    bookId: bookMeta.id,
    version: versionLabel,
    chapters,
  };
}

async function fetchBook(translation, bookNum, retries = 4) {
  const url = `https://api.getbible.net/v2/${translation}/${bookNum}.json`;
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await httpGetJson(url);
    } catch (e) {
      lastErr = e;
      await sleep(400 * (i + 1));
    }
  }
  throw lastErr;
}

async function buildLanguage(key, cfg) {
  const dir = path.join(OUT, cfg.dir, 'books');
  fs.mkdirSync(dir, { recursive: true });

  let ok = 0;
  for (const book of BOOKS) {
    process.stdout.write(`[${key}] ${book.id} (${book.n}/66)… `);
    const api = await fetchBook(cfg.translation, book.n);
    const payload = toBookPayload(book, api, cfg.versionLabel, cfg.bookName(book));
    const file = path.join(dir, `${book.id}.json`);
    fs.writeFileSync(file, JSON.stringify(payload));
    const verses = payload.chapters.reduce((s, c) => s + c.verses.length, 0);
    console.log(`${payload.chapters.length} ch · ${verses} v`);
    ok++;
    await sleep(80);
  }
  return ok;
}

async function buildOriginal() {
  const dir = path.join(OUT, 'original', 'books');
  fs.mkdirSync(dir, { recursive: true });
  let ok = 0;

  for (const book of BOOKS) {
    const translation = book.testament === 'OT' ? 'codex' : 'textusreceptus';
    const versionLabel =
      book.testament === 'OT'
        ? 'Hebreo · Westminster Leningrad Codex'
        : 'Griego · Textus Receptus';
    process.stdout.write(`[original] ${book.id} (${translation})… `);
    const api = await fetchBook(translation, book.n);
    const title =
      book.testament === 'OT'
        ? `${book.nameEs} (עברית)`
        : `${book.nameEs} (Ελληνικά)`;
    const payload = toBookPayload(book, api, versionLabel, title);
    fs.writeFileSync(path.join(dir, `${book.id}.json`), JSON.stringify(payload));
    const verses = payload.chapters.reduce((s, c) => s + c.verses.length, 0);
    console.log(`${payload.chapters.length} ch · ${verses} v`);
    ok++;
    await sleep(80);
  }
  return ok;
}

function writeMeta() {
  const meta = {
    builtAt: new Date().toISOString(),
    books: BOOKS.length,
    languages: {
      es: {
        label: 'Reina Valera 1909',
        note: 'Dominio público. RV1960® requiere licencia de Sociedades Bíblicas Unidas.',
        path: 'es/books/{bookId}.json',
      },
      en: {
        label: 'King James Version',
        note: 'Public domain (1769 Cambridge edition text via getbible).',
        path: 'en/books/{bookId}.json',
      },
      pt: {
        label: 'Almeida Revista e Corrigida (ARC)',
        note: 'Historic public-domain Almeida (getbible almeida, 1911 reprint of 1900). Modern 1995/2009 ARC® requires SBB license.',
        path: 'pt/books/{bookId}.json',
      },
      original: {
        label: 'Hebrew OT + Greek NT',
        note: 'WLC (codex) + Textus Receptus via getbible.',
        path: 'original/books/{bookId}.json',
      },
    },
    bookIds: BOOKS.map((b) => b.id),
  };
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
}

async function main() {
  const only = (process.argv[2] || '').toLowerCase();
  console.log('Building Salvazion offline Bible dataset…\n');
  const results = {};
  if (!only || only === 'es') results.es = await buildLanguage('es', VERSIONS.es);
  if (!only || only === 'en') results.en = await buildLanguage('en', VERSIONS.en);
  if (!only || only === 'pt') results.pt = await buildLanguage('pt', VERSIONS.pt);
  if (!only || only === 'original') results.original = await buildOriginal();
  writeMeta();
  console.log(`\nDone. ${JSON.stringify(results)}`);
  console.log(`Output: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
