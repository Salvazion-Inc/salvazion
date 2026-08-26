import type { BillingInterval } from './plans';

export const CHECKOUT_INTERVAL_QUERY = 'checkout';
export const PENDING_CHECKOUT_KEY = 'salvazion_pending_checkout';

export function parseBillingInterval(
  value: string | null | undefined
): BillingInterval | null {
  return value === 'year' || value === 'month' ? value : null;
}

export function premiumCheckoutPath(interval: BillingInterval): string {
  return `/hub/premium?${CHECKOUT_INTERVAL_QUERY}=${interval}`;
}

export function signupUrlForCheckout(interval: BillingInterval): string {
  return `/auth/signup?next=${encodeURIComponent(premiumCheckoutPath(interval))}`;
}

export function loginUrlForCheckout(interval: BillingInterval): string {
  return `/auth/login?next=${encodeURIComponent(premiumCheckoutPath(interval))}`;
}

export function rememberPendingCheckout(interval: BillingInterval): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, interval);
  } catch {
    /* ignore quota / private mode */
  }
}

export function peekPendingCheckout(): BillingInterval | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseBillingInterval(sessionStorage.getItem(PENDING_CHECKOUT_KEY));
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch {
    /* ignore */
  }
}

export function takePendingCheckout(): BillingInterval | null {
  const value = peekPendingCheckout();
  if (value) clearPendingCheckout();
  return value;
}

export function readCheckoutIntervalFromLocation(): BillingInterval | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      parseBillingInterval(params.get(CHECKOUT_INTERVAL_QUERY)) ||
      peekPendingCheckout()
    );
  } catch {
    return null;
  }
}
