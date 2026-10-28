import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canUseService,
  decideServiceAccess,
  isEmailVerified,
  type ServiceUser,
} from '../lib/auth/service-access';
import { isUnconfirmedEmailMessage } from '../lib/auth/paths';
import { translate } from '../lib/i18n/dictionary';
import { isTrackableUserId } from '../lib/billing/ai-usage';

const anon = null;
const unverified: ServiceUser = { id: '11111111-1111-4111-8111-111111111111', emailConfirmedAt: null };
const verified: ServiceUser = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'member@example.com',
  emailConfirmedAt: '2026-01-01T00:00:00Z',
};
const oauthNoEmail: ServiceUser = {
  id: '33333333-3333-4333-8333-333333333333',
  email: null,
  emailConfirmedAt: '2026-01-01T00:00:00Z',
};

function decide(
  pathname: string,
  user: ServiceUser | null,
  extras: { method?: string; search?: string } = {}
) {
  return decideServiceAccess({ pathname, user, ...extras });
}

test('AI counters are only for real account ids', () => {
  assert.equal(isTrackableUserId('local-dev'), false);
  assert.equal(isTrackableUserId('anon'), false);
  assert.equal(isTrackableUserId(''), false);
  assert.equal(isTrackableUserId('22222222-2222-4222-8222-222222222222'), true);
});

test('email is verified only when a confirmation timestamp is present', () => {
  assert.equal(isEmailVerified(null), false);
  assert.equal(isEmailVerified({ emailConfirmedAt: null }), false);
  assert.equal(isEmailVerified({ email_confirmed_at: '' }), false);
  assert.equal(isEmailVerified({ email_confirmed_at: '2026-01-01T00:00:00Z' }), true);
  assert.equal(isEmailVerified({ confirmed_at: '2026-01-01T00:00:00Z' }), true);
});

test('public pages, auth callbacks, webhook, health, and smoke stay open', () => {
  for (const pathname of ['/', '/privacy', '/terms']) {
    assert.deepEqual(decide(pathname, anon), { action: 'allow' });
  }
  for (const pathname of ['/auth/callback', '/auth/confirm', '/auth/callback/recover']) {
    assert.deepEqual(decide(pathname, anon), { action: 'allow' });
  }
  assert.deepEqual(decide('/auth/login', anon), { action: 'allow' });
  assert.deepEqual(decide('/auth/signup', anon), { action: 'allow' });
  assert.deepEqual(decide('/api/billing/webhook', anon, { method: 'POST' }), { action: 'allow' });
  assert.deepEqual(decide('/api/stripe/webhook', anon, { method: 'GET' }), { action: 'allow' });
  assert.deepEqual(decide('/api/stripe/webhook', anon, { method: 'POST' }), { action: 'allow' });
  assert.deepEqual(decide('/api/auth/resend-confirmation', anon, { method: 'POST' }), {
    action: 'allow',
  });
  assert.deepEqual(decide('/auth/verify-email', anon), { action: 'allow' });
  assert.deepEqual(decide('/api/health', anon), { action: 'allow' });
  assert.deepEqual(decide('/api/healthz', anon), { action: 'allow' });
  assert.deepEqual(decide('/api/internal/holder-metrics', anon), { action: 'allow' });
  assert.deepEqual(decide('/premium/welcome', anon), { action: 'allow' });
  assert.deepEqual(decide('/premium/checkout', anon, { method: 'HEAD' }), { action: 'allow' });
  assert.deepEqual(decide('/premium/checkout', anon, { search: '?plan=month&e2e=1' }), {
    action: 'allow',
  });
});

test('anonymous service pages go to signup with a return path', () => {
  assert.deepEqual(decide('/hub/dashboard', anon), {
    action: 'redirect',
    location: '/auth/signup?next=' + encodeURIComponent('/hub/dashboard'),
  });
  assert.deepEqual(decide('/hub/premium', anon, { search: '?checkout=month' }), {
    action: 'redirect',
    location: '/auth/signup?next=' + encodeURIComponent('/hub/premium?checkout=month'),
  });
  assert.deepEqual(decide('/dashboard', anon), {
    action: 'redirect',
    location: '/auth/signup?next=' + encodeURIComponent('/dashboard'),
  });
  const checkout = decide('/premium/checkout', anon, { search: '?plan=year' });
  assert.equal(checkout.action, 'redirect');
  if (checkout.action === 'redirect') {
    assert.equal(checkout.location.startsWith('/auth/signup?next='), true);
    assert.equal(checkout.location.includes('/premium/checkout'), false);
    assert.match(decodeURIComponent(checkout.location), /\/hub\/premium\?checkout=year/);
  }
});

test('anonymous APIs are 401, including AI, quota, holder, and vision', () => {
  const paths = [
    '/api/coach/chat',
    '/api/coach/tts',
    '/api/billing/ai-usage',
    '/api/billing/status',
    '/api/billing/checkout',
    '/api/billing/portal',
    '/api/billing/holder-trial',
    '/api/wallet/holder',
    '/api/wallet/holder/challenge',
    '/api/wallet/holder/verify',
    '/api/devotional',
    '/api/geo/geocode',
    '/api/geo/nearby-churches',
    '/api/score',
    '/api/events',
    '/api/health/vision',
    '/api/wearables/oauth/status',
    '/api/founders/dashboard',
    '/api/business/kpis',
    '/api/profile/avatar',
  ];
  for (const pathname of paths) {
    assert.deepEqual(decide(pathname, anon, { method: 'POST' }), { action: 'unauthorized' }, pathname);
  }
});

