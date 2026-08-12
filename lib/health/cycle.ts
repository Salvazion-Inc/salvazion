/**
 * Salud femenina — registro de ciclo menstrual (local-first).
 * Datos en dispositivo; exportables vía FHIR.
 */

export type FlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
export type CycleSymptom =
  | 'cramps'
  | 'headache'
  | 'fatigue'
  | 'bloating'
  | 'mood'
  | 'breast_tenderness'
  | 'back_pain'
  | 'acne'
  | 'nausea'
  | 'cravings';

export type CyclePhase =
  | 'menstrual'
  | 'follicular'
  | 'ovulatory'
  | 'luteal'
  | 'unknown';

export interface CycleDayLog {
  date: string; // YYYY-MM-DD
  flow: FlowLevel;
  symptoms: CycleSymptom[];
  notes?: string;
  /** Autocuidado registrado (hidratación extra, descanso, etc.) */
  selfCare?: string[];
  updatedAt: string;
}

export interface CycleSettings {
  /** Duración media del ciclo (días entre inicios) */
  avgCycleLength: number;
  /** Duración media del sangrado */
  avgPeriodLength: number;
  /** Último día 1 del ciclo (inicio de menstruación) YYYY-MM-DD */
  lastPeriodStart?: string;
  enabled: boolean;
  updatedAt: string;
}

export interface CycleSnapshot {
  settings: CycleSettings;
  phase: CyclePhase;
  dayInCycle: number | null;
  cycleLength: number;
  periodLength: number;
  nextPeriodEstimate: string | null;
  fertileWindowStart: string | null;
  fertileWindowEnd: string | null;
  ovulationEstimate: string | null;
  recentLogs: CycleDayLog[];
  tips: string[];
}

const STORAGE_LOGS = 'salvazion_cycle_logs';
const STORAGE_SETTINGS = 'salvazion_cycle_settings';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function diffDays(a: string, b: string): number {
  const ms = parseDate(b).getTime() - parseDate(a).getTime();
  return Math.round(ms / 86400000);
}

export function defaultCycleSettings(): CycleSettings {
  return {
    avgCycleLength: 28,
    avgPeriodLength: 5,
    enabled: true,
    updatedAt: new Date().toISOString(),
  };
}

export function loadCycleSettings(): CycleSettings {
  if (typeof window === 'undefined') return defaultCycleSettings();
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    if (!raw) return defaultCycleSettings();
    return { ...defaultCycleSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultCycleSettings();
  }
}

export function saveCycleSettings(patch: Partial<CycleSettings>): CycleSettings {
  const next: CycleSettings = {
    ...loadCycleSettings(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(next));
  return next;
}

export function loadCycleLogs(): CycleDayLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_LOGS);
    return raw ? (JSON.parse(raw) as CycleDayLog[]) : [];
  } catch {
    return [];
  }
}

export function upsertCycleDayLog(
  partial: Omit<CycleDayLog, 'updatedAt'> & { updatedAt?: string }
): CycleDayLog {
  const entry: CycleDayLog = {
    date: partial.date,
    flow: partial.flow,
    symptoms: partial.symptoms || [],
    notes: partial.notes,
    selfCare: partial.selfCare,
    updatedAt: new Date().toISOString(),
  };
  const logs = loadCycleLogs().filter((l) => l.date !== entry.date);
  logs.push(entry);
  logs.sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs.slice(0, 400)));

  // Si hay flujo (no none), tratar como posible día de periodo y actualizar lastPeriodStart
  if (entry.flow !== 'none' && entry.flow !== 'spotting') {
    const settings = loadCycleSettings();
    const last = settings.lastPeriodStart;
    if (!last || diffDays(last, entry.date) >= 14 || entry.date < last) {
      // Nueva serie de sangrado si pasó ≥14 días o es anterior
      if (!last || diffDays(last, entry.date) >= 14) {
        saveCycleSettings({ lastPeriodStart: entry.date });
      }
    }
  }

  return entry;
}

export function getCycleLogForDate(date = today()): CycleDayLog | null {
  return loadCycleLogs().find((l) => l.date === date) || null;
}

export function markPeriodStart(date = today()): CycleSettings {
  return saveCycleSettings({ lastPeriodStart: date });
}

function computePhase(
  dayInCycle: number | null,
  periodLength: number,
  cycleLength: number
): CyclePhase {
  if (dayInCycle == null || dayInCycle < 1) return 'unknown';
  if (dayInCycle <= periodLength) return 'menstrual';
  const ovulation = Math.max(periodLength + 1, cycleLength - 14);
  if (dayInCycle >= ovulation - 1 && dayInCycle <= ovulation + 1) return 'ovulatory';
  if (dayInCycle < ovulation - 1) return 'follicular';
  return 'luteal';
}

