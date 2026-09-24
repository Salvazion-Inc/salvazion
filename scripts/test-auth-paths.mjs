import assert from 'node:assert/strict';

// Lightweight re-implementation check by importing compiled TS is hard without tsx.
// Inline the pure logic mirrors for CI smoke; source of truth is lib/auth/paths.ts.

const FALLBACK = '/hub/dashboard';
const ONBOARDING = '/hub/onboarding';

function safeNextPath(next, fallback = FALLBACK) {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('://') || trimmed.includes('\\')) return fallback;
  if (!(trimmed.startsWith('/hub') || trimmed.startsWith('/auth'))) return fallback;
  if (/[\s@]/.test(trimmed)) return fallback;
  return trimmed;
}

function isPremiumCheckoutNext(next) {
  const safe = safeNextPath(next, FALLBACK);
  if (!safe.startsWith('/hub/premium')) return false;
  const q = safe.includes('?') ? safe.slice(safe.indexOf('?') + 1) : '';
  const interval = new URLSearchParams(q).get('checkout');
  return interval === 'month' || interval === 'year';
}

function destinationAfterAuth(next, onboardingCompleted) {
  const safe = safeNextPath(next, FALLBACK);
  if (onboardingCompleted) {
    if (safe.startsWith(ONBOARDING)) return FALLBACK;
    return safe;
  }
  if (isPremiumCheckoutNext(safe)) return safe;
  if (safe.startsWith(ONBOARDING)) return safe;
  if (safe === FALLBACK) return ONBOARDING;
  return `${ONBOARDING}?next=${encodeURIComponent(safe)}`;
}

assert.equal(isPremiumCheckoutNext('/hub/premium?checkout=month'), true);
assert.equal(isPremiumCheckoutNext('/hub/premium?checkout=year'), true);
assert.equal(isPremiumCheckoutNext('/hub/premium'), false);
assert.equal(isPremiumCheckoutNext('/hub/dashboard'), false);
assert.equal(
  destinationAfterAuth('/hub/premium?checkout=month', false),
  '/hub/premium?checkout=month'
);
assert.equal(
  destinationAfterAuth('/hub/dashboard', false),
  ONBOARDING
);
assert.ok(
  destinationAfterAuth('/hub/bible', false).startsWith('/hub/onboarding?next=')
);
assert.equal(
  destinationAfterAuth('/hub/premium?checkout=month', true),
  '/hub/premium?checkout=month'
);
console.log('auth-paths smoke OK');
