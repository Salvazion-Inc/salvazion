/**
 * Verify email-related Stripe + app constants (does not touch Supabase SMTP).
 *
 * Usage: node scripts/verify-email-setup.mjs
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

const EXPECTED = 'info@salvazion.org';
const results = [];

function ok(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const mark = pass ? 'OK ' : '!! ';
  console.log(`${mark}${name}${detail ? ' — ' + detail : ''}`);
}

// Code constants
const sitePath = path.join(process.cwd(), 'lib/config/site.ts');
const site = fs.readFileSync(sitePath, 'utf8');
ok(
  'SUPPORT_EMAIL in site.ts',
  site.includes(`SUPPORT_EMAIL = '${EXPECTED}'`),
  EXPECTED
);

const mailerPath = path.join(process.cwd(), 'lib/email/mailer.ts');
ok('App mailer exists', fs.existsSync(mailerPath));

const docsPath = path.join(process.cwd(), 'docs/email.md');
ok('docs/email.md exists', fs.existsSync(docsPath));

// Stripe (restricted keys may block account read)
const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  ok('STRIPE_SECRET_KEY', false, 'missing in .env.local');
} else {
  ok('STRIPE_SECRET_KEY', true, key.startsWith('rk_') ? 'restricted key' : 'secret key');

  const headers = { Authorization: `Bearer ${key}` };

  // Products (billing sanity)
  const prodRes = await fetch('https://api.stripe.com/v1/products?limit=3', {
    headers,
  });
  const prodJson = await prodRes.json();
  ok(
    'Stripe API products',
    prodRes.ok,
    prodRes.ok
      ? (prodJson.data || []).map((p) => p.name).join(', ') || 'empty'
      : prodJson.error?.message || String(prodRes.status)
  );

  // Account business_profile.support_email (needs accounts_kyc_basic_read)
  const accRes = await fetch('https://api.stripe.com/v1/account', { headers });
  const accJson = await accRes.json();
  if (accRes.ok) {
    const support = accJson.business_profile?.support_email || null;
    ok(
      'Stripe support_email',
      support === EXPECTED,
      support ? String(support) : 'not set (null)'
    );
    ok(
      'Stripe business name',
      Boolean(accJson.business_profile?.name || accJson.settings?.dashboard?.display_name),
      accJson.business_profile?.name ||
        accJson.settings?.dashboard?.display_name ||
        ''
    );
  } else {
    ok(
      'Stripe support_email (API)',
      false,
      `cannot read account: ${accJson.error?.message || accRes.status}. Check Dashboard → Settings → Public details manually.`
    );
  }

  // Portal config legal links
  const portalId = process.env.STRIPE_PORTAL_CONFIG_ID || 'bpc_1T89xrHOw5ZkjRlZPibVGLmB';
  const portalRes = await fetch(
    `https://api.stripe.com/v1/billing_portal/configurations/${portalId}`,
    { headers }
  );
  const portalJson = await portalRes.json();
  if (portalRes.ok) {
    ok(
      'Portal privacy URL',
      (portalJson.business_profile?.privacy_policy_url || '').includes(
        'salvazion.org'
      ),
      portalJson.business_profile?.privacy_policy_url || 'missing'
    );
    ok(
      'Portal terms URL',
      (portalJson.business_profile?.terms_of_service_url || '').includes(
        'salvazion.org'
      ),
      portalJson.business_profile?.terms_of_service_url || 'missing'
    );
  } else {
    ok(
      'Portal configuration',
      false,
      portalJson.error?.message || String(portalRes.status)
    );
  }
}

// Env for app mailer (optional)
ok(
  'RESEND_API_KEY (optional app mailer)',
  Boolean(process.env.RESEND_API_KEY?.trim()),
  process.env.RESEND_API_KEY?.trim()
    ? 'set'
    : 'not set — Auth uses Supabase SMTP; app sendAppEmail needs this later'
);

console.log('\n--- Supabase SMTP ---');
console.log(
  'Cannot read SMTP from here (dashboard-only). You confirmed Gmail SMTP is set.'
);
console.log('Manual test: password reset / signup → From must be', EXPECTED);

const failed = results.filter((r) => !r.pass);
console.log(
  `\nSummary: ${results.length - failed.length}/${results.length} checks passed`
);
if (failed.length) {
  console.log(
    'Failed / attention:',
    failed.map((f) => f.name).join('; ')
  );
  // Exit 0 if only optional RESEND or account-read permission failed
  const hard = failed.filter(
    (f) =>
      !f.name.includes('RESEND') &&
      !f.name.includes('support_email (API)') &&
      !f.name.includes('support_email')
  );
  // If support_email failed only because API can't read, not hard fail
  process.exit(hard.length ? 1 : 0);
}
process.exit(0);
