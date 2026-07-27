/**
 * Biomarcadores derivados de sensores del celular + registros locales.
 * No sustituyen laboratorio clínico: orientan hábitos y mayordomía del cuerpo.
 */

import {
  DaySensorIndicators,
  loadDayIndicators,
  emptyDayIndicators,
} from './phone-sensors';
import {
  getSleepRegularity,
  getTodaySleep,
  getTodayHydration,
  getTodayNutrition,
  qualitySummary,
  isFastingWindowGood,
} from './biomarkers';
import { getCurrentHealthStage } from './engine';
import { getCycleSnapshot, type CyclePhase } from './cycle';

export type BiomarkerStatus = 'optimal' | 'good' | 'attention' | 'low' | 'unknown';

export interface Biomarker {
  id: string;
  labelEs: string;
  labelEn: string;
  /** 0–100 cuando aplica */
  score: number | null;
  display: string;
  unit?: string;
  status: BiomarkerStatus;
  source: 'phone_sensor' | 'self_report' | 'derived';
  tipEs: string;
  tipEn: string;
  /** Código LOINC aproximado si existe */
  loinc?: string;
}

export interface BiomarkerReport {
  date: string;
  generatedAt: string;
  compositeScore: number;
  biomarkers: Biomarker[];
  highlights: { es: string; en: string }[];
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function statusFromScore(score: number | null): BiomarkerStatus {
  if (score == null) return 'unknown';
  if (score >= 85) return 'optimal';
  if (score >= 70) return 'good';
  if (score >= 50) return 'attention';
  return 'low';
}

/** Pasos / actividad del día → carga de movimiento */
function activityLoad(day: DaySensorIndicators): Biomarker {
  const stepsScore = clamp((day.steps / 8000) * 100);
  const activeScore = clamp((day.activeMinutes / 45) * 100);
  const vigScore = clamp((day.vigorousMinutes / 20) * 100);
  const score = Math.round(stepsScore * 0.45 + activeScore * 0.35 + vigScore * 0.2);
  return {
    id: 'activity_load',
    labelEs: 'Carga de actividad',
    labelEn: 'Activity load',
    score,
    display: String(score),
    unit: '/100',
    status: statusFromScore(score),
    source: 'phone_sensor',
    tipEs:
      score < 50
        ? 'Camina o entrena 15–20 min. Usa el sensor de pasos del celular.'
        : 'Buen estímulo. Combina con recuperación y sueño.',
    tipEn:
      score < 50
        ? 'Walk or train 15–20 min. Use phone step sensors.'
        : 'Solid stimulus. Pair with recovery and sleep.',
    loinc: '41950-7', // steps
  };
}

function outdoorExposure(day: DaySensorIndicators): Biomarker {
  const minScore = clamp((day.outdoorMinutes / 30) * 100);
  const distScore = clamp((day.distanceMeters / 2500) * 100);
  const score = Math.round(Math.max(minScore, distScore * 0.9));
  return {
    id: 'outdoor_exposure',
    labelEs: 'Exposición exterior / sol',
    labelEn: 'Outdoor / light exposure',
    score,
    display: `${day.outdoorMinutes} min · ${(day.distanceMeters / 1000).toFixed(2)} km`,
    status: statusFromScore(score),
    source: 'phone_sensor',
    tipEs:
      score < 50
        ? 'Sal 20 min al aire libre (GPS). Luz natural regula el ritmo circadiano.'
        : 'Excelente luz y movimiento exterior.',
    tipEn:
      score < 50
        ? 'Get 20 min outdoors (GPS). Natural light anchors circadian rhythm.'
        : 'Great outdoor light and movement.',
  };
}

function movementEfficiency(day: DaySensorIndicators): Biomarker {
  const active = Math.max(1, day.activeMinutes);
  const cadence = day.steps / active; // steps per active minute
  // ~80–120 steps/min is a solid walking cadence proxy
  const score = clamp(((cadence - 20) / 100) * 100);
  return {
    id: 'movement_efficiency',
    labelEs: 'Eficiencia de movimiento',
    labelEn: 'Movement efficiency',
    score: day.activeMinutes > 0 ? Math.round(score) : null,
    display: day.activeMinutes > 0 ? `${Math.round(cadence)} pasos/min act.` : '—',
    status: day.activeMinutes > 0 ? statusFromScore(score) : 'unknown',
    source: 'derived',
    tipEs: 'Ritmo de caminata sostenido mejora el metabolismo y el ánimo.',
    tipEn: 'Steady walking cadence supports metabolism and mood.',
  };
}

function recoveryScore(
  day: DaySensorIndicators,
  sleepRegScore: number,
  sleepDurationMin: number | null
): Biomarker {
  let score = 40;
  if (sleepDurationMin != null) {
    const h = sleepDurationMin / 60;
    if (h >= 7 && h <= 9.5) score += 35;
    else if (h >= 6 && h < 7) score += 20;
    else if (h > 9.5 && h <= 10.5) score += 22;
    else score += 8;
  }
  score += (sleepRegScore / 100) * 20;
  // Baja actividad vigorosa excesiva ayuda a recuperación relativa
  if (day.vigorousMinutes > 60) score -= 8;
  if (day.activeMinutes < 10 && sleepDurationMin && sleepDurationMin >= 420) score += 5;
  score = clamp(Math.round(score));
  return {
    id: 'recovery',
    labelEs: 'Recuperación (sueño + sensores)',
    labelEn: 'Recovery (sleep + sensors)',
    score,
    display: String(score),
    unit: '/100',
    status: statusFromScore(score),
    source: 'derived',
    tipEs:
      score < 60
        ? 'Prioriza 7–9 h de sueño y cierra el modo reposo del celular al despertar.'
        : 'Recuperación sólida. Mantén horario estable.',
    tipEn:
      score < 60
        ? 'Aim for 7–9 h sleep; end phone rest mode on waking.'
        : 'Solid recovery. Keep a stable schedule.',
    loinc: '93832-4', // sleep duration
  };
}

function circadianStability(regScore: number, samples: number): Biomarker {
  const score = samples < 2 ? null : regScore;
  return {
    id: 'circadian_stability',
    labelEs: 'Estabilidad circadiana',
    labelEn: 'Circadian stability',
    score,
    display: samples < 2 ? 'Pocos datos' : `${regScore}/100`,
    status: statusFromScore(score),
    source: 'self_report',
    tipEs: 'Despierta a la misma hora (±30 min) 7 días seguidos.',
    tipEn: 'Wake within ±30 min at the same time for 7 days.',
  };
}

function hydrationBiomarker(glasses: number, goal: number): Biomarker {
  const score = goal > 0 ? clamp(Math.round((glasses / goal) * 100)) : null;
  return {
    id: 'hydration',
    labelEs: 'Hidratación',
    labelEn: 'Hydration',
    score,
    display: `${glasses}/${goal} vasos`,
    status: statusFromScore(score),
    source: 'self_report',
    tipEs: 'Meta ~2–2.5 L/día según etapa. El ciclo menstrual puede subir la necesidad.',
    tipEn: 'Aim ~2–2.5 L/day by life stage. Cycle days may need more.',
  };
}

function nutritionBiomarker(stage: string): Biomarker {
  const nutrition = getTodayNutrition();
  const q = qualitySummary(nutrition);
  const total = q.whole + q.mixed + q.processed;
  if (total === 0) {
    return {
      id: 'nutrition_quality',
      labelEs: 'Calidad nutricional',
      labelEn: 'Nutrition quality',
      score: null,
      display: 'Sin comidas',
      status: 'unknown',
      source: 'self_report',
      tipEs: 'Registra comidas reales (enteras > procesadas).',
      tipEn: 'Log real meals (whole > processed).',
    };
  }
  const score = clamp(Math.round((q.whole * 100 + q.mixed * 55 + q.processed * 15) / total));
  const fastingOk = isFastingWindowGood(nutrition, stage);
  return {
    id: 'nutrition_quality',
    labelEs: 'Calidad nutricional',
    labelEn: 'Nutrition quality',
    score,
    display: `${q.whole} enteras · ${q.processed} proc.`,
    status: statusFromScore(score),
    source: 'self_report',
    tipEs: fastingOk
      ? 'Ventana de ayuno razonable. Prioriza comida real.'
      : 'Cierra la cocina temprano y prioriza comida real.',
    tipEn: fastingOk
      ? 'Reasonable fasting window. Prioritize real food.'
      : 'Close the kitchen earlier; prioritize real food.',
  };
}

function cycleAwareBiomarker(isFemale: boolean): Biomarker | null {
  if (!isFemale) return null;
  const snap = getCycleSnapshot('es');
  const phaseScore: Record<CyclePhase, number> = {
    menstrual: 62,
    follicular: 88,
    ovulatory: 90,
    luteal: 72,
    unknown: 40,
  };
  const score = phaseScore[snap.phase];
  return {
    id: 'cycle_phase_readiness',
    labelEs: 'Preparación según ciclo',
    labelEn: 'Cycle-phase readiness',
    score: snap.phase === 'unknown' ? null : score,
    display:
      snap.phase === 'unknown'
        ? 'Sin ciclo registrado'
        : `Día ${snap.dayInCycle} · ${snap.phase}`,
    status: snap.phase === 'unknown' ? 'unknown' : statusFromScore(score),
    source: 'self_report',
    tipEs: snap.tips[0] || 'Registra tu periodo para consejos por fase.',
    tipEn: 'Log your period for phase-aware coaching.',
    loinc: '92608-8', // menstruation
  };
}

function sedentaryRisk(day: DaySensorIndicators): Biomarker {
  // Inverse of activity: low movement = higher risk (we invert for "health score")
  const active = day.activeMinutes + day.vigorousMinutes * 0.5;
  const score = clamp(Math.round((active / 40) * 100)); // high = better (less sedentary risk)
  return {
    id: 'anti_sedentary',
    labelEs: 'Anti-sedentarismo',
    labelEn: 'Anti-sedentary score',
    score,
    display: `${Math.round(active)} min-eq activos`,
    status: statusFromScore(score),
    source: 'phone_sensor',
    tipEs: 'Levántate cada hora: 2–3 min de movimiento rompen el sedentarismo.',
    tipEn: 'Stand hourly: 2–3 min of movement breaks sedentarism.',
  };
}

export function computeBiomarkerReport(opts?: {
  isFemale?: boolean;
  day?: DaySensorIndicators;
}): BiomarkerReport {
  const day = opts?.day ?? (typeof window !== 'undefined' ? loadDayIndicators() : emptyDayIndicators());
  const stage = getCurrentHealthStage();
  const sleep = getTodaySleep();
  const reg = getSleepRegularity();
  const hydration = getTodayHydration(stage);
  const isFemale = !!opts?.isFemale;

  const biomarkers: Biomarker[] = [
    activityLoad(day),
    outdoorExposure(day),
    movementEfficiency(day),
    recoveryScore(day, reg.score, sleep?.durationMinutes ?? day.restDurationMin ?? null),
    circadianStability(reg.score, reg.samples),
    hydrationBiomarker(hydration.glasses, hydration.goal),
    nutritionBiomarker(stage),
    sedentaryRisk(day),
  ];

  const cycleBm = cycleAwareBiomarker(isFemale);
  if (cycleBm) biomarkers.push(cycleBm);

  const scored = biomarkers.filter((b) => b.score != null) as (Biomarker & { score: number })[];
  const compositeScore =
    scored.length === 0
      ? 0
      : Math.round(scored.reduce((s, b) => s + b.score, 0) / scored.length);

  const weak = scored.filter((b) => b.score < 60).slice(0, 2);
  const strong = scored.filter((b) => b.score >= 80).slice(0, 2);

  const highlights: { es: string; en: string }[] = [];
  if (strong.length) {
    highlights.push({
      es: `Fortaleza: ${strong.map((b) => b.labelEs).join(', ')}.`,
      en: `Strength: ${strong.map((b) => b.labelEn).join(', ')}.`,
    });
  }
  if (weak.length) {
    highlights.push({
      es: `Prioriza hoy: ${weak.map((b) => b.labelEs).join(', ')}.`,
      en: `Focus today: ${weak.map((b) => b.labelEn).join(', ')}.`,
    });
  }
  if (!highlights.length) {
    highlights.push({
      es: 'Activa sensores y registra sueño/hidratación para ver biomarcadores.',
      en: 'Enable sensors and log sleep/hydration to populate biomarkers.',
    });
  }

  return {
    date: day.date,
    generatedAt: new Date().toISOString(),
    compositeScore,
    biomarkers,
    highlights,
  };
}

export function biomarkerStatusColor(status: BiomarkerStatus): string {
  switch (status) {
    case 'optimal':
      return 'text-[#8FD99A]';
    case 'good':
      return 'text-[#A8D4AE]';
    case 'attention':
      return 'text-amber-300';
    case 'low':
      return 'text-rose-300';
    default:
      return 'text-[var(--sage)]';
  }
}
