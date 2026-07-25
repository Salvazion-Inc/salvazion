/**
 * Native health bridge — HealthKit (iOS) + Health Connect (Android)
 * via Capacitor shell. On web PWA this reports unavailable.
 *
 * Plugin contract: SalvazionHealth (see native/capacitor)
 */

import type { WearableMetricKey } from '../types';

export type NativePlatform = 'ios' | 'android' | 'web' | 'unknown';

export interface NativeHealthAvailability {
  platform: NativePlatform;
  isNative: boolean;
  healthKit: boolean;
  healthConnect: boolean;
  pluginReady: boolean;
  message: string;
}

export type NativeMetrics = Partial<Record<WearableMetricKey, number | string>>;

export interface NativeSyncResult {
  ok: boolean;
  source: 'healthkit' | 'health_connect' | 'none';
  metrics: NativeMetrics;
  authorized: boolean;
  error?: string;
}

interface SalvazionHealthPlugin {
  isAvailable(): Promise<{
    platform: string;
    healthKit: boolean;
    healthConnect: boolean;
  }>;
  requestAuthorization(options?: {
    read?: string[];
  }): Promise<{ authorized: boolean }>;
  queryToday(): Promise<{
    steps?: number;
    activeMinutes?: number;
    distanceMeters?: number;
    activeCalories?: number;
    restingHeartRate?: number;
    heartRateAvg?: number;
    hrv?: number;
    sleepMinutes?: number;
    sleepBed?: string;
    sleepWake?: string;
    spo2?: number;
    weightKg?: number;
  }>;
}

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
      Plugins?: Record<string, unknown>;
    };
    SalvazionHealth?: SalvazionHealthPlugin;
  }
}

function getPlugin(): SalvazionHealthPlugin | null {
  if (typeof window === 'undefined') return null;
  // Capacitor 3+ register pattern
  const plugins = window.Capacitor?.Plugins;
  if (plugins && 'SalvazionHealth' in plugins) {
    return plugins.SalvazionHealth as SalvazionHealthPlugin;
  }
  if (window.SalvazionHealth) return window.SalvazionHealth;
  return null;
}

export function detectNativePlatform(): NativePlatform {
  if (typeof window === 'undefined') return 'unknown';
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return 'web';
  const p = cap.getPlatform?.() || '';
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return 'unknown';
}

export function getNativeHealthAvailability(): NativeHealthAvailability {
  const platform = detectNativePlatform();
  const isNative = platform === 'ios' || platform === 'android';
  const plugin = getPlugin();

  if (!isNative) {
    return {
      platform: 'web',
      isNative: false,
      healthKit: false,
      healthConnect: false,
      pluginReady: false,
      message:
        'HealthKit / Health Connect require the Salvazion native shell (Capacitor). Use OAuth or manual entry on web.',
    };
  }

  return {
    platform,
    isNative: true,
    healthKit: platform === 'ios',
    healthConnect: platform === 'android',
    pluginReady: Boolean(plugin),
    message: plugin
      ? platform === 'ios'
        ? 'HealthKit ready'
        : 'Health Connect ready'
      : 'Native shell detected but SalvazionHealth plugin is not installed.',
  };
}

export async function requestNativeHealthAuth(): Promise<{
  authorized: boolean;
  error?: string;
}> {
  const plugin = getPlugin();
  if (!plugin) {
    return {
      authorized: false,
      error: 'PLUGIN_MISSING',
    };
  }
  try {
    const res = await plugin.requestAuthorization({
      read: [
        'steps',
        'distance',
        'activeEnergy',
        'heartRate',
        'restingHeartRate',
        'heartRateVariability',
        'sleepAnalysis',
        'oxygenSaturation',
        'bodyMass',
        'exerciseTime',
      ],
    });
    return { authorized: !!res.authorized };
  } catch (e) {
    return {
      authorized: false,
      error: e instanceof Error ? e.message : 'AUTH_FAILED',
    };
  }
}

export async function syncNativeHealthToday(): Promise<NativeSyncResult> {
  const avail = getNativeHealthAvailability();
  if (!avail.isNative) {
    return {
      ok: false,
      source: 'none',
      metrics: {},
      authorized: false,
      error: 'NOT_NATIVE',
    };
  }

  const plugin = getPlugin();
  if (!plugin) {
    return {
      ok: false,
      source: avail.healthKit ? 'healthkit' : 'health_connect',
      metrics: {},
      authorized: false,
      error: 'PLUGIN_MISSING',
    };
  }

  try {
    const auth = await plugin.requestAuthorization();
    if (!auth.authorized) {
      return {
        ok: false,
        source: avail.healthKit ? 'healthkit' : 'health_connect',
        metrics: {},
        authorized: false,
        error: 'DENIED',
      };
    }

    const raw = await plugin.queryToday();
    const metrics: NativeMetrics = {};
    if (raw.steps != null) metrics.steps = raw.steps;
    if (raw.activeMinutes != null) metrics.active_minutes = raw.activeMinutes;
    if (raw.distanceMeters != null) {
      metrics.distance_km = Math.round((raw.distanceMeters / 1000) * 100) / 100;
    }
    if (raw.activeCalories != null) metrics.calories = raw.activeCalories;
    if (raw.restingHeartRate != null) metrics.resting_hr = raw.restingHeartRate;
    if (raw.heartRateAvg != null) metrics.heart_rate = raw.heartRateAvg;
    if (raw.hrv != null) metrics.hrv = raw.hrv;
    if (raw.sleepMinutes != null) {
      metrics.sleep_hours = Math.round((raw.sleepMinutes / 60) * 10) / 10;
    }
    if (raw.sleepBed) metrics.sleep_bed = raw.sleepBed;
    if (raw.sleepWake) metrics.sleep_wake = raw.sleepWake;
    if (raw.spo2 != null) metrics.spo2 = raw.spo2;
    if (raw.weightKg != null) metrics.weight_kg = raw.weightKg;

    return {
      ok: true,
      source: avail.healthKit ? 'healthkit' : 'health_connect',
      metrics,
      authorized: true,
    };
  } catch (e) {
    return {
      ok: false,
      source: avail.healthKit ? 'healthkit' : 'health_connect',
      metrics: {},
      authorized: false,
      error: e instanceof Error ? e.message : 'SYNC_FAILED',
    };
  }
}
