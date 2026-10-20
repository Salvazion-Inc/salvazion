import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FREE_AI_LIMITS,
  SALVAZION_HOLDER_MULTIPLIER,
  emptyQuotaState,
  freeLimitFor,
} from '../lib/billing/ai-quota';
import { translate } from '../lib/i18n/dictionary';

test('DEC-20261014-01: a holder flag does not raise Free limits', () => {
  assert.equal(SALVAZION_HOLDER_MULTIPLIER, 1);
  assert.equal(freeLimitFor('coach_chat', true), 5);
  assert.equal(freeLimitFor('coach_chat', false), FREE_AI_LIMITS.coach_chat.limit);
  assert.equal(freeLimitFor('coach_tts', true), 3);
  const doubled = emptyQuotaState('coach_chat', { holderBonus: true });
  assert.equal(doubled.limit, 5);
  assert.equal(doubled.holderBonus, false);
});

test('quota and holder copy does not promise a doubled Free cap', () => {
  const keys = [
    'quota.exhaustedBody',
    'quota.exhaustedHolderBody',
    'quota.holderActive',
    'quota.holderHint',
    'quota.holderHintShort',
    'quota.holderShort',
    'holder.title',
    'holder.subtitle',
    'holder.verify',
    'holder.active',
    'holder.noBalance',
    'holder.premiumNote',
    'wallet.amountHint',
  ];
  for (const lang of ['en', 'es', 'pt'] as const) {
    for (const key of keys) {
      const text = translate(lang, key);
      assert.doesNotMatch(text, /2×|2x|bonus|bono|bônus|bônus|dobl|duplica|double/i, `${lang} ${key}: ${text}`);
    }
  }
});
