/**
 * Phone sensors (PWA): motion, steps, GPS outdoor, rest/sleep.
 * — DeviceMotion: steps + activity intensity
 * — Geolocation: outdoor distance / minutes
 * — Rest mode: sleep bed/wake proxies from phone timestamps
 *
 * Note: true OS HealthKit/Google Fit steps need a native shell later.
 * This layer uses browser APIs available on modern mobile browsers.
 */

export type SensorSessionKind = 'steps' | 'activity' | 'outdoor' | 'rest';

export type IntensityBand = 'still' | 'light' | 'moderate' | 'vigorous';

export interface SensorCapabilities {
  motion: boolean;
  motionPermission: 'unknown' | 'granted' | 'denied' | 'prompt';
  geolocation: boolean;
  ambientLight: boolean;
  isSecureContext: boolean;
}

export interface LiveSensorSession {
  id: string;
  kind: SensorSessionKind;
  startedAt: string;
  /** Live counters */
  steps: number;
  distanceMeters: number;
  activeSeconds: number;
  vigorousSeconds: number;
  moderateSeconds: number;
  samples: number;
  lastLat?: number;
  lastLng?: number;
  lastIntensity: IntensityBand;
  /** For rest mode */
  bedTime?: string; // HH:mm
}

export interface FinishedSensorSession {
  id: string;
  kind: SensorSessionKind;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  steps: number;
  distanceMeters: number;
  activeMinutes: number;
  vigorousMinutes: number;
  moderateMinutes: number;
  bedTime?: string;
  wakeTime?: string;
  source: 'phone';
}

export interface DaySensorIndicators {
  date: string;
  steps: number;
  activeMinutes: number;
  vigorousMinutes: number;
  distanceMeters: number;
  outdoorMinutes: number;
  restBedTime?: string;
  restWakeTime?: string;
  restDurationMin?: number;
  sessions: FinishedSensorSession[];
  /** Scoring action types already auto-logged today from sensors */
  autoLogged: string[];
  updatedAt: string;
}

const STORAGE_DAY = 'salvazion_sensor_day';
const STORAGE_REST = 'salvazion_sensor_rest_active';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function hhmm(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ─── Capabilities ──────────────────────────────────────────────

export function detectSensorCapabilities(): SensorCapabilities {
  if (typeof window === 'undefined') {
    return {
      motion: false,
      motionPermission: 'unknown',
      geolocation: false,
      ambientLight: false,
      isSecureContext: false,
    };
  }
  const motion =
    typeof DeviceMotionEvent !== 'undefined' ||
    typeof DeviceOrientationEvent !== 'undefined';
  return {
    motion,
    motionPermission: 'unknown',
    geolocation: 'geolocation' in navigator,
    ambientLight: 'AmbientLightSensor' in window || 'ondevicelight' in window,
    isSecureContext: window.isSecureContext,
  };
}

/** iOS 13+ requires explicit permission for DeviceMotion */
export async function requestMotionPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof window === 'undefined') return 'unsupported';
  const AnyMotion = DeviceMotionEvent as unknown as {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  if (typeof AnyMotion.requestPermission === 'function') {
    try {
      const res = await AnyMotion.requestPermission();
      return res === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }
  // Android / desktop: listening is enough
  return typeof DeviceMotionEvent !== 'undefined' ? 'granted' : 'unsupported';
}

export async function requestGeolocationPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported';
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (err) => resolve(err.code === err.PERMISSION_DENIED ? 'denied' : 'denied'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

// ─── Day storage ───────────────────────────────────────────────

export function emptyDayIndicators(date = today()): DaySensorIndicators {
  return {
    date,
    steps: 0,
    activeMinutes: 0,
    vigorousMinutes: 0,
    distanceMeters: 0,
    outdoorMinutes: 0,
    sessions: [],
    autoLogged: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadDayIndicators(date = today()): DaySensorIndicators {
  if (typeof window === 'undefined') return emptyDayIndicators(date);
  try {
    const raw = localStorage.getItem(STORAGE_DAY);
    if (!raw) return emptyDayIndicators(date);
    const data = JSON.parse(raw) as DaySensorIndicators;
    if (data.date !== date) return emptyDayIndicators(date);
    return data;
  } catch {
    return emptyDayIndicators(date);
  }
}

export function saveDayIndicators(day: DaySensorIndicators): void {
  if (typeof window === 'undefined') return;
  day.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_DAY, JSON.stringify(day));
}

export function markAutoLogged(actionType: string, date = today()): DaySensorIndicators {
  const day = loadDayIndicators(date);
  if (!day.autoLogged.includes(actionType)) {
    day.autoLogged.push(actionType);
    saveDayIndicators(day);
  }
  return day;
}

export function hasAutoLogged(actionType: string, date = today()): boolean {
  return loadDayIndicators(date).autoLogged.includes(actionType);
}

// ─── Rest mode persistence (can span overnight) ────────────────

export interface ActiveRestState {
  id: string;
  startedAt: string;
  bedTime: string;
}

export function loadActiveRest(): ActiveRestState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_REST);
    return raw ? (JSON.parse(raw) as ActiveRestState) : null;
  } catch {
    return null;
  }
}

