'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  addMetricSample,
  getNativeHealthAvailability,
  linkWearable,
  loadLinkedWearables,
  requestNativeHealthAuth,
  syncNativeHealthToday,
  tryWearableAutoLogs,
  type NativeHealthAvailability,
  type WearableBrandId,
  type WearableMetricKey,
} from '@/lib/health/wearables';
import { useI18n } from '@/components/I18nProvider';

type ProviderRow = {
  id: 'fitbit' | 'oura' | 'whoop' | 'garmin';
  name: string;
  brandId: string;
  configured: boolean;
  connected: boolean;
};

interface Props {
  onAutoLog: (actionType: string, label: string) => void;
  onSleepSynced?: (bedTime: string, wakeTime: string) => void;
}

const OAUTH_BRAND: Record<string, WearableBrandId> = {
  fitbit: 'fitbit',
  oura: 'oura',
  whoop: 'whoop',
  garmin: 'garmin',
};

export default function CloudNativeSyncPanel({ onAutoLog, onSleepSynced }: Props) {
  const { t, lang } = useI18n();
  const search = useSearchParams();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [native, setNative] = useState<NativeHealthAvailability | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/wearables/oauth/status', { cache: 'no-store' });
      const json = await res.json();
      setProviders(json.providers || []);
    } catch {
      setProviders([]);
    }
    setNative(getNativeHealthAvailability());
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void refreshStatus();
    });
    return () => cancelAnimationFrame(id);
  }, [refreshStatus]);

  // Handle OAuth redirect query params
  useEffect(() => {
    const connected = search.get('wearable_connected');
    const err = search.get('wearable_error');
    if (!connected && !err) return;

    const id = requestAnimationFrame(() => {
      if (connected) {
        setNote(t('wearables.oauthConnected', { name: connected }));
        const brand = OAUTH_BRAND[connected];
        if (brand) {
          const existing = loadLinkedWearables().find(
            (d) => d.brandId === brand && d.connectMode === 'oauth'
          );
          if (!existing) {
            linkWearable({
              brandId: brand,
              connectMode: 'oauth',
              label: connected.charAt(0).toUpperCase() + connected.slice(1),
            });
          }
        }
        void refreshStatus();
        if (typeof window !== 'undefined') {
          const u = new URL(window.location.href);
          u.searchParams.delete('wearable_connected');
          window.history.replaceState({}, '', u.pathname + u.search);
        }
      }
      if (err) {
        setError(t('wearables.oauthError', { error: err }));
        if (typeof window !== 'undefined') {
          const u = new URL(window.location.href);
          u.searchParams.delete('wearable_error');
          window.history.replaceState({}, '', u.pathname + u.search);
        }
      }
    });
    return () => cancelAnimationFrame(id);
  }, [search, t, refreshStatus]);

  const applyMetrics = (
    brandId: WearableBrandId,
    metrics: Partial<Record<WearableMetricKey, number | string>>,
    source: 'oauth' | 'healthkit' | 'health_connect',
    label: string
  ) => {
    let device = loadLinkedWearables().find(
      (d) =>
        d.brandId === brandId &&
        (d.connectMode === 'oauth' ||
          d.connectMode === 'healthkit' ||
          d.connectMode === 'health_connect')
    );
    if (!device) {
      device = linkWearable({
        brandId,
        label,
        connectMode:
          source === 'oauth' ? 'oauth' : source === 'healthkit' ? 'healthkit' : 'health_connect',
      });
    }
    addMetricSample({
      wearableId: device.id,
      brandId,
      metrics,
      source,
    });
    tryWearableAutoLogs(onAutoLog, {
      hit:
        lang === 'en'
          ? 'Cloud/native activity'
          : lang === 'pt'
            ? 'Atividade cloud/nativa'
            : 'Actividad cloud/nativa',
      outdoor:
        lang === 'en'
          ? 'Cloud/native distance'
          : lang === 'pt'
            ? 'Distância cloud/nativa'
            : 'Distancia cloud/nativa',
      sleep:
        lang === 'en'
          ? 'Cloud/native sleep'
          : lang === 'pt'
            ? 'Sono cloud/nativo'
            : 'Sueño cloud/nativo',
    });
    if (typeof metrics.sleep_bed === 'string' && typeof metrics.sleep_wake === 'string') {
      onSleepSynced?.(metrics.sleep_bed, metrics.sleep_wake);
    }
  };

  const connectOAuth = (id: string) => {
    window.location.assign(
      `/api/wearables/oauth/${id}/start?returnTo=${encodeURIComponent('/hub/profile?settings=1&tab=wearables')}`
    );
  };

  const syncOAuth = async (id: string) => {
    setBusy(id);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(`/api/wearables/oauth/${id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || t('wearables.syncFailed'));
        return;
      }
      const brand = OAUTH_BRAND[id];
      if (brand && json.metrics) {
        applyMetrics(brand, json.metrics, 'oauth', id);
        setNote(t('wearables.syncOk', { name: id }));
      }
      await refreshStatus();
    } catch {
      setError(t('wearables.syncFailed'));
    } finally {
      setBusy(null);
    }
  };

  const disconnectOAuth = async (id: string) => {
    setBusy(`disc-${id}`);
    try {
      await fetch(`/api/wearables/oauth/${id}/disconnect`, { method: 'POST' });
      setNote(t('wearables.oauthDisconnected', { name: id }));
      await refreshStatus();
    } finally {
      setBusy(null);
    }
  };

  const syncNative = async () => {
    setBusy('native');
    setError(null);
    setNote(null);
    try {
      const auth = await requestNativeHealthAuth();
      if (!auth.authorized) {
        setError(
          auth.error === 'PLUGIN_MISSING'
            ? t('wearables.nativePluginMissing')
            : t('wearables.nativeDenied')
        );
        return;
      }
      const result = await syncNativeHealthToday();
      if (!result.ok) {
        setError(
          result.error === 'NOT_NATIVE'
            ? t('wearables.nativeWebOnly')
            : result.error || t('wearables.syncFailed')
        );
        return;
      }
      const brandId: WearableBrandId =
        result.source === 'healthkit' ? 'apple_watch' : 'samsung';
      applyMetrics(
        brandId,
        result.metrics,
        result.source === 'healthkit' ? 'healthkit' : 'health_connect',
        result.source === 'healthkit' ? 'HealthKit' : 'Health Connect'
      );
      setNote(
        result.source === 'healthkit'
          ? t('wearables.healthkitSynced')
          : t('wearables.healthConnectSynced')
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mb-6">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--sage)] flex items-center gap-2">
          <span>☁️</span> {t('wearables.cloudTitle')}
        </h2>
        <p className="text-[11px] text-[var(--sage)]/80 mt-0.5">{t('wearables.cloudSubtitle')}</p>
      </div>

      <div className="card-soft p-4 space-y-4">
        {/* OAuth providers */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--sage)]">{t('wearables.oauthProviders')}</p>
          {providers.length === 0 && (
            <p className="text-[11px] text-[var(--sage)]/70">{t('wearables.oauthLoading')}</p>
          )}
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-[10px] text-[var(--sage)]">
                  {p.connected
                    ? t('wearables.statusConnected')
                    : p.configured
                      ? t('wearables.statusReady')
                      : t('wearables.statusNotConfigured')}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {!p.connected && (
                  <button
                    type="button"
                    disabled={!p.configured || busy === p.id}
                    onClick={() => connectOAuth(p.id)}
                    className="btn-sm disabled:opacity-40"
                  >
                    {t('wearables.connectOAuth')}
                  </button>
                )}
                {p.connected && (
                  <>
                    <button
                      type="button"
                      disabled={busy === p.id}
                      onClick={() => void syncOAuth(p.id)}
                      className="btn-sm"
                    >
                      {busy === p.id ? t('wearables.syncing') : t('wearables.syncNow')}
                    </button>
                    <button
                      type="button"
                      disabled={busy === `disc-${p.id}`}
                      onClick={() => void disconnectOAuth(p.id)}
                      className="btn-outline-sm"
                    >
                      {t('wearables.disconnect')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Native HealthKit / Health Connect */}
        <div className="border-t border-[var(--border-soft)] pt-3 space-y-2">
          <p className="text-xs font-medium text-[var(--sage)]">{t('wearables.nativeTitle')}</p>
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-3 space-y-2">
            <p className="text-[11px] text-[var(--sage)] leading-relaxed">
              {native?.message || t('wearables.nativeChecking')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className={`pill-soft ${native?.healthKit ? 'pill-soft-active' : ''}`}>
                HealthKit {native?.healthKit ? '✓' : '·'}
              </span>
              <span className={`pill-soft ${native?.healthConnect ? 'pill-soft-active' : ''}`}>
                Health Connect {native?.healthConnect ? '✓' : '·'}
              </span>
              <span className={`pill-soft ${native?.pluginReady ? 'pill-soft-active' : ''}`}>
                Plugin {native?.pluginReady ? '✓' : '·'}
              </span>
            </div>
            <button
              type="button"
              disabled={busy === 'native'}
              onClick={() => void syncNative()}
              className="btn-secondary py-2.5 text-sm"
            >
              {busy === 'native' ? t('wearables.syncing') : t('wearables.syncNative')}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
        )}
        {note && !error && (
          <p className="text-xs text-[var(--accent)] bg-[var(--surface-active)] rounded-xl px-3 py-2">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}
