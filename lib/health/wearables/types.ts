/**
 * Wearables & health monitors — Phase C
 * Watches, rings, bands, chest straps, scales, etc.
 */

export type WearableCategory =
  | 'watch'
  | 'ring'
  | 'band'
  | 'chest_strap'
  | 'scale'
  | 'other';

export type WearableConnectMode =
  | 'web_bluetooth_hr'
  | 'manual'
  | 'oauth'
  | 'oauth_planned'
  | 'healthkit'
  | 'health_connect'
  | 'health_connect_planned';

export type WearableBrandId =
  | 'apple_watch'
  | 'garmin'
  | 'fitbit'
  | 'samsung'
  | 'oura'
  | 'whoop'
  | 'ultrahuman'
  | 'amazfit'
  | 'polar'
  | 'withings'
  | 'xiaomi'
  | 'generic_ble_hr'
  | 'generic_other';

export interface WearableCatalogItem {
  brandId: WearableBrandId;
  name: string;
  nameEs: string;
  namePt: string;
  category: WearableCategory;
  connectModes: WearableConnectMode[];
  /** Metrics this brand typically provides */
  metrics: WearableMetricKey[];
  icon: string;
  note?: string;
  noteEs?: string;
  notePt?: string;
}

export type WearableMetricKey =
  | 'heart_rate'
  | 'resting_hr'
  | 'hrv'
  | 'steps'
  | 'active_minutes'
  | 'calories'
  | 'sleep_hours'
  | 'sleep_bed'
  | 'sleep_wake'
  | 'spo2'
  | 'stress'
  | 'distance_km'
  | 'weight_kg'
  | 'body_fat'
  | 'readiness';

export interface LinkedWearable {
  id: string;
  brandId: WearableBrandId;
  /** User-facing label, e.g. "Oura Ring Gen3" */
  label: string;
  category: WearableCategory;
  connectMode: WearableConnectMode;
  /** BLE device id if available (not always stable across browsers) */
  bleDeviceId?: string;
  bleDeviceName?: string;
  linkedAt: string;
  lastSyncAt?: string;
  enabled: boolean;
}

export interface WearableMetricSample {
  id: string;
  wearableId: string;
  brandId: WearableBrandId;
  date: string; // YYYY-MM-DD
  recordedAt: string;
  source: 'ble' | 'manual' | 'import' | 'oauth' | 'healthkit' | 'health_connect';
  metrics: Partial<Record<WearableMetricKey, number | string>>;
  note?: string;
}

export interface DayWearableSummary {
  date: string;
  avgHeartRate?: number;
  restingHr?: number;
  hrv?: number;
  steps: number;
  activeMinutes: number;
  calories?: number;
  sleepHours?: number;
  sleepBed?: string;
  sleepWake?: string;
  spo2?: number;
  distanceKm: number;
  weightKg?: number;
  readiness?: number;
  samples: number;
  deviceIds: string[];
  updatedAt: string;
}

export interface LiveHeartRateSession {
  wearableId: string;
  deviceName: string;
  startedAt: string;
  currentBpm: number | null;
  samples: number;
  minBpm: number | null;
  maxBpm: number | null;
  sumBpm: number;
  activeMinutes: number;
  /** Seconds with bpm above zone thresholds */
  zoneModerateSec: number;
  zoneVigorousSec: number;
}
