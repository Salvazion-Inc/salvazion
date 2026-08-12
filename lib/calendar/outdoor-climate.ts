/**
 * Natural light + weather for outdoor / circadian planning (Calendar).
 * Uses Open-Meteo (no API key) + browser geolocation (user timezone via local Date).
 */

export type GeoCoords = {
  lat: number;
  lon: number;
  label?: string;
  source: 'geo' | 'cached' | 'fallback';
};

export type OutdoorSnapshot = {
  coords: GeoCoords;
  fetchedAt: string;
  timezone: string;
  current: {
    tempC: number;
    humidity: number;
    cloudCover: number;
    windKmh: number;
    weatherCode: number;
    isDay: boolean;
    precipMm: number;
  };
  daily: {
    date: string;
    sunrise: string; // ISO
    sunset: string;
    daylightSeconds: number;
    uvMax: number;
    precipSum: number;
  };
  /** Next hours useful for outdoor windows (local) */
  hourly: Array<{
    time: string; // ISO
    tempC: number;
    precipMm: number;
    cloudCover: number;
    weatherCode: number;
    isDay: boolean;
  }>;
};

export type OutdoorActionKind =
  | 'outdoor'
  | 'exercise'
  | 'sport'
  | 'circadian_morning'
  | 'circadian_evening';

export type OutdoorWindow = {
  kind: OutdoorActionKind;
  /** Local HH:MM */
  start: string;
  end: string;
  score: number; // 0–100
  reasonKey: string;
};

export type OutdoorAdvice = {
  outdoorScore: number; // 0–100 overall outdoor suitability now
  uvLevel: 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
  conditionKey: string;
  windows: OutdoorWindow[];
  tips: string[]; // tip keys under outdoorClimate.tips.*
};

const STORAGE_COORDS = 'salvazion_outdoor_coords';
const STORAGE_CACHE = 'salvazion_outdoor_climate_cache';
const CACHE_TTL_MS = 25 * 60 * 1000;

/** Default: Santiago, Chile (app roots) if geolocation denied */
const FALLBACK_COORDS: GeoCoords = {
  lat: -33.4489,
  lon: -70.6693,
  label: 'Santiago',
  source: 'fallback',
};

export function weatherCodeKey(code: number): string {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 95) return 'storm';
  return 'partly';
}

export function uvLevelFromMax(uv: number): OutdoorAdvice['uvLevel'] {
  if (uv < 3) return 'low';
  if (uv < 6) return 'moderate';
  if (uv < 8) return 'high';
  if (uv < 11) return 'very_high';
  return 'extreme';
}

function loadCachedCoords(): GeoCoords | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_COORDS);
    if (!raw) return null;
    const p = JSON.parse(raw) as GeoCoords;
    if (typeof p.lat === 'number' && typeof p.lon === 'number') {
      return { ...p, source: 'cached' };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveCoords(c: GeoCoords) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_COORDS,
      JSON.stringify({ lat: c.lat, lon: c.lon, label: c.label })
    );
  } catch {
    /* ignore */
  }
}

type CacheBlob = { at: number; data: OutdoorSnapshot };

function loadCache(lat: number, lon: number): OutdoorSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_CACHE);
    if (!raw) return null;
    const blob = JSON.parse(raw) as CacheBlob;
    if (Date.now() - blob.at > CACHE_TTL_MS) return null;
    const d = blob.data;
    if (
      Math.abs(d.coords.lat - lat) < 0.05 &&
      Math.abs(d.coords.lon - lon) < 0.05
    ) {
      return d;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveCache(data: OutdoorSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    const blob: CacheBlob = { at: Date.now(), data };
    localStorage.setItem(STORAGE_CACHE, JSON.stringify(blob));
  } catch {
    /* ignore */
  }
}

export function requestUserCoords(): Promise<GeoCoords> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const cached = loadCachedCoords();
      resolve(cached || FALLBACK_COORDS);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: GeoCoords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: 'geo',
        };
        saveCoords(c);
        resolve(c);
      },
      () => {
        const cached = loadCachedCoords();
        resolve(cached || FALLBACK_COORDS);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 30 * 60_000 }
    );
  });
}

function parseIsoLocalParts(iso: string): { date: string; hm: string } {
  // Open-Meteo returns "2024-01-15T07:12" (local, no Z) when timezone=auto
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (m) return { date: m[1], hm: m[2] };
  try {
    const d = new Date(iso);
    return {
      date: d.toISOString().slice(0, 10),
      hm: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    };
  } catch {
    return { date: '', hm: '--:--' };
  }
}

export function formatHmFromIso(iso: string): string {
  return parseIsoLocalParts(iso).hm;
}

export function daylightLabel(seconds: number, lang: 'es' | 'en' | 'pt' = 'es'): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (lang === 'en') return `${h}h ${m}m`;
  return `${h} h ${m} min`;
}

