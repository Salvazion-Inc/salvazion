'use client';

import { useCallback, useEffect, useState } from 'react';
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

export function useAiUsage() {
  const [overview, setOverview] = useState<AiUsageOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/ai-usage', { credentials: 'include' });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as AiUsageOverview;
      if (data?.features) setOverview(data);
    } catch {
      // keep last snapshot
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { overview, loading, refresh };
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