test('signed-in unverified users see the verify screen or get 403', () => {
  const page = decide('/hub/coach', unverified);
  assert.equal(page.action, 'redirect');
  if (page.action === 'redirect') {
    assert.equal(page.location.startsWith('/auth/verify-email?next='), true);
    assert.match(decodeURIComponent(page.location), /\/hub\/coach/);
  }
  assert.deepEqual(decide('/api/coach/chat', unverified, { method: 'POST' }), { action: 'unverified' });
  assert.deepEqual(decide('/api/wallet/holder', unverified), { action: 'unverified' });
  assert.deepEqual(decide('/api/billing/ai-usage', unverified), { action: 'unverified' });
  const login = decide('/auth/login', unverified, { search: '?next=/hub/dashboard' });
  assert.equal(login.action, 'redirect');
  if (login.action === 'redirect') {
    assert.match(login.location, /^\/auth\/verify-email\?next=/);
  }
});

test('verified users pass, and auth screens send them onward', () => {
  assert.deepEqual(decide('/hub/dashboard', verified), { action: 'allow' });
  assert.deepEqual(decide('/api/coach/chat', verified, { method: 'POST' }), { action: 'allow' });
  assert.deepEqual(decide('/api/wallet/holder/verify', verified, { method: 'POST' }), { action: 'allow' });
  assert.deepEqual(decide('/auth/login', verified, { search: '?next=/hub/premium?checkout=month' }), {
    action: 'redirect',
    location: '/hub/premium?checkout=month',
  });
  assert.deepEqual(decide('/auth/verify-email', verified, { search: '?next=/hub/bible' }), {
    action: 'redirect',
    location: '/hub/bible',
  });
  assert.deepEqual(decide('/premium/checkout', verified, { search: '?e2e=1' }), { action: 'allow' });
});

test('a confirmed session with no email stays on the verify screen', () => {
  assert.equal(canUseService(oauthNoEmail), false);
  assert.equal(canUseService(verified), true);
  const page = decide('/hub/coach', oauthNoEmail);
  assert.equal(page.action, 'redirect');
  if (page.action === 'redirect') {
    assert.match(page.location, /^\/auth\/verify-email\?next=/);
  }
  assert.deepEqual(decide('/api/coach/chat', oauthNoEmail, { method: 'POST' }), {
    action: 'unverified',
  });
});

test('unconfirmed login copy is localized and the public verify page stays open', () => {
  assert.equal(isUnconfirmedEmailMessage('Email not confirmed'), true);
  assert.equal(isUnconfirmedEmailMessage('Invalid login credentials'), false);
  const en = translate('en', 'auth.emailNotConfirmed');
  const es = translate('es', 'auth.emailNotConfirmed');
  const pt = translate('pt', 'auth.emailNotConfirmed');
  assert.match(en, /Confirm your email/);
  assert.match(es, /Confirma tu email/);
  assert.match(pt, /Confirme seu email/);
  assert.equal(en === es || en === pt, false);
  for (const text of [en, es, pt, translate('en', 'auth.addEmailBody'), translate('en', 'auth.resendGeneric')]) {
    assert.doesNotMatch(text, /investment|reward|bonus|governance/i);
  }
});

test('password update needs a session', () => {
  assert.deepEqual(decide('/auth/update-password', anon), {
    action: 'redirect',
    location: '/auth/login?error=session_missing',
  });
  assert.deepEqual(decide('/auth/update-password', unverified), { action: 'allow' });
});

test('wearable OAuth callback is a browser return, not an anonymous API', () => {
  const anonHit = decide('/api/wearables/oauth/fitbit/callback', anon);
  assert.equal(anonHit.action, 'redirect');
  if (anonHit.action === 'redirect') assert.match(anonHit.location, /^\/auth\/signup\?next=/);
  assert.deepEqual(decide('/api/wearables/oauth/fitbit/callback', unverified), {
    action: 'redirect',
    location:
      '/auth/verify-email?next=' +
      encodeURIComponent('/hub/profile?settings=1&tab=wearables'),
  });
  assert.deepEqual(decide('/api/wearables/oauth/fitbit/sync', anon, { method: 'POST' }), {
    action: 'unauthorized',
  });
});

test('partner funnel events endpoint is reachable without a session', () => {
  for (const user of [anon, unverified, verified]) {
    assert.deepEqual(
      decideServiceAccess({ pathname: '/api/partners/events', method: 'POST', search: '', user }),
      { action: 'allow' }
    );
  }
  // Neighbouring partner APIs stay gated.
  assert.notDeepEqual(
    decideServiceAccess({ pathname: '/api/partners/other', method: 'POST', search: '', user: anon }),
    { action: 'allow' }
  );
});
