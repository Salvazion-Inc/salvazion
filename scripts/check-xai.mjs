import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');
const env = {};

if (!fs.existsSync(envPath)) {
  console.log(JSON.stringify({ error: 'missing .env.local' }));
  process.exit(1);
}

for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  let k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[k] = v;
}

const key = env.XAI_API_KEY || '';
const model = env.XAI_MODEL || 'grok-4.5';
const base = (env.XAI_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, '');
const ok =
  key.length > 20 &&
  !key.includes('...') &&
  !/tu-clave|pega-aqu|your-key|xxx/i.test(key);

console.log(
  JSON.stringify(
    {
      hasKey: Boolean(key),
      keyLength: key.length,
      keyLooksValid: ok,
      startsWithXai: key.startsWith('xai-') || key.startsWith('xai_'),
      model,
      baseUrl: base,
    },
    null,
    2
  )
);

if (!ok) process.exit(2);

try {
  const r = await fetch(`${base}/models`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const text = await r.text();
  console.log(
    JSON.stringify(
      {
        xaiAuthStatus: r.status,
        xaiAuthOk: r.status === 200,
        bodyPreview: text.slice(0, 160),
      },
      null,
      2
    )
  );
  process.exit(r.status === 200 ? 0 : 3);
} catch (e) {
  console.log(JSON.stringify({ xaiAuthOk: false, error: e.message }));
  process.exit(3);
}
