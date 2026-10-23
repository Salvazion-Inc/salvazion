import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authEmailRedirectTo, authRedirectOrigin, strayAuthCodeTarget } from '../lib/auth/email-redirect';

const PREV = 'https://salvazion-86rl6tx5q-salvazion.vercel.app';

test('preview host only on VERCEL_ENV=preview', () => {
  assert.equal(authRedirectOrigin(PREV, 'preview'), PREV);
  assert.equal(authRedirectOrigin(PREV, 'production'), 'https://salvazion.org');
  assert.equal(authRedirectOrigin(PREV, undefined), 'https://salvazion.org');
  assert.equal(authRedirectOrigin('https://evil-salvazion.vercel.app', 'preview'), 'https://salvazion.org');
  assert.equal(authRedirectOrigin('https://www.salvazion.org', 'production'), 'https://salvazion.org');
  assert.equal(authRedirectOrigin('http://localhost:3000', 'development'), 'http://localhost:3000');
});

test('email redirect goes to /auth/callback with encoded next', () => {
  assert.equal(
    authEmailRedirectTo('/hub/premium', 'https://salvazion.org', 'production'),
    'https://salvazion.org/auth/callback?next=%2Fhub%2Fpremium'
  );
});

test('stray /?code= forwards to /auth/callback', () => {
  const t = strayAuthCodeTarget(new URL('https://salvazion.org/?code=abc'))!;
  assert.equal(t.toString(), 'https://salvazion.org/auth/callback?code=abc&next=%2Fhub%2Fonboarding');
  const n = strayAuthCodeTarget(new URL('https://salvazion.org/?code=abc&next=/hub/premium'))!;
  assert.equal(n.searchParams.get('next'), '/hub/premium');
  const bad = strayAuthCodeTarget(new URL('https://salvazion.org/?code=abc&next=//evil.com'))!;
  assert.equal(bad.searchParams.get('next'), '/hub/onboarding');
  const e = strayAuthCodeTarget(new URL('https://salvazion.org/?error=access_denied&error_description=Email+link+is+invalid'))!;
  assert.equal(e.searchParams.get('error'), 'Email link is invalid');
  assert.equal(strayAuthCodeTarget(new URL('https://salvazion.org/auth/callback?code=abc')), null);
  assert.equal(strayAuthCodeTarget(new URL('https://salvazion.org/api/wearables/oauth/x/callback?code=abc')), null);
  assert.equal(strayAuthCodeTarget(new URL('https://salvazion.org/')), null);
});

test('stray-code rescue never touches /auth/* (no login<->callback loop)', () => {
  assert.equal(strayAuthCodeTarget(new URL('https://salvazion.org/auth/login?error=auth_callback_failed&detail=x')), null);
  assert.equal(strayAuthCodeTarget(new URL('https://salvazion.org/auth/callback/recover?code=a&err=x')), null);
});
