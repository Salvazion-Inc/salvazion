import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseUtmCookie, sanitizeUtmValue, serializeUtmCookie, utmFromSearchParams,
  utmToMetadata, utmToProfileColumns,
} from '../lib/attribution/utm';
import { buildHubCheckoutParams } from '../lib/billing/checkout-params';

const JOIN = 'next=/hub/premium&utm_source=x&utm_medium=social&utm_campaign=signup_premium_oct26';

test('parses /join target UTMs', () => {
  assert.deepEqual(utmFromSearchParams(new URLSearchParams(JOIN)), {
    utm_source: 'x', utm_medium: 'social', utm_campaign: 'signup_premium_oct26',
  });
  assert.equal(utmFromSearchParams(new URLSearchParams('next=/hub')), null);
});

test('sanitizes and length-limits', () => {
  assert.equal(sanitizeUtmValue('<script>x</script>'), 'scriptxscript');
  assert.equal(sanitizeUtmValue('a'.repeat(300))!.length, 100);
  assert.equal(sanitizeUtmValue('   '), undefined);
  assert.equal(sanitizeUtmValue(42), undefined);
});

test('cookie roundtrip and garbage tolerance', () => {
  const u = { utm_source: 'x', utm_term: 'faith health' };
  assert.deepEqual(parseUtmCookie(serializeUtmCookie(u)), u);
  assert.equal(parseUtmCookie('%%%'), null);
  assert.equal(parseUtmCookie(undefined), null);
});

test('profile columns stamp all keys', () => {
  const c = utmToProfileColumns({ utm_source: 'x' }, new Date('2026-10-21T13:00:00Z'));
  assert.equal(c.utm_source, 'x');
  assert.equal(c.utm_medium, null);
  assert.equal(c.utm_captured_at, '2026-10-21T13:00:00.000Z');
});

test('hub checkout carries only non-empty utm in both metadata objects', () => {
  const p = buildHubCheckoutParams({
    customerId: 'cus_1', userId: 'u1', priceId: 'price_1', interval: 'month',
    baseUrl: 'https://salvazion.org', holderTrial: null,
    utm: { utm_source: 'x', utm_medium: '', utm_campaign: 'signup_premium_oct26' },
  });
  for (const m of [p.metadata!, p.subscription_data!.metadata!]) {
    assert.equal(m.utm_source, 'x');
    assert.equal(m.utm_campaign, 'signup_premium_oct26');
    assert.equal('utm_medium' in m, false);
    assert.equal(m.supabase_user_id, 'u1');
  }
  const none = buildHubCheckoutParams({
    customerId: 'cus_1', userId: 'u1', priceId: 'price_1', interval: 'month',
    baseUrl: 'https://salvazion.org', holderTrial: null,
  });
  assert.equal(Object.keys(none.metadata!).some((k) => k.startsWith('utm_')), false);
  assert.deepEqual(utmToMetadata(null), {});
});
