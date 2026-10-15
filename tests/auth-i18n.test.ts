import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapAuthError, mapQueryAuthError } from '../lib/auth/paths';
import { canUseService, decideServiceAccess, type ServiceUser } from '../lib/auth/service-access';
import { translate } from '../lib/i18n/dictionary';

const RATE = 'For security purposes, you can only request this after 60 seconds.';

test('signup rate-limit copy follows EN, ES, and PT', () => {
  const en = mapAuthError(RATE, 'en');
  const es = mapAuthError('email rate limit exceeded', 'es');
  const pt = mapAuthError('over_email_send_rate_limit', 'pt');
  assert.equal(en, 'Too many attempts. Wait a moment and try again.');
  assert.equal(es, 'Demasiados intentos. Espera un momento e inténtalo de nuevo.');
  assert.equal(pt, 'Tentativas demais. Espere um momento e tente de novo.');
  assert.equal(pt.includes('Demasiados'), false);
  assert.notEqual(en, es);
  assert.notEqual(pt, es);
});

test('mapped auth errors are localized, including query codes', () => {
  const keys = [
    'auth.errGeneric',
    'auth.errInvalidCredentials',
    'auth.errAlreadyRegistered',
    'auth.errPasswordWeak',
    'auth.errSignupDisabled',
    'auth.errRateLimited',
    'auth.errNetwork',
    'auth.errSupabaseMissing',
    'auth.errCallbackFailed',
    'auth.errConfirmFailed',
    'auth.errSessionMissing',
    'auth.emailNotConfirmed',
  ];
  for (const key of keys) {
    const en = translate('en', key);
    const es = translate('es', key);
    const pt = translate('pt', key);
    assert.notEqual(en, key, key);
    assert.notEqual(en, es, key);
    assert.notEqual(pt, es, key);
    assert.doesNotMatch(`${en} ${es} ${pt}`, /investment|reward|bonus|governance/i);
  }
  assert.equal(mapAuthError('Invalid login credentials', 'pt'), translate('pt', 'auth.errInvalidCredentials'));
  assert.equal(mapAuthError('Email not confirmed', 'en'), translate('en', 'auth.emailNotConfirmed'));
  assert.equal(mapAuthError('User already registered', 'pt'), translate('pt', 'auth.errAlreadyRegistered'));
  assert.equal(mapQueryAuthError('session_missing', 'pt'), translate('pt', 'auth.errSessionMissing'));
  assert.equal(mapQueryAuthError('auth_callback_failed', 'en'), translate('en', 'auth.errCallbackFailed'));
});

test('Check your email exists in EN, ES, and PT', () => {
  assert.equal(translate('en', 'auth.checkEmail'), 'Check your email');
  assert.equal(translate('es', 'auth.checkEmail'), 'Revisa tu correo');
  assert.equal(translate('pt', 'auth.checkEmail'), 'Confira seu email');
  assert.match(translate('en', 'auth.checkEmailBody'), /confirmation link/);
  assert.match(translate('es', 'auth.checkEmailBody'), /enlace de confirmación/);
  assert.match(translate('pt', 'auth.checkEmailBody'), /link de confirmação/);
  assert.match(translate('pt', 'auth.activateAndReturn'), /Comunidade/);
  assert.equal(translate('pt', 'auth.verifyResend'), 'Reenviar email de confirmação');
});

test('a session with no email is sent to Add your email and APIs stay closed', () => {
  const oauthNoEmail: ServiceUser = {
    id: '33333333-3333-4333-8333-333333333333',
    email: null,
    emailConfirmedAt: '2026-01-01T00:00:00Z',
  };
  assert.equal(canUseService(oauthNoEmail), false);
  const page = decideServiceAccess({ pathname: '/hub/coach', user: oauthNoEmail });
  assert.equal(page.action, 'redirect');
  if (page.action === 'redirect') {
    assert.equal(
      page.location,
      '/auth/verify-email?next=' + encodeURIComponent('/hub/coach')
    );
  }
  assert.deepEqual(
    decideServiceAccess({ pathname: '/api/coach/chat', method: 'POST', user: oauthNoEmail }),
    { action: 'unverified' }
  );
  assert.equal(translate('en', 'auth.addEmailTitle'), 'Add your email');
  assert.equal(translate('es', 'auth.addEmailTitle'), 'Agrega tu email');
  assert.equal(translate('pt', 'auth.addEmailTitle'), 'Adicione seu email');
  assert.match(translate('en', 'auth.addEmailBody'), /did not include an email/);
});
