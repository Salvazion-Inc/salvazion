'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PublicEntitlement } from './types';
import { emptyPublicEntitlement } from './types';
import { guestCheckoutPath, rememberPendingCheckout } from './checkout-intent';

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

export function useEntitlement() {
  const [entitlement, setEntitlement] = useState<PublicEntitlement>(() => {
    return loadCache() || emptyPublicEntitlement();
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/status', { credentials: 'include' });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = stripSecrets(await res.json());
      setEntitlement(data);
      saveCache(data);
    } catch {
      // keep cache
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    entitlement,
    loading,
    refresh,
    isPremium: entitlement.isPremium,
    canManage: entitlement.canManage,
    signedIn: entitlement.signedIn,
  };
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
    guestCheckoutUrl?: string;
  };

  if (res.status === 401 || data.code === 'auth_required') {
    // Logged out: straight to Stripe Checkout; the account is created after payment.
    const dest =
      typeof data.guestCheckoutUrl === 'string' && data.guestCheckoutUrl.startsWith('/premium/')
        ? data.guestCheckoutUrl
        : guestCheckoutPath(interval);
    window.location.assign(dest);
    return;
  }

  if (!res.ok) throw new Error(data.error || 'Checkout failed');
  if (data.url) window.location.href = data.url;
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