/** Minutes of natural light remaining today (local), or 0 if night. */
export function daylightRemainingMinutes(
  snapshot: OutdoorSnapshot,
  now: Date = new Date()
): number {
  const sunset = new Date(snapshot.daily.sunset);
  const sunrise = new Date(snapshot.daily.sunrise);
  if (Number.isNaN(sunset.getTime()) || Number.isNaN(sunrise.getTime())) return 0;
  // Open-Meteo local strings without Z parse as local in modern browsers
  if (now < sunrise) {
    return Math.max(0, Math.round((sunset.getTime() - sunrise.getTime()) / 60_000));
  }
  if (now >= sunset) return 0;
  return Math.max(0, Math.round((sunset.getTime() - now.getTime()) / 60_000));
}

export function isNaturalLightNow(
  snapshot: OutdoorSnapshot,
  now: Date = new Date()
): boolean {
  const sunrise = new Date(snapshot.daily.sunrise);
  const sunset = new Date(snapshot.daily.sunset);
  if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime())) {
    return snapshot.current.isDay;
  }
  return now >= sunrise && now < sunset;
}

function addMinutesHm(hm: string, delta: number): string {
  const [h, m] = hm.split(':').map((n) => parseInt(n, 10));
  let total = h * 60 + m + delta;
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function scoreHourlySlot(
  tempC: number,
  precipMm: number,
  cloudCover: number,
  weatherCode: number,
  isDay: boolean
): number {
  if (!isDay) return 15;
  let score = 78;
  if (precipMm > 0.2) score -= 35;
  if (precipMm > 2) score -= 25;
  if (weatherCode >= 95) score -= 40;
  if (weatherCode >= 80 && weatherCode < 95) score -= 20;
  if (tempC < 5 || tempC > 34) score -= 28;
  else if (tempC < 10 || tempC > 30) score -= 12;
  else if (tempC >= 14 && tempC <= 26) score += 10;
  // Some cloud is fine; full overcast slightly lower for "natural light"
  if (cloudCover > 85) score -= 12;
  else if (cloudCover < 40) score += 6;
  return Math.max(0, Math.min(100, score));
}

export function buildOutdoorAdvice(
  snapshot: OutdoorSnapshot,
  now: Date = new Date()
): OutdoorAdvice {
  const c = snapshot.current;
  const uv = snapshot.daily.uvMax;
  const uvLevel = uvLevelFromMax(uv);
  const conditionKey = weatherCodeKey(c.weatherCode);

  let outdoorScore = scoreHourlySlot(
    c.tempC,
    c.precipMm,
    c.cloudCover,
    c.weatherCode,
    c.isDay || isNaturalLightNow(snapshot, now)
  );
  if (uvLevel === 'very_high' || uvLevel === 'extreme') outdoorScore -= 10;
  outdoorScore = Math.max(0, Math.min(100, outdoorScore));

  const sunriseHm = formatHmFromIso(snapshot.daily.sunrise);
  const sunsetHm = formatHmFromIso(snapshot.daily.sunset);

  // Circadian morning: first ~90 min after sunrise (bright outdoor light)
  const morningStart = sunriseHm;
  const morningEnd = addMinutesHm(sunriseHm, 90);

  // Circadian evening: wind-down ~90 min before sunset (dim outdoor optional, avoid bright late)
  const eveningStart = addMinutesHm(sunsetHm, -90);
  const eveningEnd = sunsetHm;

  // Best outdoor / exercise windows from hourly scores (daylight only)
  const ranked = snapshot.hourly
    .map((h) => {
      const hm = formatHmFromIso(h.time);
      const score = scoreHourlySlot(
        h.tempC,
        h.precipMm,
        h.cloudCover,
        h.weatherCode,
        h.isDay
      );
      return { hm, score, isDay: h.isDay };
    })
    .filter((h) => h.isDay)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second =
    ranked.find((h) => Math.abs(timeDiffMin(h.hm, best?.hm || '12:00')) >= 90) ||
    ranked[1];
  const outdoorStart = best?.hm || addMinutesHm(sunriseHm, 120);
  const exerciseStart = second?.hm || best?.hm || addMinutesHm(sunriseHm, 180);

  const windows: OutdoorWindow[] = [
    {
      kind: 'circadian_morning',
      start: morningStart,
      end: morningEnd,
      score: Math.min(100, outdoorScore + 12),
      reasonKey: 'morningLight',
    },
    {
      kind: 'outdoor',
      start: outdoorStart,
      end: addMinutesHm(outdoorStart, 60),
      score: best?.score ?? outdoorScore,
      reasonKey: 'bestOutdoor',
    },
    {
      kind: 'exercise',
      start: exerciseStart,
      end: addMinutesHm(exerciseStart, 60),
      score: second?.score ?? best?.score ?? outdoorScore,
      reasonKey: 'exerciseWindow',
    },
    {
      kind: 'sport',
      start: exerciseStart,
      end: addMinutesHm(exerciseStart, 90),
      score: Math.max(
        0,
        (second?.score ?? outdoorScore) - (uvLevel === 'extreme' ? 15 : 0)
      ),
      reasonKey: 'sportWindow',
    },
    {
      kind: 'circadian_evening',
      start: eveningStart,
      end: eveningEnd,
      score: 70,
      reasonKey: 'eveningDim',
    },
  ];

  const tips: string[] = [];
  if (!isNaturalLightNow(snapshot, now)) {
    tips.push('nightMode');
  } else if (c.cloudCover < 40 && c.precipMm < 0.1) {
    tips.push('goodLight');
  } else if (c.cloudCover >= 70) {
    tips.push('cloudyLight');
  }
  if (c.precipMm >= 0.5 || conditionKey === 'rain' || conditionKey === 'showers') {
    tips.push('rainIndoor');
  }
  if (uvLevel === 'high' || uvLevel === 'very_high' || uvLevel === 'extreme') {
    tips.push('uvProtect');
  }
  if (c.tempC >= 30) tips.push('heatCaution');
  if (c.tempC <= 8) tips.push('coldCaution');
  if (c.windKmh >= 35) tips.push('windy');
  tips.push('circadianCore');
  if (tips.length < 3) tips.push('outdoorScoreTip');

  return {
    outdoorScore,
    uvLevel,
    conditionKey,
    windows,
    tips: tips.slice(0, 4),
  };
}

function timeDiffMin(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return ah * 60 + am - (bh * 60 + bm);
}

type OpenMeteoResponse = {
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    cloud_cover?: number;
    wind_speed_10m?: number;
    is_day?: number;
    precipitation?: number;
  };
  daily?: {
    time?: string[];
    sunrise?: string[];
    sunset?: string[];
    daylight_duration?: number[];
    uv_index_max?: number[];
    precipitation_sum?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation?: number[];
    cloud_cover?: number[];
    weather_code?: number[];
    is_day?: number[];
  };
};