export function startRestMode(): ActiveRestState {
  const state: ActiveRestState = {
    id: uid(),
    startedAt: new Date().toISOString(),
    bedTime: hhmm(),
  };
  localStorage.setItem(STORAGE_REST, JSON.stringify(state));
  return state;
}

export function endRestMode(): FinishedSensorSession | null {
  const active = loadActiveRest();
  if (!active) return null;
  localStorage.removeItem(STORAGE_REST);

  const start = new Date(active.startedAt);
  const end = new Date();
  const durationMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  const session: FinishedSensorSession = {
    id: active.id,
    kind: 'rest',
    startedAt: active.startedAt,
    endedAt: end.toISOString(),
    durationMin,
    steps: 0,
    distanceMeters: 0,
    activeMinutes: 0,
    vigorousMinutes: 0,
    moderateMinutes: 0,
    bedTime: active.bedTime,
    wakeTime: hhmm(end),
    source: 'phone',
  };
  mergeSessionIntoDay(session);
  return session;
}

// ─── Merge finished session into daily indicators ──────────────

export function mergeSessionIntoDay(session: FinishedSensorSession): DaySensorIndicators {
  const day = loadDayIndicators();
  day.sessions = [...day.sessions.filter((s) => s.id !== session.id), session];

  if (session.kind === 'steps' || session.kind === 'activity') {
    day.steps += session.steps;
    day.activeMinutes += session.activeMinutes;
    day.vigorousMinutes += session.vigorousMinutes;
  }
  if (session.kind === 'outdoor') {
    day.steps += session.steps;
    day.distanceMeters += session.distanceMeters;
    day.outdoorMinutes += session.durationMin;
    day.activeMinutes += session.activeMinutes;
  }
  if (session.kind === 'rest') {
    day.restBedTime = session.bedTime;
    day.restWakeTime = session.wakeTime;
    day.restDurationMin = session.durationMin;
  }

  saveDayIndicators(day);
  return day;
}

// ─── Thresholds for auto-scoring ───────────────────────────────

export interface SensorScoreHints {
  canLogHit: boolean;
  canLogOutdoor: boolean;
  canLogSleep: boolean;
  reasonHit?: string;
  reasonOutdoor?: string;
  reasonSleep?: string;
}

