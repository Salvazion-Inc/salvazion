/**
 * Auth redirect helpers — prevent open redirects and normalize destinations.
 */

import type { Language } from '@/lib/types';
import { translate } from '@/lib/i18n/dictionary';

const FALLBACK = '/hub/dashboard';
const ONBOARDING = '/hub/onboarding';

function isFounderDashboard(path: string): boolean {
  return path === '/dashboard' || path.startsWith('/dashboard?');
}

/** Only allow relative in-app paths under /hub, /auth, or the founder dashboard. */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string = FALLBACK
): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('://') || trimmed.includes('\\')) return fallback;
  if (
    !(
      trimmed.startsWith('/hub') ||
      trimmed.startsWith('/auth') ||
      isFounderDashboard(trimmed)
    )
  ) {
    return fallback;
  }
  // Block nested protocol tricks like /hub/dashboard@evil.com
  if (/[\s@]/.test(trimmed)) return fallback;
  return trimmed;
}

/** Append a safe `next` query to login / signup so Premium checkout can resume. */
export function withNextQuery(pathname: string, next: string | null | undefined): string {
  const safe = safeNextPath(next, FALLBACK);
  return `${pathname}?next=${encodeURIComponent(safe)}`;
}

function nestedNextParam(pathWithSearch: string): string | null {
  const q = pathWithSearch.indexOf('?');
  if (q < 0) return null;
  return new URLSearchParams(pathWithSearch.slice(q + 1)).get('next');
}

/** True when `next` is a Premium checkout resume (skip onboarding gate). */
export function isPremiumCheckoutNext(next: string | null | undefined): boolean {
  const safe = safeNextPath(next, FALLBACK);
  if (!safe.startsWith('/hub/premium')) return false;
  try {
    const q = safe.includes('?') ? safe.slice(safe.indexOf('?') + 1) : '';
    const interval = new URLSearchParams(q).get('checkout');
    return interval === 'month' || interval === 'year';
  } catch {
    return false;
  }
}

/**
 * After login/signup: finish onboarding first, then resume `next`
 * (e.g. `/hub/premium?checkout=month`).
 * Exception: an active Premium checkout intent goes straight to Checkout —
 * forcing onboarding before pay was the #1 measured conversion friction.
 */
export function destinationAfterAuth(
  next: string | null | undefined,
  onboardingCompleted: boolean
): string {
  const safe = safeNextPath(next, FALLBACK);
  if (safe === '/dashboard' || safe.startsWith('/dashboard?')) return safe;
  if (onboardingCompleted) {
    if (safe.startsWith(ONBOARDING)) {
      const nested = nestedNextParam(safe);
      return nested ? safeNextPath(nested, FALLBACK) : FALLBACK;
    }
    return safe;
  }
  // Paying now: do not park the user in onboarding before Stripe Checkout.
  if (isPremiumCheckoutNext(safe)) return safe;
  if (safe.startsWith(ONBOARDING)) return safe;
  if (safe === FALLBACK) return ONBOARDING;
  return `${ONBOARDING}?next=${encodeURIComponent(safe)}`;
}

/** Supabase refuses password login until the signup email is confirmed. */
export function isUnconfirmedEmailMessage(message: string | null | undefined): boolean {
  const m = (message || '').toLowerCase();
  return m.includes('email not confirmed') || m.includes('email_not_confirmed');
}

function isRateLimitedMessage(message: string): boolean {
  return (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('security purposes') ||
    message.includes('only request this after') ||
    message.includes('over_request_rate_limit') ||
    message.includes('over_email_send_rate_limit')
  );
}

/**
 * Map a Supabase or app auth error into the active UI language.
 * Unknown provider text is returned as-is.
 */
export function mapAuthError(message: string | null | undefined, lang: Language): string {
  const say = (key: string) => translate(lang, key);
  if (!message) return say('auth.errGeneric');
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials')) return say('auth.errInvalidCredentials');
  if (isUnconfirmedEmailMessage(m)) return say('auth.emailNotConfirmed');
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return say('auth.errAlreadyRegistered');
  }
  if (m.includes('password should be at least') || m.includes('password is known')) {
    return say('auth.errPasswordWeak');
  }
  if (m.includes('signup is disabled')) return say('auth.errSignupDisabled');
  if (isRateLimitedMessage(m)) return say('auth.errRateLimited');
  if (m.includes('network') || m.includes('fetch')) return say('auth.errNetwork');
  if (
    m.includes('missing next_public_supabase') ||
    m.includes('supabase no está') ||
    m.includes('supabase is not configured') ||
    m.includes('supabase não está')
  ) {
    return say('auth.errSupabaseMissing');
  }
  if (
    m.includes('provider is not enabled') ||
    m.includes('unsupported provider') ||
    m.includes('x no está activado') ||
    m.includes('google no está activado') ||
    m.includes('google is not enabled')
  ) {
    if (m.includes('google')) return say('auth.errGoogleDisabled');
    return say('auth.errProviderDisabled');
  }
  if (
    m.includes('client-not-enrolled') ||
    m.includes('client not enrolled') ||
    m.includes('client-forbidden') ||
    m.includes('client forbidden') ||
    m.includes('attached to a project')
  ) {
    return say('auth.errXNotEnrolled');
  }
  if (
    m.includes('user profile from external provider') ||
    m.includes('getting user profile') ||
    m.includes('user email from external provider') ||
    m.includes('unexpected_failure')
  ) {
    return say('auth.errXProfile');
  }

  return message;
}

/** Query-param error codes from our own redirects. */
export function mapQueryAuthError(code: string | null | undefined, lang: Language): string | null {
  if (!code) return null;
  const say = (key: string) => translate(lang, key);
  switch (code) {
    case 'auth_callback_failed':
      return say('auth.errCallbackFailed');
    case 'confirm_failed':
      return say('auth.errConfirmFailed');
    case 'session_missing':
      return say('auth.errSessionMissing');
    case 'password_updated':
      return null;
    default:
      return null;
  }
}
