'use client';

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AI_FEATURES,
  emptyQuotaState,
  type AiFeature,
  type AiQuotaState,
  type AiUsageOverview,
} from './ai-quota';

function emptyOverview(): AiUsageOverview {
  const features = {} as Record<AiFeature, AiQuotaState>;
  for (const feature of AI_FEATURES) {
    features[feature] = emptyQuotaState(feature);
  }
  return {
    signedIn: false,
    isPremium: false,
    holderBonus: false,
    salvazionBalance: null,
    wallet: null,
    features,
  };
}

export function mergeUsage(
  overview: AiUsageOverview,
  patch: AiQuotaState | null | undefined
): AiUsageOverview {
  if (!patch?.feature) return overview;
  return {
    ...overview,
    isPremium: patch.isPremium,
    holderBonus: patch.holderBonus,
    salvazionBalance: patch.salvazionBalance,
    features: {
      ...overview.features,
      [patch.feature]: patch,
    },
  };
}

/**
 * A quota response is newer than a cached GET when the same period already
 * shows a higher count. Keeps "Coach IA: x / 5 hoy" from snapping backwards.
 */
export function preferFresherUsage(
  current: AiUsageOverview,
  incoming: AiUsageOverview
): AiUsageOverview {
  const features = { ...incoming.features };
  for (const feature of AI_FEATURES) {
    const prev = current.features[feature];
    const next = features[feature];
    if (!prev || !next) continue;
    if (prev.periodStart && prev.periodStart === next.periodStart && prev.used > next.used) {
      features[feature] = prev;
    }
  }
  return { ...incoming, features };
}

export function usagePatchFrom(payload: unknown): AiQuotaState | null {
  if (!payload || typeof payload !== 'object' || !('usage' in payload)) return null;
  const usage = (payload as { usage?: unknown }).usage;
  if (!usage || typeof usage !== 'object') return null;
  const patch = usage as Partial<AiQuotaState>;
  if (typeof patch.feature !== 'string' || typeof patch.used !== 'number') return null;
  return usage as AiQuotaState;
}

type AiUsageContextValue = {
  overview: AiUsageOverview;
  loading: boolean;
  refresh: () => Promise<void>;
  apply: (patch: AiQuotaState | null | undefined) => void;
};

const AiUsageContext = createContext<AiUsageContextValue | null>(null);

export function AiUsageProvider({ children }: { children: ReactNode }) {
  const [overview, setOverview] = useState<AiUsageOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/ai-usage', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as AiUsageOverview;
      if (data?.features) {
        setOverview((prev) => preferFresherUsage(prev, data));
      }
    } catch {
      // keep last snapshot
    } finally {
      setLoading(false);
    }
  }, []);

  const apply = useCallback((patch: AiQuotaState | null | undefined) => {
    if (!patch?.feature || typeof patch.used !== 'number') return;
    setOverview((prev) => mergeUsage({ ...prev, signedIn: true }, patch));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ overview, loading, refresh, apply }),
    [overview, loading, refresh, apply]
  );

  return createElement(AiUsageContext.Provider, { value }, children);
}

export function useAiUsage() {
  const ctx = useContext(AiUsageContext);
  if (!ctx) {
    throw new Error('useAiUsage must be used within AiUsageProvider');
  }
  return ctx;
}
