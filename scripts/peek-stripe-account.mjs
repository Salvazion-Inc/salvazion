/**
 * Read Stripe account public/business profile (support email, etc.)
 */
import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error('Missing STRIPE_SECRET_KEY');
  process.exit(1);
}

const res = await fetch('https://api.stripe.com/v1/account', {
  headers: { Authorization: `Bearer ${key}` },
});
const j = await res.json();
if (!res.ok) {
  console.error(JSON.stringify(j, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      id: j.id,
      email: j.email,
      business_profile: j.business_profile,
      settings_emails: j.settings?.emails ?? null,
    },
    null,
    2
  )
);
