/**
 * Fetch ALL @salvazion_ X Articles (UserArticlesTweets) with a logged-in session.
 *
 * Usage (PowerShell):
 *   $env:X_AUTH_TOKEN="..."   # cookie auth_token from x.com
 *   $env:X_CT0="..."          # cookie ct0 from x.com
 *   node scripts/fetch-all-articles-auth.mjs
 *
 * Or close Chrome and:
 *   $env:CHROME_USER_DATA="$env:LOCALAPPDATA\Google\Chrome\User Data"
 *   node scripts/playwright-fetch-articles-chrome.mjs
 *
 * Writes: data/freedom/x-articles-catalog.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outPath = path.join(root, 'data/freedom/x-articles-catalog.json');

const AUTH = process.env.X_AUTH_TOKEN || process.env.AUTH_TOKEN || '';
const CT0 = process.env.X_CT0 || process.env.CT0 || '';
const BEARER =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
const USER_ID = process.env.X_USER_ID || '1076132104226983948';
const QUERY_ID = 'YzdH6MUhrUFPXyHKezJU4Q'; // UserArticlesTweets

if (!AUTH || !CT0) {
  console.error(`
Missing X session cookies.

1) Open https://x.com while logged in (as the account that can see @salvazion_ articles)
2) DevTools → Application → Cookies → https://x.com
3) Copy values:
   - auth_token  →  X_AUTH_TOKEN
   - ct0         →  X_CT0

Then:
  $env:X_AUTH_TOKEN="paste"
  $env:X_CT0="paste"
  node scripts/fetch-all-articles-auth.mjs
`);
  process.exit(1);
}

const features = {
  rweb_video_screen_enabled: false,
  rweb_cashtags_enabled: true,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: true,
  rweb_tipjar_consumption_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  premium_content_api_read_enabled: true,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  responsive_web_enhance_cards_enabled: false,
  responsive_web_graphql_exclude_directive_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
};

function extractImage(art) {
  return art?.cover_media?.media_info?.original_img_url || null;
}

function collect(node, map) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const x of node) collect(x, map);
    return;
  }
  const art =
    node.article?.article_results?.result ||
    node.article_results?.result ||
    (node.title && node.preview_text != null && node.rest_id ? node : null);
  if (art?.title && art?.rest_id) {
    const id = String(art.rest_id);
    const created = art.metadata?.first_published_at_secs
      ? new Date(art.metadata.first_published_at_secs * 1000).toISOString()
      : art.created_at || node.legacy?.created_at || null;
    map.set(id, {
      id,
      statusId: node.rest_id ? String(node.rest_id) : null,
      title: String(art.title).trim(),
      preview: art.preview_text || '',
      image: extractImage(art) || '/logo-icon.png',
      url: `https://x.com/i/article/${id}`,
      createdAt: created,
      source: '@salvazion_',
      verified: true,
    });
  }
  for (const k of Object.keys(node)) {
    if (k === 'content' && node[k]?.blocks) continue;
    if (node[k] && typeof node[k] === 'object') collect(node[k], map);
  }
}

function findBottomCursor(node) {
  let found = null;
  const stack = [node];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    if (Array.isArray(n)) {
      stack.push(...n);
      continue;
    }
    if (n.cursorType === 'Bottom' && n.value) found = n.value;
    if (
      typeof n.entryId === 'string' &&
      n.entryId.includes('cursor-bottom') &&
      n.content?.value
    ) {
      found = n.content.value;
    }
    for (const k of Object.keys(n)) if (n[k] && typeof n[k] === 'object') stack.push(n[k]);
  }
  return found;
}

const map = new Map();
let cursor = null;
let page = 0;

while (page < 40) {
  page++;
  const variables = {
    userId: USER_ID,
    count: 40,
    includePromotedContent: true,
    withVoice: false,
  };
  if (cursor) variables.cursor = cursor;

  const url =
    `https://x.com/i/api/graphql/${QUERY_ID}/UserArticlesTweets?variables=` +
    encodeURIComponent(JSON.stringify(variables)) +
    `&features=` +
    encodeURIComponent(JSON.stringify(features));

  const r = await fetch(url, {
    headers: {
      Authorization: BEARER,
      'x-csrf-token': CT0,
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-active-user': 'yes',
      'x-twitter-client-language': 'en',
      'content-type': 'application/json',
      cookie: `auth_token=${AUTH}; ct0=${CT0}`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Referer: 'https://x.com/salvazion_/articles',
    },
  });

  const text = await r.text();
  if (!r.ok) {
    console.error('HTTP', r.status, text.slice(0, 300));
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('Invalid JSON', text.slice(0, 200));
    process.exit(1);
  }

  const before = map.size;
  collect(data, map);
  const next = findBottomCursor(data);
  console.log(
    `page ${page} total=${map.size} (+${map.size - before}) cursor=${next ? 'yes' : 'no'}`
  );

  if (!next || next === cursor) break;
  if (map.size - before === 0 && page > 2) break;
  cursor = next;
  await new Promise((r) => setTimeout(r, 400));
}

// merge previous verified extras
try {
  const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  for (const a of prev) {
    if (!map.has(String(a.id)) && a.verified) {
      map.set(String(a.id), a);
    }
  }
} catch {
  // ignore
}

const catalog = [...map.values()].sort((a, b) => {
  const ta = Date.parse(a.createdAt || '') || 0;
  const tb = Date.parse(b.createdAt || '') || 0;
  return tb - ta;
});

fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2));
console.log('WROTE', outPath);
console.log('TOTAL', catalog.length);
console.log(
  'with image',
  catalog.filter((x) => String(x.image).includes('pbs.twimg')).length
);
console.log(catalog.slice(0, 12).map((x) => x.title).join('\n'));
