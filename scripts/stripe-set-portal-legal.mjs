/**
 * Set Terms + Privacy URLs on the Stripe Customer Portal (live).
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-set-portal-legal.mjs
 *
 * Or put STRIPE_SECRET_KEY in .env.local and run:
 *   node scripts/stripe-set-portal-legal.mjs
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

const PRIVACY = 'https://salvazion.org/privacy';
const TERMS = 'https://salvazion.org/terms';
const RETURN = 'https://salvazion.org/hub/profile';
const CONFIG_ID = process.env.STRIPE_PORTAL_CONFIG_ID || 'bpc_1T89xrHOw5ZkjRlZPibVGLmB';

// Support / From policy: info@salvazion.org — set in Stripe Dashboard
// (Public business information + Customer emails). See docs/email.md.

const body = new URLSearchParams();
body.set('business_profile[privacy_policy_url]', PRIVACY);
body.set('business_profile[terms_of_service_url]', TERMS);
body.set('business_profile[headline]', 'Salvazion Premium');
body.set('default_return_url', RETURN);

const res = await fetch(
  `https://api.stripe.com/v1/billing_portal/configurations/${CONFIG_ID}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  }
);

const json = await res.json();
if (!res.ok) {
  console.error('Stripe error', res.status, JSON.stringify(json, null, 2));
  process.exit(1);
}

console.log('OK portal configuration updated');
console.log(
  JSON.stringify(
    {
      id: json.id,
      privacy_policy_url: json.business_profile?.privacy_policy_url,
      terms_of_service_url: json.business_profile?.terms_of_service_url,
      default_return_url: json.default_return_url,
      headline: json.business_profile?.headline,
    },
    null,
    2
  )
);