function phaseTips(phase: CyclePhase, lang: 'es' | 'en' | 'pt' = 'en'): string[] {
  const es: Record<CyclePhase, string[]> = {
    menstrual: [
      'Prioriza descanso y calor local si hay cólicos.',
      'Hierro y proteínas de calidad ayudan a reponer energía.',
      'Hidratación y sueño regular apoyan la recuperación.',
    ],
    follicular: [
      'Buena ventana para entrenamiento de fuerza y proyectos nuevos.',
      'Aprovecha la energía creciente con sol y movimiento.',
      'Mantén proteína y micronutrientes estables.',
    ],
    ovulatory: [
      'Energía y comunicación suelen estar altas: cuida el cuerpo y el alma.',
      'No descuides hidratación si entrenas con intensidad.',
      'Observa señales de fertilidad con respeto y prudencia.',
    ],
    luteal: [
      'Puede bajar la energía: prioriza sueño y comidas estables.',
      'Reduce cafeína extra y azúcares si hay hinchazón o ánimo bajo.',
      'Caminatas suaves y oración ayudan al equilibrio.',
    ],
    unknown: [
      'Registra el inicio de tu periodo para personalizar recomendaciones.',
      'Combina sensores del celular (pasos, sueño) con tu ciclo.',
    ],
  };
  const en: Record<CyclePhase, string[]> = {
    menstrual: [
      'Prioritize rest and gentle heat for cramps.',
      'Quality protein and iron support energy recovery.',
      'Hydration and regular sleep aid recovery.',
    ],
    follicular: [
      'Good window for strength training and new projects.',
      'Use rising energy with outdoor light and movement.',
      'Keep protein and micronutrients steady.',
    ],
    ovulatory: [
      'Energy is often high — steward body and soul well.',
      'Hydrate if training hard.',
      'Observe fertility signs with prudence.',
    ],
    luteal: [
      'Energy may dip — prioritize sleep and steady meals.',
      'Ease extra caffeine/sugar if bloated or low mood.',
      'Gentle walks and prayer support balance.',
    ],
    unknown: [
      'Log period start to personalize guidance.',
      'Combine phone sensors (steps, sleep) with your cycle.',
    ],
  };
  return (lang === 'en' ? en : es)[phase]; // pt falls back to Spanish (close Romance phrasing)
}

export function getCycleSnapshot(lang: 'es' | 'en' | 'pt' = 'en'): CycleSnapshot {
  const settings = loadCycleSettings();
  const cycleLength = Math.min(45, Math.max(21, settings.avgCycleLength || 28));
  const periodLength = Math.min(10, Math.max(2, settings.avgPeriodLength || 5));
  const logs = loadCycleLogs().slice(0, 40);

  let dayInCycle: number | null = null;
  let nextPeriodEstimate: string | null = null;
  let ovulationEstimate: string | null = null;
  let fertileWindowStart: string | null = null;
  let fertileWindowEnd: string | null = null;

  if (settings.lastPeriodStart) {
    dayInCycle = diffDays(settings.lastPeriodStart, today()) + 1;
    if (dayInCycle < 1) dayInCycle = null;
    else if (dayInCycle > cycleLength + 10) {
      // Ciclo muy largo sin nuevo registro — estimar desde proyección
      const cyclesPassed = Math.floor((dayInCycle - 1) / cycleLength);
      const projectedStart = addDays(settings.lastPeriodStart, cyclesPassed * cycleLength);
      dayInCycle = diffDays(projectedStart, today()) + 1;
    }

    const start = settings.lastPeriodStart;
    nextPeriodEstimate = addDays(start, cycleLength);
    // Ajustar si ya pasó el estimado
    while (nextPeriodEstimate && nextPeriodEstimate < today()) {
      nextPeriodEstimate = addDays(nextPeriodEstimate, cycleLength);
    }
    const ovDay = cycleLength - 14;
    ovulationEstimate = addDays(start, ovDay - 1);
    // Si el inicio proyectado actual no es lastPeriodStart, recalcular desde ciclo actual
    if (dayInCycle != null) {
      const currentStart = addDays(today(), -(dayInCycle - 1));
      ovulationEstimate = addDays(currentStart, ovDay - 1);
      nextPeriodEstimate = addDays(currentStart, cycleLength);
      fertileWindowStart = addDays(currentStart, Math.max(1, ovDay - 5) - 1);
      fertileWindowEnd = addDays(currentStart, ovDay + 1 - 1);
    }
  }

  const phase = computePhase(dayInCycle, periodLength, cycleLength);

  return {
    settings,
    phase,
    dayInCycle,
    cycleLength,
    periodLength,
    nextPeriodEstimate,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationEstimate,
    recentLogs: logs,
    tips: phaseTips(phase, lang),
  };
}

export const FLOW_LABELS: Record<FlowLevel, { es: string; en: string }> = {
  none: { es: 'Sin flujo', en: 'None' },
  spotting: { es: 'Manchado', en: 'Spotting' },
  light: { es: 'Ligero', en: 'Light' },
  medium: { es: 'Medio', en: 'Medium' },
  heavy: { es: 'Abundante', en: 'Heavy' },
};

export const SYMPTOM_LABELS: Record<CycleSymptom, { es: string; en: string }> = {
  cramps: { es: 'Cólicos', en: 'Cramps' },
  headache: { es: 'Dolor de cabeza', en: 'Headache' },
  fatigue: { es: 'Fatiga', en: 'Fatigue' },
  bloating: { es: 'Hinchazón', en: 'Bloating' },
  mood: { es: 'Ánimo', en: 'Mood' },
  breast_tenderness: { es: 'Senos sensibles', en: 'Breast tenderness' },
  back_pain: { es: 'Dolor lumbar', en: 'Back pain' },
  acne: { es: 'Acné', en: 'Acne' },
  nausea: { es: 'Náuseas', en: 'Nausea' },
  cravings: { es: 'Antojos', en: 'Cravings' },
};

export const PHASE_LABELS: Record<CyclePhase, { es: string; en: string }> = {
  menstrual: { es: 'Menstrual', en: 'Menstrual' },
  follicular: { es: 'Folicular', en: 'Follicular' },
  ovulatory: { es: 'Ovulatoria', en: 'Ovulatory' },
  luteal: { es: 'Lútea', en: 'Luteal' },
  unknown: { es: 'Sin datos', en: 'Unknown' },
};
