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

// ─── Fitbit ────────────────────────────────────────────────────

async function fetchFitbit(token: string, date: string): Promise<OAuthMetricsMap> {
  const metrics: OAuthMetricsMap = {};

  try {
    const activity = (await authGet(
      `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
      token
    )) as {
      summary?: {
        steps?: number;
        fairlyActiveMinutes?: number;
        veryActiveMinutes?: number;
        caloriesOut?: number;
        distances?: Array<{ activity: string; distance: number }>;
      };
    };
    const s = activity.summary;
    if (s?.steps != null) metrics.steps = s.steps;
    const active =
      (s?.fairlyActiveMinutes || 0) + (s?.veryActiveMinutes || 0);
    if (active) metrics.active_minutes = active;
    if (s?.caloriesOut != null) metrics.calories = s.caloriesOut;
    const totalDist = s?.distances?.find((d) => d.activity === 'total')?.distance;
    if (totalDist != null) metrics.distance_km = totalDist;
  } catch {
    /* partial ok */
  }

  try {
    const sleep = (await authGet(
      `https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`,
      token
    )) as {
      summary?: { totalMinutesAsleep?: number };
      sleep?: Array<{ startTime?: string; endTime?: string }>;
    };
    const mins = sleep.summary?.totalMinutesAsleep;
    if (mins != null) metrics.sleep_hours = Math.round((mins / 60) * 10) / 10;
    const main = sleep.sleep?.[0];
    if (main?.startTime) metrics.sleep_bed = main.startTime.slice(11, 16);
    if (main?.endTime) metrics.sleep_wake = main.endTime.slice(11, 16);
  } catch {
    /* partial */
  }

  try {
    const hr = (await authGet(
      `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d.json`,
      token
    )) as {
      'activities-heart'?: Array<{
        value?: { restingHeartRate?: number };
      }>;
    };
    const rhr = hr['activities-heart']?.[0]?.value?.restingHeartRate;
    if (rhr != null) metrics.resting_hr = rhr;
  } catch {
    /* partial */
  }

  try {
    const spo2 = (await authGet(
      `https://api.fitbit.com/1/user/-/spo2/date/${date}.json`,
      token
    )) as { value?: { avg?: number } };
    if (spo2.value?.avg != null) metrics.spo2 = spo2.value.avg;
  } catch {
    /* optional scope */
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
      return fetchFitbit(token, date);
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
