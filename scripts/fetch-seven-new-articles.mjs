/**
 * Fetch the 7 newest @salvazion_ X Articles via fxtwitter and merge into catalog.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const catalogPath = path.join(root, 'data/freedom/x-articles-catalog.json');

/** Status tweet IDs that publish each article */
const STATUS_IDS = [
  '2084129313595564217',
  '2083979184616202401',
  '2083411411355447491',
  '2083237703915561450',
  '2082694110649934231',
  '2082511758175117396',
  '2082311759612834082',
];

function truncatePreview(s, max = 220) {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

async function fetchArticleFromStatus(statusId) {
  const url = `https://api.fxtwitter.com/salvazion_/status/${statusId}`;
  const r = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  });
  if (!r.ok) throw new Error(`fxtwitter ${statusId} ${r.status}`);
  const j = await r.json();
  const tweet = j.tweet || j;
  const art = tweet.article;
  if (!art?.id || !art?.title) {
    throw new Error(`no article on status ${statusId}`);
  }
  // Prefer vxtwitter image if fxtwitter lacks media path
  let image = art.cover?.url || art.image || null;
  if (!image) {
    try {
      const vx = await fetch(`https://api.vxtwitter.com/salvazion_/status/${statusId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (vx.ok) {
        const vj = await vx.json();
        image = vj.article?.image || null;
      }
    } catch {
      // ignore
    }
  }
  return {
    id: String(art.id),
    statusId: String(statusId),
    title: String(art.title).trim(),
    preview: truncatePreview(art.preview_text || art.previewText || ''),
    image: image || '/logo-icon.png',
    url: `https://x.com/i/article/${art.id}`,
    createdAt: (() => {
      const raw =
        art.created_at ||
        (typeof tweet.created_timestamp === 'number'
          ? tweet.created_timestamp * 1000
          : tweet.created_at) ||
        null;
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    })(),
    source: '@salvazion_',
    verified: true,
  };
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const byId = new Map(catalog.map((a) => [String(a.id), { ...a }]));

const resolved = [];
for (const statusId of STATUS_IDS) {
  const entry = await fetchArticleFromStatus(statusId);
  const prev = byId.get(entry.id);
  if (prev) {
    // Keep better remote image if already present
    if (
      (!entry.image || entry.image === '/logo-icon.png') &&
      prev.image?.includes?.('pbs.twimg.com')
    ) {
      entry.image = prev.image;
    }
    if (!entry.createdAt && prev.createdAt) entry.createdAt = prev.createdAt;
  }
  byId.set(entry.id, entry);
  resolved.push(entry);
  console.log(
    'OK',
    entry.createdAt?.slice(0, 10),
    entry.title,
    entry.image.includes('pbs.twimg') ? 'img✓' : 'img✗'
  );
  await new Promise((r) => setTimeout(r, 200));
}

// Fix any missing images via vxtwitter batch
for (const entry of resolved) {
  if (entry.image && entry.image.includes('pbs.twimg.com')) continue;
  try {
    const r = await fetch(
      `https://api.vxtwitter.com/salvazion_/status/${entry.statusId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!r.ok) continue;
    const j = await r.json();
    if (j.article?.image) {
      entry.image = j.article.image;
      byId.set(entry.id, entry);
      console.log('img fix', entry.id, entry.image);
    }
  } catch {
    // ignore
  }
}

const merged = [...byId.values()].sort((a, b) => {
  const ta = Date.parse(a.createdAt || '') || 0;
  const tb = Date.parse(b.createdAt || '') || 0;
  return tb - ta;
});

fs.writeFileSync(catalogPath, JSON.stringify(merged, null, 2));
fs.writeFileSync(
  path.join(root, 'data/freedom/x-articles-full-raw.json'),
  JSON.stringify(
    merged.map((a) => ({ ...a, articleId: a.id })),
    null,
    2
  )
);
fs.writeFileSync(
  path.join(root, 'tmp/all-article-titles.json'),
  JSON.stringify(
    merged.map((a) => ({ id: a.id, title: a.title })),
    null,
    2
  )
);

console.log('\nTOTAL', merged.length);
console.log('NEW SEVEN:');
resolved.forEach((a, i) => console.log(`${i + 1}. ${a.title}`));
console.log('\nTop 10:');
merged
  .slice(0, 10)
  .forEach((a) => console.log(a.createdAt?.slice(0, 10), a.title.slice(0, 72)));
