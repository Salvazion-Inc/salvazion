import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateHolderTrial,
  holderTrialConfig,
  parseJupiterV3,
  publicTrialState,
  walletHash,
  type HolderTrialInput,
} from '../lib/billing/holder-trial';
import { buildHubCheckoutParams, buildGuestCheckoutParams } from '../lib/billing/checkout-params';

const MINT = '2XALhxGKCr2zCADkMANBq3b6rV7Zv5QF6RVZokgEAfUM';
const CFG = { minUsd: 20, maxPriceAgeSlots: 216_000, minLiquidityUsd: 0 };
const SLOT = 455_000_000;
// 10M tokens × $0.000003 = $30
const OK: HolderTrialInput = {
  wallet: 'WaLLet1111111111111111111111111111111111111',
  balanceUi: 10_000_000,
  price: { usdPrice: 0.000003, blockId: SLOT - 100, liquidityUsd: 5000 },
  currentSlot: SLOT,
  alreadyUsed: false,
};

test('eligible: verified wallet, fresh price, value >= US$20, never used', () => {
  const d = evaluateHolderTrial(OK, CFG);
  assert.equal(d.eligible, true);
  assert.equal(d.reason, 'eligible');
  assert.equal(d.usdValue, 30);
  assert.equal(publicTrialState(d), 'eligible');
});

test('exactly US$20.00 qualifies; US$19.99 does not', () => {
  const at = evaluateHolderTrial({ ...OK, balanceUi: 20 / 0.000003 + 1 }, CFG);
  assert.equal(at.eligible, true);
  const below = evaluateHolderTrial({ ...OK, balanceUi: 19.99 / 0.000003 }, CFG);
  assert.equal(below.eligible, false);
  assert.equal(below.reason, 'below_threshold');
  assert.equal(publicTrialState(below), 'rule');
});

test('below threshold → no trial', () => {
  const d = evaluateHolderTrial({ ...OK, balanceUi: 1_000_000 }, CFG); // $3
  assert.deepEqual([d.eligible, d.reason, d.usdValue], [false, 'below_threshold', 3]);
});

test('zero balance → no trial', () => {
  const d = evaluateHolderTrial({ ...OK, balanceUi: 0 }, CFG);
  assert.deepEqual([d.eligible, d.reason], [false, 'no_balance']);
});

test('unverified wallet (no wallet_holder_links row) → no trial', () => {
  const d = evaluateHolderTrial({ ...OK, wallet: null }, CFG);
  assert.deepEqual([d.eligible, d.reason], [false, 'no_wallet']);
  assert.equal(publicTrialState(d), 'none');
});

test('RPC failure is never read as a balance', () => {
  const d = evaluateHolderTrial({ ...OK, balanceUi: null }, CFG);
  assert.deepEqual([d.eligible, d.reason], [false, 'rpc_unavailable']);
  assert.equal(publicTrialState(d), 'unavailable');
});

test('price unavailable → no trial (never guess)', () => {
  for (const price of [null, { usdPrice: 0, blockId: SLOT, liquidityUsd: 1 }, { usdPrice: NaN, blockId: SLOT, liquidityUsd: 1 }]) {
    const d = evaluateHolderTrial({ ...OK, price }, CFG);
    assert.deepEqual([d.eligible, d.reason], [false, 'price_unavailable']);
  }
});

test('stale price (old slot, unknown slot) → no trial', () => {
  const old = evaluateHolderTrial({ ...OK, price: { ...OK.price!, blockId: SLOT - 216_001 } }, CFG);
  assert.deepEqual([old.eligible, old.reason], [false, 'price_stale']);
  const noBlock = evaluateHolderTrial({ ...OK, price: { ...OK.price!, blockId: null } }, CFG);
  assert.equal(noBlock.reason, 'price_stale');
  const noSlot = evaluateHolderTrial({ ...OK, currentSlot: null }, CFG);
  assert.equal(noSlot.reason, 'price_stale');
});

test('liquidity floor (when configured) → no trial on thin pools', () => {
  const cfg = { ...CFG, minLiquidityUsd: 1000 };
  const thin = evaluateHolderTrial({ ...OK, price: { ...OK.price!, liquidityUsd: 13.9 } }, cfg);
  assert.deepEqual([thin.eligible, thin.reason], [false, 'low_liquidity']);
  const unknown = evaluateHolderTrial({ ...OK, price: { ...OK.price!, liquidityUsd: null } }, cfg);
  assert.equal(unknown.reason, 'low_liquidity');
  assert.equal(evaluateHolderTrial(OK, cfg).eligible, true);
});

