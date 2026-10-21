import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutBaseUrlFromHeaders } from '../lib/billing/request-guard';
import { isCheckoutReturn } from '../lib/billing/checkout-intent';
import { buildHubCheckoutParams } from '../lib/billing/checkout-params';

const FALLBACK = 'https://salvazion.org';
const PREVIEW = 'https://salvazion-abc123xyz-salvazion.vercel.app';

test('production origin stays salvazion.org', () => {
  assert.equal(checkoutBaseUrlFromHeaders('https://salvazion.org', null, FALLBACK, 'production'), 'https://salvazion.org');
  assert.equal(checkoutBaseUrlFromHeaders('https://www.salvazion.org', null, FALLBACK, 'production'), 'https://www.salvazion.org');
});

test('preview returns to its own host only in preview env', () => {
  assert.equal(checkoutBaseUrlFromHeaders(PREVIEW, null, FALLBACK, 'preview'), PREVIEW);
  assert.equal(checkoutBaseUrlFromHeaders(null, `${PREVIEW}/hub/premium`, FALLBACK, 'preview'), PREVIEW);
  assert.equal(checkoutBaseUrlFromHeaders(PREVIEW, null, FALLBACK, 'production'), FALLBACK);
});

test('untrusted or missing origin falls back', () => {
  assert.equal(checkoutBaseUrlFromHeaders('https://evil.example', null, FALLBACK, 'preview'), FALLBACK);
  assert.equal(checkoutBaseUrlFromHeaders('https://evil-salvazion.vercel.app', null, FALLBACK, 'preview'), FALLBACK);
  assert.equal(checkoutBaseUrlFromHeaders(null, null, FALLBACK + '/', 'preview'), FALLBACK);
  assert.equal(checkoutBaseUrlFromHeaders('not a url', null, FALLBACK, 'preview'), FALLBACK);
});

test('hub cancel_url goes back to /hub/premium?billing=cancel on the request origin', () => {
  const base = checkoutBaseUrlFromHeaders(PREVIEW, null, FALLBACK, 'preview');
  const p = buildHubCheckoutParams({ customerId: 'cus_x', userId: 'u', priceId: 'price_x', interval: 'year', baseUrl: base });
  assert.equal(p.cancel_url, `${PREVIEW}/hub/premium?billing=cancel`);
  assert.equal(p.success_url, `${PREVIEW}/hub/premium/success?session_id={CHECKOUT_SESSION_ID}`);
  assert.ok(!String(p.cancel_url).includes('/auth/signup'));
  assert.equal(p.allow_promotion_codes, false);
});

test('isCheckoutReturn detects Stripe returns', () => {
  assert.equal(isCheckoutReturn('?billing=cancel'), true);
  assert.equal(isCheckoutReturn('?session_id=cs_test_1'), true);
  assert.equal(isCheckoutReturn('?checkout=year'), false);
  assert.equal(isCheckoutReturn(''), false);
});
