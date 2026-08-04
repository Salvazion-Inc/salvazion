/**
 * Pull today's metrics from each cloud wearable API into a common shape.
 */

import type { WearableMetricKey } from '../types';
import type { OAuthProviderId } from './providers';
import { getValidAccessToken } from './token-exchange';

export type OAuthMetricsMap = Partial<Record<WearableMetricKey, number | string>>;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function authGet(url: string, token: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text.slice(0, 160)}`);
  }
  return res.json();
}

// ─── Fitbit via Google Health API (legacy Fitbit Web API ends 2026-09-30) ───

function civilDayRange(date: string) {
  const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
  return {
    start: {
      date: { year: y, month: m, day: d },
      time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 },
    },
    end: {
      date: { year: y, month: m, day: d },
      time: { hours: 23, minutes: 59, seconds: 59, nanos: 0 },
    },
  };
}

async function googleHealthDailyRollUp(
  token: string,
  dataType: string,
  date: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `https://health.googleapis.com/v4/users/me/dataTypes/${dataType}/dataPoints:dailyRollUp`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: civilDayRange(date),
        windowSizeDays: 1,
      }),
      cache: 'no-store',
    }
  );
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as Record<string, unknown> | null;
}

function firstRollup(
  json: Record<string, unknown> | null
): Record<string, unknown> | null {
  const rows = json?.rollupDataPoints;
  if (!Array.isArray(rows) || !rows.length) return null;
  return rows[0] as Record<string, unknown>;
}

function numField(obj: unknown, ...keys: string[]): number | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (v == null) continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Fitbit / Pixel Watch metrics through Google Health API v4.
 * @see https://developers.google.com/health/endpoints
 */
async function fetchFitbitViaGoogleHealth(
  token: string,
  date: string
): Promise<OAuthMetricsMap> {
  const metrics: OAuthMetricsMap = {};

  // Identity (optional — useful for logging)
  try {
    await authGet('https://health.googleapis.com/v4/users/me/identity', token);
  } catch {
    /* non-fatal */
  }

  // Steps (daily sum)
  try {
    const stepsJson = await googleHealthDailyRollUp(token, 'steps', date);
    const row = firstRollup(stepsJson);
    const steps = numField(row?.steps, 'countSum', 'count');
    if (steps != null) metrics.steps = Math.round(steps);
  } catch {
    /* partial */
  }

  // Distance (km)
  try {
    const distJson = await googleHealthDailyRollUp(token, 'distance', date);
    const row = firstRollup(distJson);
    // Prefer km; some payloads use meters
    const km = numField(row?.distance, 'kilometersSum', 'kilometers');
    const m = numField(row?.distance, 'metersSum', 'meters');
    if (km != null) metrics.distance_km = Math.round(km * 100) / 100;
    else if (m != null) metrics.distance_km = Math.round((m / 1000) * 100) / 100;
  } catch {
    /* partial */
  }

  // Active minutes
  try {
    const actJson = await googleHealthDailyRollUp(token, 'active-minutes', date);
    const row = firstRollup(actJson);
    const mins = numField(
      row?.activeMinutes ?? row?.active_minutes,
      'minutesSum',
      'minutes',
      'countSum'
    );
    if (mins != null) metrics.active_minutes = Math.round(mins);
  } catch {
    /* partial */
  }

  // Calories
  try {
    const calJson = await googleHealthDailyRollUp(token, 'total-calories', date);
    const row = firstRollup(calJson);
    const kcal = numField(
      row?.totalCalories ?? row?.calories ?? row?.total_calories,
      'kcalSum',
      'kcal',
      'caloriesSum'
    );
    if (kcal != null) metrics.calories = Math.round(kcal);
  } catch {
    /* partial */
  }

  // Resting HR
  try {
    const rhrJson = await googleHealthDailyRollUp(
      token,
      'resting-heart-rate',
      date
    );
    const row = firstRollup(rhrJson);
    const bpm = numField(
      row?.restingHeartRate ?? row?.resting_heart_rate,
      'bpmAverage',
      'bpm',
      'beatsPerMinute'
    );
    if (bpm != null) metrics.resting_hr = Math.round(bpm);
  } catch {
    /* partial */
  }

  // SpO2
  try {
    const spo2Json = await googleHealthDailyRollUp(
      token,
      'oxygen-saturation',
      date
    );
    const row = firstRollup(spo2Json);
    const pct = numField(
      row?.oxygenSaturation ?? row?.oxygen_saturation,
      'percentageAverage',
      'percentage',
      'avg'
    );
    if (pct != null) metrics.spo2 = Math.round(pct * 10) / 10;
  } catch {
    /* partial */
  }

  // Sleep (reconciled wearable stream for the civil day)
  try {
    const filter = encodeURIComponent(
      `sleep.interval.civil_end_time >= "${date}T00:00:00"`
    );
    const url =
      `https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints:reconcile` +
      `?dataSourceFamily=${encodeURIComponent('users/me/dataSourceFamilies/google-wearables')}` +
      `&filter=${filter}`;
    const sleepJson = (await authGet(url, token)) as {
      dataPoints?: Array<{
        sleep?: {
          interval?: { startTime?: string; endTime?: string };
          summary?: { minutesAsleep?: string | number };
        };
      }>;
    };
    const main = sleepJson.dataPoints?.[0]?.sleep;
    if (main?.summary?.minutesAsleep != null) {
      const mins = Number(main.summary.minutesAsleep);
      if (Number.isFinite(mins)) {
        metrics.sleep_hours = Math.round((mins / 60) * 10) / 10;
      }
    }
    if (main?.interval?.startTime) {
      metrics.sleep_bed = main.interval.startTime.slice(11, 16);
    }
    if (main?.interval?.endTime) {
      metrics.sleep_wake = main.interval.endTime.slice(11, 16);
    }
  } catch {
    /* partial */
  }

  return metrics;
}

