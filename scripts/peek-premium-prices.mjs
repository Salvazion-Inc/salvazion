/**
 * Assert live Salvazion Premium prices used by Checkout.
 * Checkout must resolve lookup_keys — never product.default_price ($20).
 */
import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

loadEnvLocal();
const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('no stripe key');
  process.exit(1);
}
const auth = `Bearer ${key}`;

async function get(url) {
  const res = await fetch(url, { headers: { Authorization: auth } });
  const j = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(j));
  return j;
}

const MONTHLY_LOOKUP = 'salvazion_premium_monthly_49';
const ANNUAL_LOOKUP = 'salvazion_premium_annual_39';
const MONTHLY_ID = 'price_1U0WEWHOw5ZkjRlZHXRW0gAX';
const ANNUAL_ID = 'price_1U0WEXHOw5ZkjRlZOwkxysed';
const LEGACY_20 = 'price_1Ty0isHOw5ZkjRlZ6t5TRGje';

const listed = await get(
  `https://api.stripe.com/v1/prices?lookup_keys[0]=${MONTHLY_LOOKUP}&lookup_keys[1]=${ANNUAL_LOOKUP}&active=true&limit=10`
);
const product = await get('https://api.stripe.com/v1/products/prod_UxwcMVMNlKeczI');
const legacy = await get(`https://api.stripe.com/v1/prices/${LEGACY_20}`);

const byKey = Object.fromEntries(
  listed.data.map((p) => [p.lookup_key, p])
);

const monthly = byKey[MONTHLY_LOOKUP];
const annual = byKey[ANNUAL_LOOKUP];
const fail = [];

if (!monthly || monthly.id !== MONTHLY_ID || monthly.unit_amount !== 4900) {
  fail.push('monthly lookup_key is not $49 ' + JSON.stringify(monthly));
}
if (!annual || annual.id !== ANNUAL_ID || annual.unit_amount !== 46800) {
  fail.push('annual lookup_key is not $468 ' + JSON.stringify(annual));
}
if (legacy.unit_amount !== 2000) {
  fail.push('legacy price is not $20');
}

const envMonthly =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_MONTHLY;
const warnings = [];
if (product.default_price === LEGACY_20) {
  warnings.push('product.default_price is still the legacy $20 price (Checkout must not use it)');
}
if (envMonthly === LEGACY_20) {
  warnings.push('env STRIPE_PRICE_MONTHLY is the legacy $20 price — Checkout must ignore it');
}

const report = {
  product: {
    id: product.id,
    name: product.name,
    default_price: product.default_price,
  },
  lookup: {
    monthly: monthly && {
      id: monthly.id,
      unit_amount: monthly.unit_amount,
      interval: monthly.recurring?.interval,
    },
    annual: annual && {
      id: annual.id,
      unit_amount: annual.unit_amount,
      interval: annual.recurring?.interval,
    },
  },
  legacy: { id: legacy.id, unit_amount: legacy.unit_amount, active: legacy.active },
  envMonthly: envMonthly || null,
  warnings,
  verdict: fail.length === 0 ? 'PASS' : 'FAIL',
  issues: fail,
};

console.log(JSON.stringify(report, null, 2));
process.exit(fail.length === 0 ? 0 : 1);
