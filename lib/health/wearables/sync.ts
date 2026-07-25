/**
 * Merge wearable metrics into scoring eligibility + optional sleep form sync.
 * Phone sensors and wearables stay in separate stores; combined view sums them.
 */

import {
  hasAutoLogged,
  markAutoLogged,
  loadDayIndicators,
  type DaySensorIndicators,
} from '@/lib/health/phone-sensors';
import { saveSleepEntry } from '@/lib/health/biomarkers';
import { summarizeDayWearables } from './storage';
import type { DayWearableSummary, LiveHeartRateSession } from './types';

export interface CombinedHealthIndicators {
  date: string;
  steps: number;
  activeMinutes: number;
  vigorousMinutes: number;
  distanceMeters: number;
  outdoorMinutes: number;
  sleepHours: number | null;
  avgHeartRate?: number;
  restingHr?: number;
  hrv?: number;
  spo2?: number;
  readiness?: number;
  calories?: number;
  weightKg?: number;
  sources: { phone: boolean; wearable: boolean };
  phone: DaySensorIndicators;
  wearable: DayWearableSummary;
}

/** Combine phone sensors + wearables for display / coaching / auto-log */
export function getCombinedHealthIndicators(date?: string): CombinedHealthIndicators {
  const phone = loadDayIndicators(date);
  const wearable = summarizeDayWearables(date || phone.date);

  const steps = phone.steps + wearable.steps;
  const activeMinutes = phone.activeMinutes + wearable.activeMinutes;
  const distanceMeters = phone.distanceMeters + Math.round(wearable.distanceKm * 1000);
  const outdoorMinutes = phone.outdoorMinutes;

  let sleepHours: number | null = null;
  if (phone.restDurationMin != null) sleepHours = phone.restDurationMin / 60;
  // Prefer wearable sleep when present (usually more accurate)
  if (wearable.sleepHours != null) sleepHours = wearable.sleepHours;

  return {
    date: phone.date,
    steps,
    activeMinutes,
    vigorousMinutes: phone.vigorousMinutes,
    distanceMeters,
    outdoorMinutes,
    sleepHours,
    avgHeartRate: wearable.avgHeartRate,
    restingHr: wearable.restingHr,
    hrv: wearable.hrv,
    spo2: wearable.spo2,
    readiness: wearable.readiness,
    calories: wearable.calories,
    weightKg: wearable.weightKg,
    sources: {
      phone: phone.sessions.length > 0 || phone.steps > 0 || phone.restDurationMin != null,
      wearable: wearable.samples > 0,
    },
    phone,
    wearable,
  };
}

/** Sync wearable sleep times into the circadian form when available */
export function syncWearableSleepToBiomarkers(summary?: DayWearableSummary): void {
  const wearable = summary || summarizeDayWearables();
  if (wearable.sleepBed && wearable.sleepWake) {
    saveSleepEntry(wearable.sleepBed, wearable.sleepWake);
  }
}

export function evaluateWearableAutoLog(combined: CombinedHealthIndicators): {
  canLogHit: boolean;
  canLogOutdoor: boolean;
  canLogSleep: boolean;
} {
  return {
    canLogHit: combined.activeMinutes >= 15 || combined.vigorousMinutes >= 10,
    canLogOutdoor:
      combined.outdoorMinutes >= 20 ||
      (combined.distanceMeters >= 1500 && combined.activeMinutes >= 12),
    canLogSleep:
      combined.sleepHours != null && combined.sleepHours >= 6.5 && combined.sleepHours <= 10,
  };
}

export function tryWearableAutoLogs(
  onLog: (actionType: string, label: string) => void,
  labels: { hit: string; outdoor: string; sleep: string }
): string[] {
  const combined = getCombinedHealthIndicators();
  syncWearableSleepToBiomarkers(combined.wearable);
  const hints = evaluateWearableAutoLog(combined);
  const logged: string[] = [];

  if (hints.canLogHit && !hasAutoLogged('hit_15min')) {
    markAutoLogged('hit_15min');
    onLog('hit_15min', labels.hit);
    logged.push('hit_15min');
  }
  if (hints.canLogOutdoor && !hasAutoLogged('outdoor_sun_20min')) {
    markAutoLogged('outdoor_sun_20min');
    onLog('outdoor_sun_20min', labels.outdoor);
    logged.push('outdoor_sun_20min');
  }
  if (hints.canLogSleep && !hasAutoLogged('sleep_ideal')) {
    markAutoLogged('sleep_ideal');
    onLog('sleep_ideal', labels.sleep);
    logged.push('sleep_ideal');
  }
  return logged;
}

/** Convert finished BLE HR session into metric sample payload */
export function hrSessionToMetrics(session: LiveHeartRateSession) {
  const avg =
    session.samples > 0 ? Math.round(session.sumBpm / session.samples) : session.currentBpm;
  return {
    heart_rate: avg ?? undefined,
    active_minutes: session.activeMinutes || undefined,
  };
}
