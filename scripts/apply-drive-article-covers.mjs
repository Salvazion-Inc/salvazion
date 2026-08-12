/**
 * Copy Images of Articles from Google Drive (DriveFS I:) into
 * public/freedom/article-covers as compressed JPEGs and update the catalog.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const catalogPath = path.join(root, 'data/freedom/x-articles-catalog.json');
const outDir = path.join(root, 'public/freedom/article-covers');
const srcDir =
  process.env.DRIVE_ARTICLES_DIR ||
  'I:\\Shared drives\\Salvazion Company\\07_Growth_Marketing_Community\\Images of Articles';

function slugify(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function norm(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .toLowerCase()
    .replace(/\.(png|jpe?g|webp|gif)$/i, '')
    .replace(/\bsalvazion\b/g, ' ')
    .replace(/\ball about\b/g, ' ')
    .replace(/\ball\b/g, ' ')
    .replace(/['’:,;!?()[\]{}.]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function score(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 82;
  const aw = new Set(a.split(' ').filter((w) => w.length > 2));
  const bw = b.split(' ').filter((w) => w.length > 2);
  if (!bw.length) return 0;
  let hit = 0;
  for (const w of bw) if (aw.has(w)) hit++;
  return (hit / Math.max(aw.size, bw.length)) * 75;
}

if (!fs.existsSync(srcDir)) {
  console.error('Drive folder not found:', srcDir);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const files = fs
  .readdirSync(srcDir)
  .filter((n) => /\.(png|jpe?g|webp)$/i.test(n))
  .map((name) => ({ name, path: path.join(srcDir, name) }));

console.log('drive files', files.length, 'catalog', catalog.length);

const aliases = [
  ['Health Problems From Eating Bugs', 'Eat Bugs or Insects.jpg'],
  ['All About Zionism: History', 'Zionism and Ultra-Orthodox Jews.jpg'],
  ['Solana: The Exponential Infrastructure', 'Solana_Salvazion.jpg'],
  ['Solana: The High-Performance Blockchain', 'Solana and Salvazion King.jpg'],
  ['Why We Need More Virtuous People', 'Virtuous Woman in the World.jpg'],
];

const usedArt = new Set();
const usedFile = new Set();
const assigned = new Map();

for (const [titlePart, fileName] of aliases) {
  const art = catalog.find((a) => a.title.includes(titlePart));
  const file = files.find((f) => f.name === fileName);
  if (!art || !file) {
    console.log('ALIAS MISS', titlePart, '->', fileName);
    continue;
  }
  usedArt.add(art.id);
  usedFile.add(file.path);
  assigned.set(art.id, { art, file, score: 99 });
}

const pairs = [];
for (const art of catalog) {
  const nt = norm(art.title);
  for (const f of files) {
    const s = score(nt, norm(f.name));
    if (s >= 34) pairs.push({ art, file: f, score: s });
  }
}
pairs.sort((a, b) => b.score - a.score);
for (const p of pairs) {
  if (usedArt.has(p.art.id) || usedFile.has(p.file.path)) continue;
  usedArt.add(p.art.id);
  usedFile.add(p.file.path);
  assigned.set(p.art.id, p);
}
const leftoverFiles = files.filter((f) => !usedFile.has(f.path));
const plan = catalog.map((art) => {
  const hit = assigned.get(art.id);
  if (hit) return hit;
  let near = null;
  let nearScore = 0;
  const nt = norm(art.title);
  for (const f of leftoverFiles) {
    const s = score(nt, norm(f.name));
    if (s > nearScore) {
      nearScore = s;
      near = `${f.name} (${s.toFixed(1)})`;
    }
  }
  return { art, file: null, score: 0, near };
});

const unmatched = plan.filter((p) => !p.file);
console.log('matched', plan.filter((p) => p.file).length, 'unmatched', unmatched.length, 'unused', leftoverFiles.length);
unmatched.forEach((p) => console.log('UNMATCH', p.art.title, 'near=', p.near));
leftoverFiles.forEach((f) => console.log('UNUSED', f.name));

let ok = 0;
let fail = 0;
let bytesIn = 0;
let bytesOut = 0;

for (const p of plan) {
  if (!p.file) continue;
  const destName = `${slugify(p.art.title) || p.art.id}.jpg`;
  const dest = path.join(outDir, destName);
  try {
    const input = fs.readFileSync(p.file.path);
    bytesIn += input.length;
    const out = await sharp(input)
      .rotate()
      .resize({ width: 1280, height: 800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(dest, out);
    bytesOut += out.length;
    p.local = `/freedom/article-covers/${destName}`;
    ok++;
    if (ok % 25 === 0) console.log(`converted ${ok}`);
  } catch (e) {
    fail++;
    console.log('FAIL', p.art.title.slice(0, 50), e.message);
  }
}

let updated = 0;
for (const p of plan) {
  if (!p.local) continue;
  if (p.art.image !== p.local) {
    p.art.image = p.local;
    updated++;
  }
}
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

console.log('\nOK', ok, 'fail', fail, 'catalog image updates', updated);
console.log(
  'size in',
  Math.round(bytesIn / 1024 / 1024),
  'MB -> out',
  Math.round(bytesOut / 1024 / 1024),
  'MB'
);