// ─── Oura ──────────────────────────────────────────────────────

async function fetchOura(token: string, date: string): Promise<OAuthMetricsMap> {
  const metrics: OAuthMetricsMap = {};
  const q = `start_date=${date}&end_date=${date}`;

  try {
    const activity = (await authGet(
      `https://api.ouraring.com/v2/usercollection/daily_activity?${q}`,
      token
    )) as {
      data?: Array<{
        steps?: number;
        active_calories?: number;
        total_calories?: number;
        equivalent_walking_distance?: number;
        high_activity_time?: number;
        medium_activity_time?: number;
      }>;
    };
    const a = activity.data?.[0];
    if (a?.steps != null) metrics.steps = a.steps;
    if (a?.total_calories != null) metrics.calories = a.total_calories;
    const activeSec = (a?.high_activity_time || 0) + (a?.medium_activity_time || 0);
    if (activeSec) metrics.active_minutes = Math.round(activeSec / 60);
    if (a?.equivalent_walking_distance != null) {
      metrics.distance_km = Math.round((a.equivalent_walking_distance / 1000) * 100) / 100;
    }
  } catch {
    /* partial */
  }

  try {
    const sleep = (await authGet(
      `https://api.ouraring.com/v2/usercollection/daily_sleep?${q}`,
      token
    )) as {
      data?: Array<{
        contributors?: { deep_sleep?: number };
        score?: number;
      }>;
    };
    // daily_sleep is a score; get detailed sleep for duration
    const detailed = (await authGet(
      `https://api.ouraring.com/v2/usercollection/sleep?${q}`,
      token
    )) as {
      data?: Array<{
        total_sleep_duration?: number;
        bedtime_start?: string;
        bedtime_end?: string;
        average_hrv?: number;
        average_heart_rate?: number;
        lowest_heart_rate?: number;
      }>;
    };
    const s = detailed.data?.[0];
    if (s?.total_sleep_duration != null) {
      metrics.sleep_hours = Math.round((s.total_sleep_duration / 3600) * 10) / 10;
    }
    if (s?.bedtime_start) metrics.sleep_bed = s.bedtime_start.slice(11, 16);
    if (s?.bedtime_end) metrics.sleep_wake = s.bedtime_end.slice(11, 16);
    if (s?.average_hrv != null) metrics.hrv = s.average_hrv;
    if (s?.average_heart_rate != null) metrics.heart_rate = s.average_heart_rate;
    if (s?.lowest_heart_rate != null) metrics.resting_hr = s.lowest_heart_rate;
    void sleep;
  } catch {
    /* partial */
  }

  try {
    const readiness = (await authGet(
      `https://api.ouraring.com/v2/usercollection/daily_readiness?${q}`,
      token
    )) as { data?: Array<{ score?: number }> };
    const score = readiness.data?.[0]?.score;
    if (score != null) metrics.readiness = score;
  } catch {
    /* partial */
  }

  try {
    const spo2 = (await authGet(
      `https://api.ouraring.com/v2/usercollection/daily_spo2?${q}`,
      token
    )) as { data?: Array<{ spo2_percentage?: { average?: number } }> };
    const avg = spo2.data?.[0]?.spo2_percentage?.average;
    if (avg != null) metrics.spo2 = avg;
  } catch {
    /* optional */
  }

  return metrics;
}

