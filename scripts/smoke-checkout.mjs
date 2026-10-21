#!/usr/bin/env node
/**
 * Post-deploy checkout smoke test (SLV-CHECKOUT-TOS-20261013-1).
 * Usage: node scripts/smoke-checkout.mjs <deployment-url> [month|year]
 * Env: VERCEL_AUTOMATION_BYPASS_SECRET (optional, Vercel protection bypass),
 *      SMOKE_CHECKOUT_TOKEN (required for production; previews allow smoke).
 * The app creates a real guest Checkout Session with metadata.e2e='true' and
 * expires it immediately, so nothing is payable and KPIs exclude it.
 */
const base = (process.argv[2] || process.env.DEPLOYMENT_URL || '').replace(/\/$/, '');
const plan = process.argv[3] || 'month';
if (!base) {
  console.error('usage: smoke-checkout.mjs <deployment-url> [month|year]');
  process.exit(2);
}
const url = `${base.startsWith('http') ? base : `https://${base}`}/premium/checkout?plan=${plan}&e2e=1`;
const headers = { 'user-agent': 'Mozilla/5.0 salvazion-smoke' };
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}
if (process.env.SMOKE_CHECKOUT_TOKEN) headers['x-salvazion-smoke'] = process.env.SMOKE_CHECKOUT_TOKEN;

const res = await fetch(url, { headers, redirect: 'manual' });
const text = await res.text();
let body;
try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 300) }; }
console.log(JSON.stringify({ status: res.status, ...body }));
const promoOff = body.allow_promotion_codes === false || body.allow_promotion_codes === null;
const pass = res.status === 200 && body.ok === true && body.url_host === 'checkout.stripe.com'
  && body.status === 'expired' && body.e2e === 'true' && promoOff;
console.log(pass ? 'SMOKE PASS' : 'SMOKE FAIL');
process.exit(pass ? 0 : 1);
