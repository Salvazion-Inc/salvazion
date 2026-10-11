import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGuestCheckoutParams,
  buildHubCheckoutParams,
  premiumConsentAndRecoveryParams,
  summarizeExpiredSession,
} from '../lib/billing/checkout-params';

const MONTHLY = 'price_1U0WEWHOw5ZkjRlZHXRW0gAX'; // $49/mo, salvazion_premium_monthly_49
const ANNUAL = 'price_1U0WEXHOw5ZkjRlZOwkxysed'; // $468/yr, salvazion_premium_annual_39
const BASE = 'https://salvazion.org';

function assertConsentAndRecovery(p: Record<string, unknown>) {
  assert.deepEqual(p.consent_collection, { promotions: 'auto' });
  assert.deepEqual(p.after_expiration, {
    recovery: { enabled: true, allow_promotion_codes: true },
  });
  // Unchanged from before: promotion codes allowed, and the same on recovery.
  assert.equal(p.allow_promotion_codes, true);
  // Never ask Stripe to require terms acceptance or pre-set consent here.
  assert.equal((p.consent_collection as Record<string, unknown>).terms_of_service, undefined);
}

for (const [interval, priceId] of [
  ['month', MONTHLY],
  ['year', ANNUAL],
] as const) {
  test(`guest /premium/checkout (${interval}) has consent + recovery`, () => {
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

  test(`signed-in hub checkout (${interval}) has consent + recovery`, () => {
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

test('shared params are a fresh object each call', () => {
  const a = premiumConsentAndRecoveryParams();
  const b = premiumConsentAndRecoveryParams();
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
