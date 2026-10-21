import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGuestCheckoutParams,
  buildHubCheckoutParams,
  premiumRecoveryParams,
  summarizeExpiredSession,
} from '../lib/billing/checkout-params';

const MONTHLY = 'price_1U0WEWHOw5ZkjRlZHXRW0gAX'; // $49/mo, salvazion_premium_monthly_49
const ANNUAL = 'price_1U0WEXHOw5ZkjRlZOwkxysed'; // $468/yr, salvazion_premium_annual_39
const BASE = 'https://salvazion.org';

function assertConsentAndRecovery(p: Record<string, unknown>) {
  // SLV-CHECKOUT-TOS-20261013-1: consent_collection is never sent.
  assert.equal('consent_collection' in p, false);
  assert.deepEqual(p.after_expiration, {
    recovery: { enabled: true, allow_promotion_codes: false },
  });
  // DEC-20261021-01 (2): promotion codes are off. No coupon, promotion_code, or discounts.
  assert.equal(p.allow_promotion_codes, false);
  assert.equal(
    (p.after_expiration as { recovery: { allow_promotion_codes?: boolean } }).recovery
      .allow_promotion_codes,
    false
  );
  assert.equal('discounts' in p, false);
  assert.doesNotMatch(JSON.stringify(p), /"coupon"|"promotion_code"|"discounts"/);
}

for (const [interval, priceId] of [
  ['month', MONTHLY],
  ['year', ANNUAL],
] as const) {
  test(`guest /premium/checkout (${interval}) has recovery and no consent_collection`, () => {
    const metadata = { app: 'salvazion', flow: 'guest', interval, price_id: priceId };
    const p = buildGuestCheckoutParams({ priceId, interval, baseUrl: BASE, metadata });
    assertConsentAndRecovery(p as Record<string, unknown>);
    assert.equal(p.mode, 'subscription');
    assert.deepEqual(p.line_items, [{ price: priceId, quantity: 1 }]);
    assert.equal(p.success_url, `${BASE}/premium/welcome?session_id={CHECKOUT_SESSION_ID}`);
    assert.equal(p.cancel_url, `${BASE}/?billing=cancel#pricing`);
    assert.equal(p.billing_address_collection, 'auto');
    assert.equal(p.customer, undefined);
    assert.deepEqual(p.metadata, metadata);
    assert.deepEqual(p.subscription_data, { metadata });
    assert.match(JSON.stringify(p.custom_text), /salvazion\.org\/terms/);
    assert.match(JSON.stringify(p.custom_text), /account is created with this email/);
  });

  test(`signed-in hub checkout (${interval}) has recovery and no consent_collection`, () => {
    const p = buildHubCheckoutParams({
      customerId: 'cus_test123',
      userId: 'user-uuid',
      priceId,
      interval,
      baseUrl: BASE,
    });
    assertConsentAndRecovery(p as Record<string, unknown>);
    assert.equal(p.mode, 'subscription');
    assert.equal(p.customer, 'cus_test123');
    assert.equal(p.client_reference_id, 'user-uuid');
    assert.deepEqual(p.line_items, [{ price: priceId, quantity: 1 }]);
    assert.equal(p.success_url, `${BASE}/hub/premium/success?session_id={CHECKOUT_SESSION_ID}`);
    assert.equal(p.cancel_url, `${BASE}/hub/premium?billing=cancel`);
    assert.deepEqual(p.metadata, {
      supabase_user_id: 'user-uuid',
      app: 'salvazion',
      interval,
      price_id: priceId,
    });
    assert.deepEqual(p.subscription_data, {
      metadata: { supabase_user_id: 'user-uuid', app: 'salvazion', interval },
    });
    assert.match(JSON.stringify(p.custom_text), /salvazion\.org\/privacy/);
  });
}

test('DEC-20261021-01 (2): Checkout Session is created without promotion codes', () => {
  const guest = buildGuestCheckoutParams({
    priceId: MONTHLY,
    interval: 'month',
    baseUrl: BASE,
    metadata: { app: 'salvazion', flow: 'guest', interval: 'month', price_id: MONTHLY },
  });
  const hub = buildHubCheckoutParams({
    customerId: 'cus_test123',
    userId: 'user-uuid',
    priceId: ANNUAL,
    interval: 'year',
    baseUrl: BASE,
  });
  for (const p of [guest, hub]) {
    assert.equal(p.allow_promotion_codes, false);
    assert.equal(p.discounts, undefined);
    assert.equal(p.subscription_data?.discounts, undefined);
    assert.equal(p.after_expiration?.recovery?.allow_promotion_codes, false);
    assert.doesNotMatch(JSON.stringify(p), /"coupon"|"promotion_code"/);
  }
});

test('shared params are a fresh object each call', () => {
  const a = premiumRecoveryParams();
  const b = premiumRecoveryParams();
  assert.notEqual(a, b);
  assert.deepEqual(a, b);
});

test('expired-session summary carries no email, customer id or recovery URL', () => {
  const s = summarizeExpiredSession({
    metadata: { app: 'salvazion', flow: 'guest', interval: 'month' },
    consent: { promotions: 'opt_in', terms_of_service: null },
    after_expiration: {
      recovery: {
        enabled: true,
        allow_promotion_codes: true,
        url: 'https://buy.stripe.com/r/live_secret',
        expires_at: 1792000000,
      },
    },
    recovered_from: null,
  } as never);
  assert.deepEqual(s, {
    app: 'salvazion',
    flow: 'guest',
    interval: 'month',
    promotions_consent: 'opt_in',
    recovery_enabled: true,
    recovery_url_present: true,
    recovery_expires_at: 1792000000,
  });
  assert.doesNotMatch(JSON.stringify(s), /buy\.stripe\.com|@/);
  const empty = summarizeExpiredSession({
    metadata: {},
    consent: null,
    after_expiration: null,
    recovered_from: null,
  } as never);
  assert.equal(empty.recovery_enabled, false);
  assert.equal(empty.flow, 'hub');
});

test('smoke mode: preview allowed, prod only with matching token', async () => {
  const { isSmokeRequestAllowed } = await import('../lib/billing/guest-checkout');
  const env = { ...process.env };
  process.env.VERCEL_ENV = 'preview';
  delete process.env.SMOKE_CHECKOUT_TOKEN;
  assert.equal(isSmokeRequestAllowed(null), true);
  process.env.VERCEL_ENV = 'production';
  assert.equal(isSmokeRequestAllowed('x'), false);
  process.env.SMOKE_CHECKOUT_TOKEN = 'tok';
  assert.equal(isSmokeRequestAllowed('nope'), false);
  assert.equal(isSmokeRequestAllowed('tok'), true);
  process.env = env;
});