export function evaluateSensorScoreHints(
  day: DaySensorIndicators,
  stageIdealSleep?: { min: number; max: number }
): SensorScoreHints {
  const hitMinutes = day.activeMinutes + day.vigorousMinutes * 0.5;
  const canLogHit = hitMinutes >= 15 || day.vigorousMinutes >= 10;
  const canLogOutdoor =
    day.outdoorMinutes >= 20 || (day.distanceMeters >= 1500 && day.outdoorMinutes >= 12);

  let canLogSleep = false;
  if (day.restDurationMin != null && day.restDurationMin >= 360) {
    const hours = day.restDurationMin / 60;
    const min = stageIdealSleep?.min ?? 7;
    const max = stageIdealSleep?.max ?? 9;
    canLogSleep = hours >= min - 0.5 && hours <= max + 1;
  }

  return {
    canLogHit,
    canLogOutdoor,
    canLogSleep,
    reasonHit: canLogHit
      ? `${Math.round(hitMinutes)} min activos / vigorosos`
      : `Faltan ~${Math.max(0, 15 - Math.round(hitMinutes))} min de actividad`,
    reasonOutdoor: canLogOutdoor
      ? `${day.outdoorMinutes} min exterior · ${(day.distanceMeters / 1000).toFixed(2)} km`
      : `Meta: 20 min exterior o ~1.5 km`,
    reasonSleep: canLogSleep
      ? `${((day.restDurationMin || 0) / 60).toFixed(1)} h de reposo (sensor)`
      : day.restDurationMin
        ? `Reposo ${((day.restDurationMin || 0) / 60).toFixed(1)} h — fuera de ventana ideal`
        : 'Activa modo sueño y cierra al despertar',
  };
}

// ─── Live tracker (class used by UI) ───────────────────────────

type Listener = (session: LiveSensorSession) => void;

export class PhoneSensorTracker {
  private session: LiveSensorSession | null = null;
  private listeners = new Set<Listener>();
  private motionHandler: ((e: DeviceMotionEvent) => void) | null = null;
  private watchId: number | null = null;
  private lastStepAt = 0;
  private lastMag = 9.8;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = 0;
  private intensityWindow: number[] = [];

  get current(): LiveSensorSession | null {
    return this.session;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    if (!this.session) return;
    for (const fn of this.listeners) fn({ ...this.session });
  }

  async start(kind: Exclude<SensorSessionKind, 'rest'>): Promise<LiveSensorSession> {
    if (this.session) await this.stop();

    if (kind === 'outdoor') {
      const geo = await requestGeolocationPermission();
      if (geo !== 'granted') {
        throw new Error('GPS_DENIED');
      }
    } else {
      const motion = await requestMotionPermission();
      if (motion === 'denied') {
        throw new Error('MOTION_DENIED');
      }
    }

    this.session = {
      id: uid(),
      kind,
      startedAt: new Date().toISOString(),
      steps: 0,
      distanceMeters: 0,
      activeSeconds: 0,
      vigorousSeconds: 0,
      moderateSeconds: 0,
      samples: 0,
      lastIntensity: 'still',
    };
    this.lastStepAt = 0;
    this.lastMag = 9.8;
    this.intensityWindow = [];
    this.lastTickAt = Date.now();

    if (kind === 'outdoor') {
      this.startGps();
      // also count steps if motion available
      this.startMotion(true);
    } else {
      this.startMotion(kind === 'activity');
    }

    this.tickTimer = setInterval(() => this.tickIntensity(), 1000);
    this.emit();
    return this.session;
  }

  private startMotion(trackIntensity: boolean) {
    this.motionHandler = (e: DeviceMotionEvent) => {
      if (!this.session) return;
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

      const mag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      this.session.samples += 1;

      // Simple peak-step detector
      const now = Date.now();
      const delta = Math.abs(mag - this.lastMag);
      this.lastMag = mag * 0.7 + this.lastMag * 0.3;

      // Dynamic threshold — phones rest ~9.8 m/s² with gravity
      if (delta > 1.6 && now - this.lastStepAt > 280) {
        this.session.steps += 1;
        this.lastStepAt = now;
      }

      if (trackIntensity) {
        this.intensityWindow.push(delta);
        if (this.intensityWindow.length > 25) this.intensityWindow.shift();
      }

      // Throttle UI emit
      if (this.session.samples % 8 === 0) this.emit();
    };
    window.addEventListener('devicemotion', this.motionHandler, { passive: true });
  }