// ─── WHOOP ─────────────────────────────────────────────────────

async function fetchWhoop(token: string, date: string): Promise<OAuthMetricsMap> {
  const metrics: OAuthMetricsMap = {};
  // WHOOP uses time ranges
  const start = `${date}T00:00:00.000Z`;
  const endDate = new Date(`${date}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const end = endDate.toISOString();

  try {
    const recovery = (await authGet(
      `https://api.prod.whoop.com/developer/v1/recovery?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=5`,
      token
    )) as {
      records?: Array<{
        score?: {
          recovery_score?: number;
          resting_heart_rate?: number;
          hrv_rmssd_milli?: number;
          spo2_percentage?: number;
        };
      }>;
    };
    const r = recovery.records?.[0]?.score;
    if (r?.recovery_score != null) metrics.readiness = r.recovery_score;
    if (r?.resting_heart_rate != null) metrics.resting_hr = r.resting_heart_rate;
    if (r?.hrv_rmssd_milli != null) metrics.hrv = Math.round(r.hrv_rmssd_milli);
    if (r?.spo2_percentage != null) metrics.spo2 = r.spo2_percentage;
  } catch {
    /* partial */
  }

  try {
    const sleep = (await authGet(
      `https://api.prod.whoop.com/developer/v1/activity/sleep?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=5`,
      token
    )) as {
      records?: Array<{
        start?: string;
        end?: string;
        score?: { stage_summary?: { total_in_bed_time_milli?: number; total_slow_wave_sleep_time_milli?: number; total_rem_sleep_time_milli?: number; total_light_sleep_time_milli?: number } };
      }>;
    };
    const s = sleep.records?.[0];
    if (s?.start) metrics.sleep_bed = s.start.slice(11, 16);
    if (s?.end) metrics.sleep_wake = s.end.slice(11, 16);
    const stages = s?.score?.stage_summary;
    if (stages) {
      const totalMs =
        (stages.total_slow_wave_sleep_time_milli || 0) +
        (stages.total_rem_sleep_time_milli || 0) +
        (stages.total_light_sleep_time_milli || 0);
      if (totalMs > 0) metrics.sleep_hours = Math.round((totalMs / 3600000) * 10) / 10;
    }
  } catch {
    /* partial */
  }

  try {
    const workout = (await authGet(
      `https://api.prod.whoop.com/developer/v1/activity/workout?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=10`,
      token
    )) as {
      records?: Array<{
        score?: {
          strain?: number;
          kilojoule?: number;
          average_heart_rate?: number;
          distance_meter?: number;
        };
        start?: string;
        end?: string;
      }>;
    };
    let activeMin = 0;
    let calories = 0;
    let dist = 0;
    let hrSum = 0;
    let hrN = 0;
    for (const w of workout.records || []) {
      if (w.start && w.end) {
        activeMin += Math.max(
          0,
          (new Date(w.end).getTime() - new Date(w.start).getTime()) / 60000
        );
      }
      if (w.score?.kilojoule) calories += w.score.kilojoule / 4.184;
      if (w.score?.distance_meter) dist += w.score.distance_meter;
      if (w.score?.average_heart_rate) {
        hrSum += w.score.average_heart_rate;
        hrN += 1;
      }
    }
    if (activeMin) metrics.active_minutes = Math.round(activeMin);
    if (calories) metrics.calories = Math.round(calories);
    if (dist) metrics.distance_km = Math.round((dist / 1000) * 100) / 100;
    if (hrN) metrics.heart_rate = Math.round(hrSum / hrN);
  } catch {
    /* partial */
  }

  return metrics;
}

