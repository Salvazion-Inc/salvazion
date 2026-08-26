'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Entitlement } from './types';
import { emptyEntitlement } from './types';
import { rememberPendingCheckout, signupUrlForCheckout } from './checkout-intent';

const CACHE_KEY = 'salvazion_entitlement';

function loadCache(): Entitlement | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Entitlement;
  } catch {
    return null;
  }
}

function saveCache(ent: Entitlement) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(ent));
  } catch {
    // ignore
  }
}

export function useEntitlement() {
  const [entitlement, setEntitlement] = useState<Entitlement>(() => {
    return loadCache() || emptyEntitlement();
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/status', { credentials: 'include' });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as Entitlement;
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

  return { entitlement, loading, refresh, isPremium: entitlement.isPremium };
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

  if (res.status === 401 || data.code === 'auth_required') {
    const dest =
      typeof data.signupUrl === 'string' && data.signupUrl.startsWith('/auth/')
        ? data.signupUrl
        : signupUrlForCheckout(interval);
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
