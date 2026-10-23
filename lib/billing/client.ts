'use client';

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublicEntitlement } from './types';
import { emptyPublicEntitlement } from './types';
import {
  clearPendingCheckout,
  premiumCheckoutPath,
  rememberPendingCheckout,
  signupUrlForCheckout,
} from './checkout-intent';

const CACHE_KEY = 'salvazion_entitlement';

function stripSecrets(raw: unknown): PublicEntitlement {
  const empty = emptyPublicEntitlement();
  if (!raw || typeof raw !== 'object') return empty;
  const data = raw as Record<string, unknown>;
  return {
    signedIn: Boolean(data.signedIn),
    isPremium: Boolean(data.isPremium),
    status:
      typeof data.status === 'string'
        ? (data.status as PublicEntitlement['status'])
        : 'none',
    interval:
      data.interval === 'year' || data.interval === 'month'
        ? data.interval
        : null,
    currentPeriodEnd:
      typeof data.currentPeriodEnd === 'string' ? data.currentPeriodEnd : null,
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    canManage: Boolean(data.canManage),
    source:
      data.source === 'db' || data.source === 'stripe' || data.source === 'none'
        ? data.source
        : 'none',
  };
}

function loadCache(): PublicEntitlement | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const pub = stripSecrets(parsed);
    // Drop legacy caches that stored Stripe customer ids.
    saveCache(pub);
    return pub;
  } catch {
    return null;
  }
}

function saveCache(ent: PublicEntitlement) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(ent));
  } catch {
    // ignore
  }
}

export type EntitlementRefreshResult = 'ok' | 'anonymous' | 'unauthorized' | 'error';

/** True when the browser holds a Supabase auth cookie. Chunked cookies count. */
export function cookieHeaderHasSession(header: string | null | undefined): boolean {
  if (!header) return false;
  return header.split(';').some((part) => {
    const name = part.trim().split('=')[0] || '';
    return name.startsWith('sb-') && name.includes('auth-token');
  });
}

function browserHasSession(): boolean {
  if (typeof document === 'undefined') return false;
  return cookieHeaderHasSession(document.cookie);
}

type EntitlementContextValue = {
  entitlement: PublicEntitlement;
  loading: boolean;
  refresh: () => Promise<EntitlementRefreshResult>;
  isPremium: boolean;
  canManage: boolean;
  signedIn: boolean;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const [entitlement, setEntitlement] = useState<PublicEntitlement>(() => {
    return loadCache() || emptyPublicEntitlement();
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<EntitlementRefreshResult> => {
    // No session: do not call the API. A 401 used to be requested on every
    // remount of the landing page and on the premium success poll.
    if (!browserHasSession()) {
      const empty = emptyPublicEntitlement();
      setEntitlement(empty);
      setLoading(false);
      return 'anonymous';
    }
    try {
      const res = await fetch('/api/billing/status', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) {
        const empty = emptyPublicEntitlement();
        setEntitlement(empty);
        saveCache(empty);
        setLoading(false);
        return 'unauthorized';
      }
      if (!res.ok) {
        setLoading(false);
        return 'error';
      }
      const data = stripSecrets(await res.json());
      setEntitlement(data);
      saveCache(data);
      return 'ok';
    } catch {
      return 'error';
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      entitlement,
      loading,
      refresh,
      isPremium: entitlement.isPremium,
      canManage: entitlement.canManage,
      signedIn: entitlement.signedIn,
    }),
    [entitlement, loading, refresh]
  );

  return createElement(EntitlementContext.Provider, { value }, children);
}

export function useEntitlement() {
  const ctx = useContext(EntitlementContext);
  if (!ctx) {
    throw new Error('useEntitlement must be used within EntitlementProvider');
  }
  return ctx;
}

export async function startCheckout(interval: 'month' | 'year'): Promise<void> {
  rememberPendingCheckout(interval);

  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ interval }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    url?: string;
    signupUrl?: string;
  };

  if (res.status === 403 && data.error === 'email_unverified') {
    window.location.assign(
      `/auth/verify-email?next=${encodeURIComponent(premiumCheckoutPath(interval))}`
    );
    return;
  }

  if (res.status === 401 || data.code === 'auth_required') {
    const dest =
      typeof data.signupUrl === 'string' && data.signupUrl.startsWith('/auth/')
        ? data.signupUrl
        : signupUrlForCheckout(interval);
    window.location.assign(dest);
    return;
  }

  if (!res.ok) throw new Error(data.error || 'Checkout failed');
  if (data.url) {
    // The intent is fulfilled: coming back from Stripe (cancel / back button)
    // must not auto-reopen this interval (DEC-20261021-06).
    clearPendingCheckout();
    window.location.href = data.url;
  }
}

/**
 * Run `onRestore` when the page is shown from the back/forward cache
 * (e.g. browser Back from Stripe Checkout), so busy buttons re-enable.
 */
export function usePageRestore(onRestore: () => void): void {
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) onRestore();
    };
    window.addEventListener('pageshow', handler);
    return () => window.removeEventListener('pageshow', handler);
  }, [onRestore]);
}

export async function openBillingPortal(): Promise<void> {
  const res = await fetch('/api/billing/portal', {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Portal failed');
  if (data.url) window.location.href = data.url;
}