  private tickIntensity() {
    if (!this.session) return;
    const now = Date.now();
    const elapsed = Math.min(2, (now - this.lastTickAt) / 1000);
    this.lastTickAt = now;

    const avg =
      this.intensityWindow.length > 0
        ? this.intensityWindow.reduce((a, b) => a + b, 0) / this.intensityWindow.length
        : 0;

    // Outdoor: treat movement by GPS/steps as active
    let band: IntensityBand = 'still';
    if (this.session.kind === 'outdoor') {
      if (this.session.steps > 0 || this.session.distanceMeters > 5) {
        band = avg > 2.2 ? 'vigorous' : avg > 1.0 ? 'moderate' : 'light';
      }
    } else {
      if (avg > 3.0) band = 'vigorous';
      else if (avg > 1.8) band = 'moderate';
      else if (avg > 0.7) band = 'light';
      else band = 'still';
    }

    this.session.lastIntensity = band;
    if (band === 'vigorous') {
      this.session.vigorousSeconds += elapsed;
      this.session.activeSeconds += elapsed;
    } else if (band === 'moderate') {
      this.session.moderateSeconds += elapsed;
      this.session.activeSeconds += elapsed;
    } else if (band === 'light') {
      this.session.activeSeconds += elapsed * 0.5;
    }
    this.emit();
  }

  private startGps() {
    if (!navigator.geolocation) return;
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!this.session) return;
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy != null && accuracy > 80) {
          // ignore very inaccurate points
          this.session.lastLat = latitude;
          this.session.lastLng = longitude;
          return;
        }
        if (this.session.lastLat != null && this.session.lastLng != null) {
          const d = haversineMeters(
            this.session.lastLat,
            this.session.lastLng,
            latitude,
            longitude
          );
          // Filter GPS jumps
          if (d > 0.5 && d < 45) {
            this.session.distanceMeters += d;
          }
        }
        this.session.lastLat = latitude;
        this.session.lastLng = longitude;
        this.emit();
      },
      () => {
        /* keep session without GPS updates */
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  }

  async stop(): Promise<FinishedSensorSession | null> {
    if (this.motionHandler) {
      window.removeEventListener('devicemotion', this.motionHandler);
      this.motionHandler = null;
    }
    if (this.watchId != null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }

    const live = this.session;
    this.session = null;
    if (!live) return null;

    const end = new Date();
    const durationMin = Math.max(
      1,
      Math.round((end.getTime() - new Date(live.startedAt).getTime()) / 60000)
    );

    const finished: FinishedSensorSession = {
      id: live.id,
      kind: live.kind,
      startedAt: live.startedAt,
      endedAt: end.toISOString(),
      durationMin,
      steps: live.steps,
      distanceMeters: Math.round(live.distanceMeters),
      activeMinutes: Math.round(live.activeSeconds / 60),
      vigorousMinutes: Math.round(live.vigorousSeconds / 60),
      moderateMinutes: Math.round(live.moderateSeconds / 60),
      source: 'phone',
    };

    mergeSessionIntoDay(finished);
    return finished;
  }
}

// Singleton for the app session
let trackerSingleton: PhoneSensorTracker | null = null;

export function getPhoneSensorTracker(): PhoneSensorTracker {
  if (!trackerSingleton) trackerSingleton = new PhoneSensorTracker();
  return trackerSingleton;
}

/** Human-readable summary for UI */
export function formatIndicators(day: DaySensorIndicators) {
  return {
    steps: day.steps,
    activeMinutes: day.activeMinutes,
    vigorousMinutes: day.vigorousMinutes,
    distanceKm: day.distanceMeters / 1000,
    outdoorMinutes: day.outdoorMinutes,
    restHours:
      day.restDurationMin != null ? Math.round((day.restDurationMin / 60) * 10) / 10 : null,
    restBedTime: day.restBedTime,
    restWakeTime: day.restWakeTime,
  };
}
