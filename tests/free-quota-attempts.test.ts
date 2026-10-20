import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { respondCoachChat } from '../app/api/coach/chat/route';
import { respondCoachTts } from '../app/api/coach/tts/route';
import { FREE_AI_LIMITS } from '../lib/billing/ai-quota';
import type { AiFeature, AiQuotaState } from '../lib/billing/ai-quota';
import type { QuotaGate } from '../lib/billing/ai-usage';
import { translate } from '../lib/i18n/dictionary';

const USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'free-verified@example.com',
  emailConfirmedAt: '2026-01-01T00:00:00.000Z',
};

function state(feature: AiFeature, used: number, limit: number, allowed: boolean): AiQuotaState & { tracked: boolean } {
  return {
    feature,
    allowed,
    unlimited: false,
    isPremium: false,
    holderBonus: false,
    salvazionBalance: null,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    period: 'day',
    periodStart: '2026-10-20',
    resetAt: '2026-10-21T00:00:00.000Z',
    tracked: true,
  };
}

/** Verified Free ledger. A refund decrements, which is how a fallback used to skip the cap. */
function ledger() {
  const used: Record<'coach_chat' | 'coach_tts', number> = { coach_chat: 0, coach_tts: 0 };
  const limits = { coach_chat: 5, coach_tts: 3 } as const;
  async function reserve(feature: 'coach_chat' | 'coach_tts'): Promise<QuotaGate> {
    const limit = limits[feature];
    if (used[feature] >= limit) {
      return {
        ok: false,
        status: 429,
        error: 'quota_exceeded',
        quota: state(feature, used[feature], limit, false),
      };
    }
    used[feature] += 1;
    return {
      ok: true,
      user: USER,
      quota: state(feature, used[feature], limit, true),
    };
  }
  async function refund(_userId: string, feature: 'coach_tts') {
    used[feature] = Math.max(0, used[feature] - 1);
  }
  return { used, reserve, refund };
}

test('verified Free chat: fallback counts, and the 6th attempt is 429', async () => {
  assert.equal(FREE_AI_LIMITS.coach_chat.limit, 5);
  const book = ledger();
  for (let n = 1; n <= 5; n += 1) {
    const res = await respondCoachChat(
      { messages: [{ role: 'user', content: `intento ${n}` }], lang: 'pt' },
      { reserve: (feature) => book.reserve(feature), configured: () => false }
    );
    assert.equal(res.status, 200, `attempt ${n}`);
    assert.equal(res.body.source, 'fallback');
    assert.match(String(res.body.reply), /você/);
    assert.doesNotMatch(String(res.body.reply), /\bteu\b|\bte\b/);
  }
  assert.equal(book.used.coach_chat, 5);
  const blocked = await respondCoachChat(
    { messages: [{ role: 'user', content: 'sexto' }], lang: 'en' },
    { reserve: (feature) => book.reserve(feature), configured: () => false }
  );
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.error, 'quota_exceeded');
  assert.match(String(blocked.body.reply), /Free AI limit reached/);
  assert.doesNotMatch(String(blocked.body.reply), /doubles|2×/);
  assert.equal(book.used.coach_chat, 5);
});

test('verified Free voice: a missing key still counts, and the 4th attempt is 429', async () => {
  assert.equal(FREE_AI_LIMITS.coach_tts.limit, 3);
  const book = ledger();
  for (let n = 1; n <= 3; n += 1) {
    const res = await respondCoachTts(
      { text: `voz ${n}`, lang: 'pt' },
      {
        reserve: (feature) => book.reserve(feature),
        refund: book.refund,
        apiKey: () => undefined,
      }
    );
    assert.equal(res.kind, 'json');
    if (res.kind !== 'json') return;
    assert.equal(res.status, 503, `attempt ${n}`);
    assert.equal(res.body.fallback, true);
  }
  assert.equal(book.used.coach_tts, 3);
  const blocked = await respondCoachTts(
    { text: 'quarta', lang: 'pt' },
    {
      reserve: (feature) => book.reserve(feature),
      refund: book.refund,
      apiKey: () => undefined,
    }
  );
  assert.equal(blocked.kind, 'json');
  if (blocked.kind !== 'json') return;
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.error, 'quota_exceeded');
  assert.equal(book.used.coach_tts, 3);
});

test('empty voice text does not keep the attempt', async () => {
  const book = ledger();
  const res = await respondCoachTts(
    { text: '   ', lang: 'en' },
    {
      reserve: (feature) => book.reserve(feature),
      refund: book.refund,
      apiKey: () => 'present-but-unused',
    }
  );
  assert.equal(res.kind, 'json');
  if (res.kind !== 'json') return;
  assert.equal(res.status, 400);
  assert.equal(book.used.coach_tts, 0);
});

test('Portuguese UI copy addresses the reader as você', () => {
  const keys = [
    'onboarding.purposeOptionalHint',
    'onboarding.lionPitch',
    'onboarding.lionPitchShort',
  ];
  for (const key of keys) {
    const text = translate('pt', key);
    assert.match(text, /você/);
    assert.doesNotMatch(text, /\b(teu|tua|teus|tuas)\b|\bte\b/);
  }
  const files = [
    'lib/i18n/dictionary-pt.ts',
    'components/coach/VoiceAgent.tsx',
    'app/api/coach/chat/route.ts',
    'lib/coach/fab-nudges.ts',
    'components/freedom/DailyIntentionCard.tsx',
    'components/salvation/PrayerMotivesPanel.tsx',
    'components/health/SleepBreathPanel.tsx',
  ];
  for (const file of files) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /\b(teu|tua|teus|tuas)\b/, file);
  }
});
