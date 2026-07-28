/**
 * Extract media from salvazion.org Canva export and download key assets.
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  statSync,
  copyFileSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HTML = join(ROOT, 'tmp/canva/page.html');
const OUT = join(ROOT, 'tmp/canva');
const DL = join(OUT, 'dl');
const PUBLIC = join(ROOT, 'public');

function extractBootstrap(html) {
  const re = /window\['bootstrap'\] = JSON\.parse\('((?:\\.|[^'\\])*)'\)/;
  const m = html.match(re);
  if (!m) throw new Error('bootstrap not found');
  // m[1] is a JS single-quoted string body with JSON inside, escaped with backslashes
  let s = m[1];
  // Unescape common sequences from the HTML-embedded JS string
  s = s
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
  // After one pass, may still have \" issues — try parse
  try {
    return JSON.parse(s);
  } catch {
    // Alternative: eval-safe via Function
    return Function(`"use strict"; return (${s});`)();
  }
}

function walk(obj, fn) {
  if (obj == null) return;
  fn(obj);
  if (Array.isArray(obj)) obj.forEach((v) => walk(v, fn));
  else if (typeof obj === 'object') Object.values(obj).forEach((v) => walk(v, fn));
}

function collectMedia(data) {
  const byId = new Map();
  walk(data, (node) => {
    if (!node || typeof node !== 'object' || !node.id || typeof node.id !== 'string')
      return;
    if (!node.id.startsWith('VA') && !node.id.startsWith('MA')) return;

    const entry = byId.get(node.id) || { id: node.id };
    if (node.contentType) entry.contentType = node.contentType;
    if (node.width) entry.width = node.width;
    if (node.height) entry.height = node.height;
    if (node.durationSeconds) entry.duration = node.durationSeconds;
    if (Array.isArray(node.files) && node.files[0]?.url) {
      entry.url = node.files[0].url;
      entry.fw = node.files[0].width;
      entry.fh = node.files[0].height;
    }
    if (Array.isArray(node.dashVideoFiles) && node.dashVideoFiles.length) {
      const sorted = [...node.dashVideoFiles].sort(
        (a, b) => (b.A || 0) * (b.B || 0) - (a.A || 0) * (a.B || 0)
      );
      const best = sorted[0];
      if (best?.[1]) {
        entry.hdUrl = best[1];
        entry.hdW = best.A;
        entry.hdH = best.B;
      }
    }
    if (node.posterframes?.[0]?.A) entry.poster = node.posterframes[0].A;
    byId.set(node.id, entry);
  });
  return [...byId.values()].filter((m) => m.url || m.hdUrl);
}

function findRefs(html) {
  // Link alt text to media IDs nearby in HTML
  const pairs = [];
  const alts = [
    'Photography of Cristian Cortés Fernández',
    'Photography of Beatriz Isler Muñoz',
    'An ordinary family',
    'good genes',
    'This is not a meme',
    'Spiritual Revival',
  ];
  for (const alt of alts) {
    const i = html.indexOf(alt);
    if (i < 0) continue;
    const slice = html.slice(Math.max(0, i - 800), i + 400);
    const ids = [...slice.matchAll(/"(VA[A-Za-z0-9_-]+|MA[A-Za-z0-9_-]+)"/g)].map(
      (x) => x[1]
    );
    pairs.push({ alt, nearbyIds: [...new Set(ids)].slice(0, 20) });
  }
  return pairs;
}

function download(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 2000) {
    console.log('skip', dest);
    return true;
  }
  const full = url.startsWith('http') ? url : `https://salvazion.org/${url}`;
  console.log('GET', full);
  const r = spawnSync('curl.exe', ['-sL', full, '-A', 'Mozilla/5.0', '-o', dest], {
    encoding: 'utf8',
  });
  if (r.status !== 0 || !existsSync(dest) || statSync(dest).size < 500) {
    console.error('FAIL', dest);
    return false;
  }
  console.log('ok', dest, statSync(dest).size);
  return true;
}

function main() {
  mkdirSync(DL, { recursive: true });
  const html = readFileSync(HTML, 'utf8');
  let data;
  try {
    data = extractBootstrap(html);
    writeFileSync(join(OUT, 'bootstrap.json'), JSON.stringify(data));
    console.log('bootstrap ok');
  } catch (e) {
    console.warn('bootstrap parse failed, using regex media only', e.message);
    data = null;
  }

  let media = data ? collectMedia(data) : [];
  if (!media.length) {
    // Regex fallback for media blocks
    const blocks = [
      ...html.matchAll(
        /\{"id":"(VA[^"]+)","files":\[\{"url":"([^"]+)","width":(\d+),"height":(\d+)/g
      ),
    ];
    media = blocks.map((m) => ({
      id: m[1],
      url: m[2],
      width: +m[3],
      height: +m[4],
    }));
    // HD variants
    const hd = [
      ...html.matchAll(
        /"1":"(_assets\/video\/[a-f0-9]+\.mp4)","A":(\d+),"B":(\d+)/g
      ),
    ];
    console.log('regex media', media.length, 'hd', hd.length);
  }

  writeFileSync(join(OUT, 'media.json'), JSON.stringify(media, null, 2));
  const refs = findRefs(html);
  writeFileSync(join(OUT, 'refs.json'), JSON.stringify(refs, null, 2));
  console.log('refs', JSON.stringify(refs, null, 2));

  console.log('\nMEDIA:');
  for (const m of media) {
    console.log(
      m.id,
      m.contentType || '',
      `${m.width || m.fw || '?'}x${m.height || m.fh || '?'}`,
      m.duration || '',
      m.hdUrl || m.url
    );
  }

  // Download all
  for (const m of media) {
    const url = m.hdUrl || m.url;
    if (!url) continue;
    const ext = (url.match(/\.([a-z0-9]+)$/i) || [, 'bin'])[1];
    download(url, join(DL, `${m.id}.${ext}`));
    if (m.poster) {
      const pe = (m.poster.match(/\.([a-z0-9]+)$/i) || [, 'jpg'])[1];
      download(m.poster, join(DL, `${m.id}-poster.${pe}`));
    }
  }

  // Also grab any standalone jpg assets referenced
  const jpgs = [...new Set([...html.matchAll(/_assets\/video\/[a-f0-9]+\.jpg/g)].map((x) => x[0]))];
  for (const j of jpgs) {
    const name = j.split('/').pop();
    download(j, join(DL, name));
  }

  console.log('\nDownloaded to', DL);
}

main();
