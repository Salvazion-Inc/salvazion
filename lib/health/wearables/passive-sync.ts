/**
 * Passive wearable refresh: run on Dashboard / Health open without requiring
 * the user to open Profile → Settings and tap Sync.
 * Best-effort, silent on failure.
 */

import {
  addMetricSample,
  linkWearable,
  loadLinkedWearables,
} from './storage';
import {
  getCombinedHealthIndicators,
  tryWearableAutoLogs,
  type CombinedHealthIndicators,
} from './sync';
import type { WearableBrandId, WearableMetricKey } from './types';

const OAUTH_BRANDS = ['fitbit', 'oura', 'whoop', 'garmin'] as const;
type OauthBrand = (typeof OAUTH_BRANDS)[number];

const LAST_PASSIVE_KEY = 'salvazion_wearables_last_passive_sync';
/** Avoid hammering OAuth APIs on every navigation (5 min). */
const PASSIVE_COOLDOWN_MS = 5 * 60 * 1000;

export type PassiveSyncResult = {
  syncedProviders: string[];
  autoLogged: string[];
  combined: CombinedHealthIndicators;
  fromCacheOnly: boolean;
};

function lastPassiveAt(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return Number(localStorage.getItem(LAST_PASSIVE_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function markPassiveNow(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_PASSIVE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function applyOAuthMetrics(
  provider: OauthBrand,
  metrics: Partial<Record<WearableMetricKey, number | string>>
): void {
  const devices = loadLinkedWearables();
  let device = devices.find((d) => d.brandId === provider && d.enabled);
  if (!device) {
    // OAuth can exist without a local "linked" row; create a soft device id.
    device = linkWearable({
      brandId: provider as WearableBrandId,
      connectMode: 'oauth',
      label: provider,
    });
  }
  addMetricSample({
    wearableId: device.id,
    brandId: provider as WearableBrandId,
    metrics,
    source: 'oauth',
  });
}

/**
 * Sync connected OAuth providers (if any) + apply auto-log thresholds.
 * Always re-evaluates local phone/wearable samples even when OAuth is skipped.
 */
export async function runPassiveHealthSync(opts?: {
  lang?: 'es' | 'en' | 'pt';
  force?: boolean;
  onLog?: (actionType: string, label: string) => void;
}): Promise<PassiveSyncResult> {
  const lang = opts?.lang || 'es';
  const labels = {
    hit:
      lang === 'en'
        ? 'Device activity ≥ 15 min'
        : 'Actividad del dispositivo ≥ 15 min',
    outdoor:
      lang === 'en'
        ? 'Device outdoor / distance'
        : 'Exterior / distancia del dispositivo',
    sleep:
      lang === 'en'
        ? 'Device sleep'
        : lang === 'pt'
          ? 'Sono do dispositivo'
          : 'Sueño del dispositivo',
  };

  const now = Date.now();
  const cool = !opts?.force && now - lastPassiveAt() < PASSIVE_COOLDOWN_MS;
  const syncedProviders: string[] = [];

  if (!cool && typeof window !== 'undefined') {
    try {
      const statusRes = await fetch('/api/wearables/oauth/status', {
        cache: 'no-store',
      });
      if (statusRes.ok) {
        const statusJson = (await statusRes.json()) as {
          connected?: string[];
          providers?: { id: string; connected?: boolean }[];
        };
        const fromList = (statusJson.connected || []).filter((id): id is OauthBrand =>
          (OAUTH_BRANDS as readonly string[]).includes(id)
        );
        const fromProviders = (statusJson.providers || [])
          .filter((p) => p.connected && (OAUTH_BRANDS as readonly string[]).includes(p.id))
          .map((p) => p.id as OauthBrand);
        const connected = [...new Set([...fromList, ...fromProviders])];

        await Promise.all(
          connected.map(async (id) => {
            try {
              const res = await fetch(`/api/wearables/oauth/${id}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              });
              const json = await res.json();
              if (res.ok && json.success && json.metrics) {
                applyOAuthMetrics(id, json.metrics);
                syncedProviders.push(id);
              }
            } catch {
              /* silent */
            }
          })
        );
        markPassiveNow();
      }
    } catch {
      /* offline / no session — still auto-log from local samples */
    }
  }

  const onLog =
    opts?.onLog ||
    ((actionType: string) => {
      void import('@/lib/scoring/engine').then(({ logAction }) => {
        logAction(actionType);
      });
    });

  // Prefer sync log when caller provided onLog (updates UI scores immediately)
  const autoLogged = tryWearableAutoLogs(
    (type, label) => {
      onLog(type, label);
    },
    labels
  );

  return {
    syncedProviders,
    autoLogged,
    combined: getCombinedHealthIndicators(),
    fromCacheOnly: cool,
  };
}
