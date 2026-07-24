/**
 * Fase A — Biomarcadores básicos de Health
 * - Sueño circadiano (hora dormir / despertar + regularidad)
 * - Hidratación (meta diaria)
 */

export interface SleepEntry {
  date: string; // YYYY-MM-DD (día del despertar)
  bedTime: string; // HH:mm (noche anterior)
  wakeTime: string; // HH:mm
  durationMinutes: number;
  createdAt: string;
}

export interface HydrationEntry {
  date: string;
  glasses: number; // cada vaso ≈ 250 ml
  goal: number;
  updatedAt: string;
}

const STORAGE_SLEEP = 'salvazion_sleep_log';
const STORAGE_HYDRATION = 'salvazion_hydration_log';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Duración del sueño en minutos (soporta cruzar medianoche) */
export function calcSleepDuration(bedTime: string, wakeTime: string): number {
  let bed = parseTimeToMinutes(bedTime);
  let wake = parseTimeToMinutes(wakeTime);
  if (wake <= bed) wake += 24 * 60; // cruzó medianoche
  return wake - bed;
}

/** Meta de horas de sueño según etapa (aprox.) */
export function idealSleepHours(stage: string): { min: number; max: number } {
  switch (stage) {
    case 'infancia':
      return { min: 9, max: 12 };
    case 'juventud':
      return { min: 8, max: 10 };
    case 'senior':
      return { min: 7, max: 9 };
    default:
      return { min: 7, max: 9 };
  }
}

/** ¿El sueño de hoy está dentro de ventana ideal? */
export function isSleepIdeal(
  bedTime: string,
  wakeTime: string,
  stage: string
): boolean {
  const durationH = calcSleepDuration(bedTime, wakeTime) / 60;
  const { min, max } = idealSleepHours(stage);
  // También valoramos hora de acostarse razonable (antes de 00:30 aprox para adultos)
  const bedMins = parseTimeToMinutes(bedTime);
  const lateBed = stage === 'infancia' ? bedMins > 22 * 60 : bedMins > 0 * 60 + 30 && bedMins < 5 * 60;
  // Simplificado: duración en rango = ideal
  return durationH >= min && durationH <= max + 0.5;
}

// ─── Sleep storage ─────────────────────────────────────────────

export function loadSleepLog(): SleepEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SLEEP);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSleepEntry(bedTime: string, wakeTime: string): SleepEntry {
  const entry: SleepEntry = {
    date: today(),
    bedTime,
    wakeTime,
    durationMinutes: calcSleepDuration(bedTime, wakeTime),
    createdAt: new Date().toISOString()
  };
  const log = loadSleepLog().filter(e => e.date !== entry.date);
  log.push(entry);
  localStorage.setItem(STORAGE_SLEEP, JSON.stringify(log));
  return entry;
}

export function getTodaySleep(): SleepEntry | null {
  return loadSleepLog().find(e => e.date === today()) || null;
}

/** Regularidad: desviación promedio de hora de despertar en últimos N días (minutos) */
export function getSleepRegularity(days = 7): {
  samples: number;
  avgWakeMinutes: number | null;
  avgDeviationMinutes: number | null;
  score: number; // 0-100
} {
  const log = loadSleepLog()
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);

  if (log.length < 2) {
    return { samples: log.length, avgWakeMinutes: null, avgDeviationMinutes: null, score: log.length === 1 ? 50 : 0 };
  }

  const wakes = log.map(e => parseTimeToMinutes(e.wakeTime));
  const avg = wakes.reduce((a, b) => a + b, 0) / wakes.length;
  const deviation =
    wakes.reduce((sum, w) => sum + Math.abs(w - avg), 0) / wakes.length;

  // score: 0 desviación = 100; 90+ min desviación = 0
  const score = Math.max(0, Math.round(100 - (deviation / 90) * 100));

  return {
    samples: log.length,
    avgWakeMinutes: Math.round(avg),
    avgDeviationMinutes: Math.round(deviation),
    score
  };
}

// ─── Hydration storage ─────────────────────────────────────────

export function getHydrationGoal(stage: string): number {
  // vasos de ~250 ml
  switch (stage) {
    case 'infancia':
      return 5;
    case 'juventud':
      return 7;
    case 'senior':
      return 7;
    default:
      return 8;
  }
}

export function loadHydrationLog(): HydrationEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_HYDRATION);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getTodayHydration(stage: string): HydrationEntry {
  const log = loadHydrationLog();
  const existing = log.find(e => e.date === today());
  if (existing) return existing;
  return {
    date: today(),
    glasses: 0,
    goal: getHydrationGoal(stage),
    updatedAt: new Date().toISOString()
  };
}