test('already granted (user or wallet) → no trial', () => {
  const d = evaluateHolderTrial({ ...OK, alreadyUsed: true }, CFG);
  assert.deepEqual([d.eligible, d.reason], [false, 'already_used']);
  assert.equal(publicTrialState(d), 'used');
});

test('history unreadable (Stripe error) → no trial', () => {
  const d = evaluateHolderTrial({ ...OK, alreadyUsed: null }, CFG);
  assert.deepEqual([d.eligible, d.reason], [false, 'history_unavailable']);
});

test('config: HOLDER_TRIAL_MIN_USD env, default 20, bad values ignored', () => {
  const prev = process.env.HOLDER_TRIAL_MIN_USD;
  delete process.env.HOLDER_TRIAL_MIN_USD;
  assert.equal(holderTrialConfig().minUsd, 20);
  process.env.HOLDER_TRIAL_MIN_USD = '35';
  assert.equal(holderTrialConfig().minUsd, 35);
  process.env.HOLDER_TRIAL_MIN_USD = 'abc';
  assert.equal(holderTrialConfig().minUsd, 20);
  if (prev === undefined) delete process.env.HOLDER_TRIAL_MIN_USD;
  else process.env.HOLDER_TRIAL_MIN_USD = prev;
});

test('Jupiter v3 parsing', () => {
  const q = parseJupiterV3(
    { [MINT]: { usdPrice: 0.0000029, blockId: 450740396, liquidity: 13.9, decimals: 6 } },
    MINT
  );
  assert.deepEqual(q, { usdPrice: 0.0000029, blockId: 450740396, liquidityUsd: 13.9 });
  assert.equal(parseJupiterV3({}, MINT), null);
  assert.equal(parseJupiterV3({ [MINT]: { usdPrice: null } }, MINT), null);
  assert.equal(parseJupiterV3(null, MINT), null);
});

test('wallet hash is stable and does not contain the wallet', () => {
  assert.equal(walletHash(OK.wallet!), walletHash(OK.wallet!));
  assert.notEqual(walletHash(OK.wallet!), walletHash('Other111'));
  assert.equal(walletHash(OK.wallet!).includes(OK.wallet!), false);
  assert.match(walletHash(OK.wallet!), /^[0-9a-f]{32}$/);
});

for (const interval of ['month', 'year'] as const) {
  test(`hub checkout (${interval}) with holder trial: 30-day trial, no promo codes`, () => {
    const p = buildHubCheckoutParams({
      customerId: 'cus_x',
      userId: 'user-uuid',
      priceId: 'price_x',
      interval,
      baseUrl: 'https://salvazion.org',
      holderTrial: { walletHash: 'abc123' },
    });
    assert.equal(p.subscription_data?.trial_period_days, 30);
    assert.equal(p.payment_method_collection, 'always');
    assert.equal(p.subscription_data?.metadata?.holder_trial, 'true');
    assert.equal(p.subscription_data?.metadata?.holder_trial_wallet, 'abc123');
    assert.equal(p.subscription_data?.metadata?.supabase_user_id, 'user-uuid');
    assert.equal(p.metadata?.holder_trial, 'true');
    assert.deepEqual(p.line_items, [{ price: 'price_x', quantity: 1 }]);
    // DEC-20261011-26: still no promo codes / discounts / coupons.
    assert.equal('allow_promotion_codes' in p, false);
    assert.equal('discounts' in p, false);
    assert.doesNotMatch(JSON.stringify(p), /promotion_code|coupon|discount/);
    // consent + recovery unchanged
    assert.deepEqual(p.consent_collection, { promotions: 'auto' });
    assert.deepEqual(p.after_expiration, { recovery: { enabled: true } });
    assert.match(JSON.stringify(p.custom_text), /first month of Premium is included/);
  });
}

test('hub checkout without trial is unchanged (no trial, no holder metadata)', () => {
  for (const holderTrial of [undefined, null]) {
    const p = buildHubCheckoutParams({
      customerId: 'cus_x',
      userId: 'u',
      priceId: 'price_x',
      interval: 'month',
      baseUrl: 'https://salvazion.org',
      holderTrial,
    });
    assert.equal(p.subscription_data?.trial_period_days, undefined);
    assert.equal('payment_method_collection' in p, false);
    assert.equal(p.metadata?.holder_trial, undefined);
    assert.doesNotMatch(JSON.stringify(p.custom_text), /included/);
  }
});

test('guest checkout never gets a trial', () => {
  const p = buildGuestCheckoutParams({
    priceId: 'price_x',
    interval: 'month',
    baseUrl: 'https://salvazion.org',
    metadata: { app: 'salvazion', flow: 'guest' },
  });
  assert.equal(JSON.stringify(p).includes('trial'), false);
});