export async function fetchOutdoorSnapshot(
  coords?: GeoCoords
): Promise<OutdoorSnapshot> {
  const c = coords || (await requestUserCoords());
  const cached = loadCache(c.lat, c.lon);
  if (cached) return { ...cached, coords: { ...cached.coords, ...c } };

  const params = new URLSearchParams({
    latitude: String(c.lat),
    longitude: String(c.lon),
    timezone: 'auto',
    forecast_days: '1',
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'is_day',
      'precipitation',
    ].join(','),
    daily: [
      'sunrise',
      'sunset',
      'daylight_duration',
      'uv_index_max',
      'precipitation_sum',
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation',
      'cloud_cover',
      'weather_code',
      'is_day',
    ].join(','),
    wind_speed_unit: 'kmh',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const json = (await res.json()) as OpenMeteoResponse;

  const cur = json.current || {};
  const dailyIdx = 0;
  const hourly: OutdoorSnapshot['hourly'] = [];
  const times = json.hourly?.time || [];
  for (let i = 0; i < times.length; i++) {
    hourly.push({
      time: times[i],
      tempC: json.hourly?.temperature_2m?.[i] ?? 0,
      precipMm: json.hourly?.precipitation?.[i] ?? 0,
      cloudCover: json.hourly?.cloud_cover?.[i] ?? 0,
      weatherCode: json.hourly?.weather_code?.[i] ?? 0,
      isDay: (json.hourly?.is_day?.[i] ?? 0) === 1,
    });
  }

  // Prefer remaining local hours today (Open-Meteo times are local when timezone=auto)
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const localStamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}`;
  const relevantHourly = hourly
    .filter((h) => h.time >= localStamp)
    .slice(0, 18);

  const snapshot: OutdoorSnapshot = {
    coords: c,
    fetchedAt: new Date().toISOString(),
    timezone: json.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    current: {
      tempC: cur.temperature_2m ?? 0,
      humidity: cur.relative_humidity_2m ?? 0,
      cloudCover: cur.cloud_cover ?? 0,
      windKmh: cur.wind_speed_10m ?? 0,
      weatherCode: cur.weather_code ?? 0,
      isDay: (cur.is_day ?? 1) === 1,
      precipMm: cur.precipitation ?? 0,
    },
    daily: {
      date: json.daily?.time?.[dailyIdx] || localStamp.slice(0, 10),
      sunrise: json.daily?.sunrise?.[dailyIdx] || '',
      sunset: json.daily?.sunset?.[dailyIdx] || '',
      daylightSeconds: json.daily?.daylight_duration?.[dailyIdx] || 0,
      uvMax: json.daily?.uv_index_max?.[dailyIdx] || 0,
      precipSum: json.daily?.precipitation_sum?.[dailyIdx] || 0,
    },
    hourly: relevantHourly.length ? relevantHourly : hourly.slice(0, 24),
  };

  saveCache(snapshot);
  return snapshot;
}
