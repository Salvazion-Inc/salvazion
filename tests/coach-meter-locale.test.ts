import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyQuotaState } from '../lib/billing/ai-quota';
import {
  mergeUsage,
  preferFresherUsage,
  usagePatchFrom,
} from '../lib/billing/ai-usage-client';
import type { AiUsageOverview } from '../lib/billing/ai-quota';
import {
  getLocaleBootScript,
  parseLocaleCookie,
  resolveClientLocale,
} from '../lib/i18n/locale';
import { applyUpsertFallbacks, profileSexForUpsert } from '../lib/store/profile';
import { cookieHeaderHasSession } from '../lib/billing/client';

function overview(used: number): AiUsageOverview {
  const coach = emptyQuotaState('coach_chat');
  coach.used = used;
  coach.remaining = Math.max(0, (coach.limit ?? 5) - used);
  const features = {
    coach_chat: coach,
    coach_tts: emptyQuotaState('coach_tts'),
    devotional_ai: emptyQuotaState('devotional_ai'),
    vision_body: emptyQuotaState('vision_body'),
    vision_meal: emptyQuotaState('vision_meal'),
  };
  return {
    signedIn: true,
    isPremium: false,
    holderBonus: false,
    salvazionBalance: null,
    wallet: null,
    features,
  };
}

test('coach meter applies the chat usage payload immediately', () => {
  const patch = usagePatchFrom({
    reply: 'ok',
    usage: { ...emptyQuotaState('coach_chat'), used: 2, remaining: 3 },
  });
  assert.ok(patch);
  const base = overview(0);
  base.signedIn = false;
  const next = mergeUsage({ ...base, signedIn: true }, patch);
  assert.equal(next.features.coach_chat.used, 2);
  assert.equal(next.features.coach_chat.remaining, 3);
  assert.equal(next.signedIn, true);
});

test('a stale usage GET does not rewind the live coach count', () => {
  const live = overview(2);
  const stale = overview(1);
  const kept = preferFresherUsage(live, stale);
  assert.equal(kept.features.coach_chat.used, 2);
  const newer = preferFresherUsage(live, overview(3));
  assert.equal(newer.features.coach_chat.used, 3);
});

test('SSR locale follows the cookie and profile language wins over it', () => {
  assert.equal(parseLocaleCookie('es'), 'es');
  assert.equal(parseLocaleCookie('pt'), 'pt');
  assert.equal(parseLocaleCookie('fr'), null);
  assert.equal(parseLocaleCookie('a=1; salvazion_locale=pt; b=2'), 'pt');
  assert.equal(
    resolveClientLocale({
      profileLanguage: 'es',
      storedLocale: 'en',
      navigatorLanguage: 'en-US',
      fallback: 'en',
    }),
    'es'
  );
  assert.equal(
    resolveClientLocale({
      profileLanguage: 'pt',
      storedLocale: 'es',
      fallback: 'en',
    }),
    'pt'
  );
  const boot = getLocaleBootScript();
  assert.match(boot, /salvazion_profile/);
  assert.match(boot, /locale-pending/);
  assert.match(boot, /ssrLocale/);
});

test('profile upsert omits an empty sex and keeps a real one', () => {
  assert.equal(profileSexForUpsert(undefined), undefined);
  assert.equal(profileSexForUpsert(null), undefined);
  assert.equal(profileSexForUpsert(''), undefined);
  assert.equal(profileSexForUpsert('female'), 'female');
});

test('billing status is not requested when the browser has no session cookie', () => {
  assert.equal(cookieHeaderHasSession(''), false);
  assert.equal(cookieHeaderHasSession('theme=dark'), false);
  assert.equal(
    cookieHeaderHasSession('sb-kppylfrsclkdmtpobpxd-auth-token=abc'),
    true
  );
  assert.equal(
    cookieHeaderHasSession('sb-kppylfrsclkdmtpobpxd-auth-token.0=abc'),
    true
  );
});

test('a language constraint error does not rewrite Português to Español', () => {
  const payload: Record<string, unknown> = { id: 'user', language: 'pt' };
  const changed = applyUpsertFallbacks(
    payload,
    'new row for relation "profiles" violates check constraint "profiles_language_check"'
  );
  assert.equal(changed, false);
  assert.equal(payload.language, 'pt');
});

test('a bible-version error drops that column and keeps Português', () => {
  const payload: Record<string, unknown> = {
    language: 'pt',
    preferred_bible_version: 'arc',
  };
  const changed = applyUpsertFallbacks(
    payload,
    'violates check constraint "profiles_preferred_bible_version_check"'
  );
  assert.equal(changed, true);
  assert.equal('preferred_bible_version' in payload, false);
  assert.equal(payload.language, 'pt');
});
