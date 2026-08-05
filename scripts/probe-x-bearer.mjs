/**
 * Verify X_BEARER_TOKEN can read @salvazion_ public metrics.
 * Does not print the token.
 */
import { readFileSync, existsSync } from 'fs';

function loadEnvLocal() {
  const path = '.env.local';
  if (!existsSync(path)) throw new Error('Missing .env.local');
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const bearer = (env.X_BEARER_TOKEN || env.TWITTER_BEARER_TOKEN || '').trim();
  console.log('=== X Bearer probe ===');
  console.log(
    'token',
    bearer
      ? `present length=${bearer.length} prefix=${bearer.slice(0, 6)}…`
      : 'MISSING'
  );
  if (!bearer) process.exit(1);

  const handle = 'salvazion_';
  const url = new URL(
    'https://api.x.com/2/users/by/username/' + encodeURIComponent(handle)
  );
  url.searchParams.set(
    'user.fields',
    'public_metrics,description,url,verified,verified_type,created_at'
  );

  const t0 = Date.now();
  const r = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${bearer}`,
      'User-Agent': 'SalvazionBusiness/1.0',
    },
  });
  const body = await r.text();
  const ms = Date.now() - t0;
  console.log('status', r.status, ms + 'ms');

  if (!r.ok) {
    console.log('error body', body.slice(0, 400));
    console.log('NOT READY');
    process.exit(1);
  }

  let j;
  try {
    j = JSON.parse(body);
  } catch {
    console.log('invalid json', body.slice(0, 200));
    process.exit(1);
  }

  const d = j.data;
  if (!d) {
    console.log('empty data', body.slice(0, 300));
    process.exit(1);
  }
  const m = d.public_metrics || {};
  console.log('username', d.username);
  console.log('name', d.name);
  console.log('followers', m.followers_count);
  console.log('following', m.following_count);
  console.log('tweets', m.tweet_count);
  console.log('listed', m.listed_count);
  console.log('verified', d.verified, d.verified_type || '');
  console.log('source', 'x_api_v2');
  console.log('READY');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