export function setHydrationGlasses(glasses: number, stage: string): HydrationEntry {
  const goal = getHydrationGoal(stage);
  const entry: HydrationEntry = {
    date: today(),
    glasses: Math.max(0, Math.min(glasses, goal + 4)),
    goal,
    updatedAt: new Date().toISOString()
  };
  const log = loadHydrationLog().filter(e => e.date !== entry.date);
  log.push(entry);
  localStorage.setItem(STORAGE_HYDRATION, JSON.stringify(log));
  return entry;
}

export function isHydrationComplete(stage: string): boolean {
  const h = getTodayHydration(stage);
  return h.glasses >= h.goal;
}

// ─── Alimentación (Fase A+) ────────────────────────────────────

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLog {
  slot: MealSlot;
  time: string; // HH:mm
  quality: 'whole' | 'mixed' | 'processed'; // comida real vs ultraprocesada
  notes?: string;
  estimatedKcal?: number; // opcional, no obligatorio
}

export interface NutritionEntry {
  date: string;
  meals: MealLog[];
  firstMealTime: string | null;
  lastMealTime: string | null;
  eatingWindowHours: number | null;
  fastingHours: number | null; // desde última comida del día anterior o estimado
  updatedAt: string;
}

const STORAGE_NUTRITION = 'salvazion_nutrition_log';

export function loadNutritionLog(): NutritionEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_NUTRITION);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getTodayNutrition(): NutritionEntry {
  const log = loadNutritionLog();
  const existing = log.find(e => e.date === today());
  if (existing) return existing;
  return {
    date: today(),
    meals: [],
    firstMealTime: null,
    lastMealTime: null,
    eatingWindowHours: null,
    fastingHours: null,
    updatedAt: new Date().toISOString()
  };
}

function recalcNutrition(meals: MealLog[]): Omit<NutritionEntry, 'date' | 'updatedAt'> {
  if (meals.length === 0) {
    return {
      meals: [],
      firstMealTime: null,
      lastMealTime: null,
      eatingWindowHours: null,
      fastingHours: null
    };
  }
  const sorted = [...meals].sort(
    (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
  );
  const first = sorted[0].time;
  const last = sorted[sorted.length - 1].time;
  let window = parseTimeToMinutes(last) - parseTimeToMinutes(first);
  if (window < 0) window += 24 * 60;
  const eatingWindowHours = Math.round((window / 60) * 10) / 10;

  // Ayuno aproximado: 24h - ventana de comida (si hay al menos 2 comidas)
  const fastingHours =
    sorted.length >= 1 ? Math.round((24 - eatingWindowHours) * 10) / 10 : null;

  return {
    meals: sorted,
    firstMealTime: first,
    lastMealTime: last,
    eatingWindowHours,
    fastingHours
  };
}

export function addMeal(meal: MealLog): NutritionEntry {
  const current = getTodayNutrition();
  // Un slot principal se reemplaza; snacks se acumulan
  let meals = current.meals;
  if (meal.slot !== 'snack') {
    meals = meals.filter(m => m.slot !== meal.slot);
  }
  meals = [...meals, meal];
  const recalc = recalcNutrition(meals);
  const entry: NutritionEntry = {
    date: today(),
    ...recalc,
    updatedAt: new Date().toISOString()
  };
  const log = loadNutritionLog().filter(e => e.date !== entry.date);
  log.push(entry);
  localStorage.setItem(STORAGE_NUTRITION, JSON.stringify(log));
  return entry;
}

export function removeMeal(slot: MealSlot, time?: string): NutritionEntry {
  const current = getTodayNutrition();
  const meals =
    slot === 'snack' && time
      ? current.meals.filter(m => !(m.slot === 'snack' && m.time === time))
      : current.meals.filter(m => m.slot !== slot);
  const recalc = recalcNutrition(meals);
  const entry: NutritionEntry = {
    date: today(),
    ...recalc,
    updatedAt: new Date().toISOString()
  };
  const log = loadNutritionLog().filter(e => e.date !== entry.date);
  log.push(entry);
  localStorage.setItem(STORAGE_NUTRITION, JSON.stringify(log));
  return entry;
}

/** ¿Ventana de comida compatible con ayuno saludable? (ej. ≤ 10–12 h) */
export function isFastingWindowGood(entry: NutritionEntry, stage: string): boolean {
  if (stage === 'infancia' || stage === 'juventud') return false;
  if (!entry.eatingWindowHours || entry.meals.length < 2) return false;
  // Ventana de alimentación ≤ 12 h ⇒ ayuno nocturno ≥ 12 h
  return entry.eatingWindowHours <= 12;
}

export function totalEstimatedKcal(entry: NutritionEntry): number {
  return entry.meals.reduce((sum, m) => sum + (m.estimatedKcal || 0), 0);
}

export function qualitySummary(entry: NutritionEntry): {
  whole: number;
  mixed: number;
  processed: number;
} {
  return entry.meals.reduce(
    (acc, m) => {
      acc[m.quality] += 1;
      return acc;
    },
    { whole: 0, mixed: 0, processed: 0 }
  );
}

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack'
};
