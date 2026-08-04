/**
 * Verify wearable OAuth env configuration (does not call external APIs).
 * Usage: node scripts/verify-wearables-oauth.mjs
 *
 * Loads .env.local if present (KEY=value lines only).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = val;
    }
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));

const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
const secret = process.env.WEARABLES_TOKEN_SECRET || '';

const providers = [
  {
    id: 'fitbit',
    label: 'fitbit (Google Health)',
    idEnv: 'GOOGLE_HEALTH_CLIENT_ID',
    secretEnv: 'GOOGLE_HEALTH_CLIENT_SECRET',
    idEnvFallback: 'FITBIT_CLIENT_ID',
    secretEnvFallback: 'FITBIT_CLIENT_SECRET',
  },
  { id: 'oura', label: 'oura', idEnv: 'OURA_CLIENT_ID', secretEnv: 'OURA_CLIENT_SECRET' },
  { id: 'whoop', label: 'whoop', idEnv: 'WHOOP_CLIENT_ID', secretEnv: 'WHOOP_CLIENT_SECRET' },
  { id: 'garmin', label: 'garmin', idEnv: 'GARMIN_CLIENT_ID', secretEnv: 'GARMIN_CLIENT_SECRET' },
];

console.log('Salvazion — Wearables OAuth env check\n');
console.log(`NEXT_PUBLIC_APP_URL: ${base || '(missing)'}`);
console.log(
  `WEARABLES_TOKEN_SECRET: ${secret ? `set (${secret.length} chars)` : 'MISSING'}`
);
console.log('');

let ok = 0;
for (const p of providers) {
  const id =
    process.env[p.idEnv] ||
    (p.idEnvFallback ? process.env[p.idEnvFallback] : '') ||
    '';
  const sec =
    process.env[p.secretEnv] ||
    (p.secretEnvFallback ? process.env[p.secretEnvFallback] : '') ||
    '';
  const configured = Boolean(id && sec);
  if (configured) ok += 1;
  const callback = base
    ? `${base}/api/wearables/oauth/${p.id}/callback`
    : `(set NEXT_PUBLIC_APP_URL)/api/wearables/oauth/${p.id}/callback`;
  const label = (p.label || p.id).padEnd(22);
  console.log(
    `${configured ? '✓' : '○'} ${label}  id=${id ? 'set' : 'empty'}  secret=${sec ? 'set' : 'empty'}`
  );
  console.log(`         callback: ${callback}`);
  if (p.id === 'fitbit' && !process.env.GOOGLE_HEALTH_CLIENT_ID && id) {
    console.log(
      '         note: using FITBIT_* fallback — prefer GOOGLE_HEALTH_CLIENT_ID/SECRET'
    );
  }
}

console.log('');
console.log(`${ok}/${providers.length} providers fully configured.`);
if (!base) {
  console.log('Fix: set NEXT_PUBLIC_APP_URL (e.g. https://salvazion.org)');
}
if (!secret) {
  console.log('Fix: set WEARABLES_TOKEN_SECRET to a long random string');
}
if (ok < providers.length) {
  console.log('Guide: docs/wearables-oauth-setup.md');
  process.exitCode = 1;
} else {
  console.log('All provider env pairs present. Redeploy Vercel if production.');
}