// ─── Garmin ────────────────────────────────────────────────────
// Garmin Wellness API requires approved developer access.
// Endpoints vary by program; we hit well-known aggregate paths when available.

async function fetchGarmin(token: string, date: string): Promise<OAuthMetricsMap> {
  const metrics: OAuthMetricsMap = {};
  // Try wellness daily summary (Connect API style)
  const urls = [
    `https://apis.garmin.com/wellness-api/rest/dailies?uploadStartTimeInSeconds=${Math.floor(new Date(date + 'T00:00:00Z').getTime() / 1000)}&uploadEndTimeInSeconds=${Math.floor(new Date(date + 'T23:59:59Z').getTime() / 1000)}`,
    `https://apis.garmin.com/wellness-api/rest/user/dailies?from=${date}&until=${date}`,
  ];

  for (const url of urls) {
    try {
      const data = (await authGet(url, token)) as unknown;
      const rows = Array.isArray(data)
        ? data
        : (data as { dailies?: unknown[] })?.dailies || [];
      const day = (rows as Array<Record<string, unknown>>)[0];
      if (!day) continue;
      if (day.steps != null) metrics.steps = Number(day.steps);
      if (day.activeTimeInSeconds != null) {
        metrics.active_minutes = Math.round(Number(day.activeTimeInSeconds) / 60);
      }
      if (day.activeKilocalories != null) metrics.calories = Number(day.activeKilocalories);
      if (day.distanceInMeters != null) {
        metrics.distance_km = Math.round((Number(day.distanceInMeters) / 1000) * 100) / 100;
      }
      if (day.restingHeartRateInBeatsPerMinute != null) {
        metrics.resting_hr = Number(day.restingHeartRateInBeatsPerMinute);
      }
      if (day.averageHeartRateInBeatsPerMinute != null) {
        metrics.heart_rate = Number(day.averageHeartRateInBeatsPerMinute);
      }
      if (Object.keys(metrics).length) break;
    } catch {
      continue;
    }
  }

  // Sleep
  try {
    const sleepUrl = `https://apis.garmin.com/wellness-api/rest/sleeps?uploadStartTimeInSeconds=${Math.floor(new Date(date + 'T00:00:00Z').getTime() / 1000)}&uploadEndTimeInSeconds=${Math.floor(new Date(date + 'T23:59:59Z').getTime() / 1000)}`;
    const sleep = (await authGet(sleepUrl, token)) as unknown;
    const rows = Array.isArray(sleep) ? sleep : [];
    const s = rows[0] as Record<string, unknown> | undefined;
    if (s?.durationInSeconds != null) {
      metrics.sleep_hours = Math.round((Number(s.durationInSeconds) / 3600) * 10) / 10;
    }
  } catch {
    /* optional */
  }

  if (!Object.keys(metrics).length) {
    throw new Error(
      'Garmin API returned no dailies. Confirm developer approval and redirect URI.'
    );
  }
  return metrics;
}

export async function fetchProviderMetrics(
  provider: OAuthProviderId,
  date = todayISO()
): Promise<OAuthMetricsMap> {
  const token = await getValidAccessToken(provider);
  if (!token) throw new Error('NOT_CONNECTED');

  switch (provider) {
    case 'fitbit':
      return fetchFitbitViaGoogleHealth(token, date);
    case 'oura':
      return fetchOura(token, date);
    case 'whoop':
      return fetchWhoop(token, date);
    case 'garmin':
      return fetchGarmin(token, date);
    default:
      throw new Error('UNKNOWN_PROVIDER');
  }
}
