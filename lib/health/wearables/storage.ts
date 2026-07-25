import type {
  DayWearableSummary,
  LinkedWearable,
  WearableBrandId,
  WearableCategory,
  WearableConnectMode,
  WearableMetricKey,
  WearableMetricSample,
} from './types';
import { getCatalogItem } from './registry';

const STORAGE_DEVICES = 'salvazion_wearables_linked';
const STORAGE_SAMPLES = 'salvazion_wearables_samples';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadLinkedWearables(): LinkedWearable[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_DEVICES);
    return raw ? (JSON.parse(raw) as LinkedWearable[]) : [];
  } catch {
    return [];
  }
}

export function saveLinkedWearables(list: LinkedWearable[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_DEVICES, JSON.stringify(list));
}

export function linkWearable(input: {
  brandId: WearableBrandId;
  label?: string;
  connectMode: WearableConnectMode;
  bleDeviceId?: string;
  bleDeviceName?: string;
  category?: WearableCategory;
}): LinkedWearable {
  const catalog = getCatalogItem(input.brandId);
  const device: LinkedWearable = {
    id: uid(),
    brandId: input.brandId,
    label: input.label?.trim() || catalog?.nameEs || catalog?.name || input.brandId,
    category: input.category || catalog?.category || 'other',
    connectMode: input.connectMode,
    bleDeviceId: input.bleDeviceId,
    bleDeviceName: input.bleDeviceName,
    linkedAt: new Date().toISOString(),
    enabled: true,
  };
  const list = loadLinkedWearables();
  list.push(device);
  saveLinkedWearables(list);
  return device;
}

export function unlinkWearable(id: string): void {
  saveLinkedWearables(loadLinkedWearables().filter((d) => d.id !== id));
}

export function touchWearableSync(id: string): void {
  const list = loadLinkedWearables().map((d) =>
    d.id === id ? { ...d, lastSyncAt: new Date().toISOString() } : d
  );
  saveLinkedWearables(list);
}

export function loadMetricSamples(): WearableMetricSample[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SAMPLES);
    return raw ? (JSON.parse(raw) as WearableMetricSample[]) : [];
  } catch {
    return [];
  }
}

export function saveMetricSamples(samples: WearableMetricSample[]): void {
  if (typeof window === 'undefined') return;
  // Keep last ~400 samples to bound storage
  const trimmed = samples.slice(-400);
  localStorage.setItem(STORAGE_SAMPLES, JSON.stringify(trimmed));
}

export function addMetricSample(input: {
  wearableId: string;
  brandId: WearableBrandId;
  metrics: Partial<Record<WearableMetricKey, number | string>>;
  source: WearableMetricSample['source'];
  note?: string;
  date?: string;
}): WearableMetricSample {
  const sample: WearableMetricSample = {
    id: uid(),
    wearableId: input.wearableId,
    brandId: input.brandId,
    date: input.date || today(),
    recordedAt: new Date().toISOString(),
    source: input.source,
    metrics: input.metrics,
    note: input.note,
  };
  const all = loadMetricSamples();
  all.push(sample);
  saveMetricSamples(all);
  touchWearableSync(input.wearableId);
  return sample;
}

export function getSamplesForDate(date = today()): WearableMetricSample[] {
  return loadMetricSamples().filter((s) => s.date === date);
}

function num(v: number | string | undefined): number | undefined {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Aggregate today's wearable samples into a summary for indicators */
export function summarizeDayWearables(date = today()): DayWearableSummary {
  const samples = getSamplesForDate(date);
  const hrs: number[] = [];
  let restingHr: number | undefined;
  let hrv: number | undefined;
  let steps = 0;
  let activeMinutes = 0;
  let calories: number | undefined;
  let sleepHours: number | undefined;
  let sleepBed: string | undefined;
  let sleepWake: string | undefined;
  let spo2: number | undefined;
  let distanceKm = 0;
  let weightKg: number | undefined;
  let readiness: number | undefined;
  const deviceIds = new Set<string>();

  for (const s of samples) {
    deviceIds.add(s.wearableId);
    const m = s.metrics;
    const hr = num(m.heart_rate);
    if (hr != null) hrs.push(hr);
    const rhr = num(m.resting_hr);
    if (rhr != null) restingHr = rhr;
    const h = num(m.hrv);
    if (h != null) hrv = h;
    const st = num(m.steps);
    if (st != null) steps += st;
    const am = num(m.active_minutes);
    if (am != null) activeMinutes += am;
    const cal = num(m.calories);
    if (cal != null) calories = (calories || 0) + cal;
    const sh = num(m.sleep_hours);
    if (sh != null) sleepHours = sh;
    if (typeof m.sleep_bed === 'string') sleepBed = m.sleep_bed;
    if (typeof m.sleep_wake === 'string') sleepWake = m.sleep_wake;
    const sp = num(m.spo2);
    if (sp != null) spo2 = sp;
    const dist = num(m.distance_km);
    if (dist != null) distanceKm += dist;
    const w = num(m.weight_kg);
    if (w != null) weightKg = w;
    const rd = num(m.readiness);
    if (rd != null) readiness = rd;
  }

  return {
    date,
    avgHeartRate: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : undefined,
    restingHr,
    hrv,
    steps,
    activeMinutes,
    calories,
    sleepHours,
    sleepBed,
    sleepWake,
    spo2,
    distanceKm,
    weightKg,
    readiness,
    samples: samples.length,
    deviceIds: [...deviceIds],
    updatedAt: new Date().toISOString(),
  };
}
