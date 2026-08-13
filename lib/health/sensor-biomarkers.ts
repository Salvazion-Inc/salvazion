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

/** Health Hub tab that owns this biomarker (no cross-tab duplicates). */
export type BiomarkerCategory = 'exercise' | 'nutrition' | 'sleep';

export interface Biomarker {
  id: string;
  labelEs: string;
  labelEn: string;
  labelPt: string;
  /** 0–100 cuando aplica */
  score: number | null;
  display: string;
  unit?: string;
  status: BiomarkerStatus;
  source: 'phone_sensor' | 'self_report' | 'derived';
  tipEs: string;
  tipEn: string;
  tipPt: string;
  /** Código LOINC aproximado si existe */
  loinc?: string;
  /** Which Health tab shows this marker */
  category: BiomarkerCategory;
}

/** Canonical id → tab assignment (single home, no duplication). */
export const BIOMARKER_CATEGORY: Record<string, BiomarkerCategory> = {
  activity_load: 'exercise',
  outdoor_exposure: 'exercise',
  movement_efficiency: 'exercise',
  anti_sedentary: 'exercise',
  cycle_phase_readiness: 'exercise',
  hydration: 'nutrition',
  nutrition_quality: 'nutrition',
  recovery: 'sleep',
  circadian_stability: 'sleep',
};

export function categoryForBiomarkerId(id: string): BiomarkerCategory {
  return BIOMARKER_CATEGORY[id] ?? 'exercise';
}

export interface BiomarkerReport {
  date: string;
  generatedAt: string;
  compositeScore: number;
  biomarkers: Biomarker[];
  highlights: { es: string; en: string; pt: string }[];
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
    labelPt: 'Carga de atividade',
    score,
    display: String(score),
    unit: '/100',
    status: statusFromScore(score),
    source: 'phone_sensor',
    category: 'exercise',
    tipEs:
      score < 50
        ? 'Camina o entrena 15–20 min. Usa el sensor de pasos del celular.'
        : 'Buen estímulo. Combina con recuperación y sueño.',
    tipEn:
      score < 50
        ? 'Walk or train 15–20 min. Use phone step sensors.'
        : 'Solid stimulus. Pair with recovery and sleep.',
    tipPt:
      score < 50
        ? 'Caminhe ou treine 15–20 min. Use o sensor de passos do celular.'
        : 'Bom estímulo. Combine com recuperação e sono.',
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
    labelPt: 'Exposição exterior / sol',
    score,
    display: `${day.outdoorMinutes} min · ${(day.distanceMeters / 1000).toFixed(2)} km`,
    status: statusFromScore(score),
    source: 'phone_sensor',
    category: 'exercise',
    tipEs:
      score < 50
        ? 'Sal 20 min al aire libre (GPS). Luz natural regula el ritmo circadiano.'
        : 'Excelente luz y movimiento exterior.',
    tipEn:
      score < 50
        ? 'Get 20 min outdoors (GPS). Natural light anchors circadian rhythm.'
        : 'Great outdoor light and movement.',
    tipPt:
      score < 50
        ? 'Saia 20 min ao ar livre (GPS). A luz natural regula o ritmo circadiano.'
        : 'Excelente luz e movimento exterior.',
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
    labelPt: 'Eficiência de movimento',
    score: day.activeMinutes > 0 ? Math.round(score) : null,
    display: day.activeMinutes > 0 ? `${Math.round(cadence)} pasos/min act.` : '—',
    status: day.activeMinutes > 0 ? statusFromScore(score) : 'unknown',
    source: 'derived',
    category: 'exercise',
    tipEs: 'Ritmo de caminata sostenido mejora el metabolismo y el ánimo.',
    tipEn: 'Steady walking cadence supports metabolism and mood.',
    tipPt: 'Ritmo de caminhada sustentado melhora o metabolismo e o ânimo.',
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
    labelPt: 'Recuperação (sono + sensores)',
    score,
    display: String(score),
    unit: '/100',
    status: statusFromScore(score),
    source: 'derived',
    category: 'sleep',
    tipEs:
      score < 60
        ? 'Prioriza 7–9 h de sueño y cierra el modo reposo del celular al despertar.'
        : 'Recuperación sólida. Mantén horario estable.',
    tipEn:
      score < 60
        ? 'Aim for 7–9 h sleep; end phone rest mode on waking.'
        : 'Solid recovery. Keep a stable schedule.',
    tipPt:
      score < 60
        ? 'Priorize 7–9 h de sono e encerre o modo repouso do celular ao acordar.'
        : 'Recuperação sólida. Mantenha horário estável.',
    loinc: '93832-4', // sleep duration
  };
}

function circadianStability(regScore: number, samples: number): Biomarker {
  const score = samples < 2 ? null : regScore;
  return {
    id: 'circadian_stability',
    labelEs: 'Estabilidad circadiana',
    labelEn: 'Circadian stability',
    labelPt: 'Estabilidade circadiana',
    score,
    display: samples < 2 ? 'Pocos datos' : `${regScore}/100`,
    status: statusFromScore(score),
    source: 'self_report',
    category: 'sleep',
    tipEs: 'Despierta a la misma hora (±30 min) 7 días seguidos.',
    tipEn: 'Wake within ±30 min at the same time for 7 days.',
    tipPt: 'Acorde no mesmo horário (±30 min) por 7 dias seguidos.',
  };
}

function hydrationBiomarker(glasses: number, goal: number): Biomarker {
  const score = goal > 0 ? clamp(Math.round((glasses / goal) * 100)) : null;
  return {
    id: 'hydration',
    labelEs: 'Hidratación',
    labelEn: 'Hydration',
    labelPt: 'Hidratação',
    score,
    display: `${glasses}/${goal} vasos`,
    status: statusFromScore(score),
    source: 'self_report',
    category: 'nutrition',
    tipEs: 'Meta ~2–2.5 L/día según etapa. El ciclo menstrual puede subir la necesidad.',
    tipEn: 'Aim ~2–2.5 L/day by life stage. Cycle days may need more.',
    tipPt: 'Meta ~2–2,5 L/dia conforme a etapa. O ciclo menstrual pode aumentar a necessidade.',
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
      labelPt: 'Qualidade nutricional',
      score: null,
      display: 'Sin comidas',
      status: 'unknown',
      source: 'self_report',
      category: 'nutrition',
      tipEs: 'Registra comidas reales (enteras > procesadas).',
      tipEn: 'Log real meals (whole > processed).',
      tipPt: 'Registre refeições reais (integrais > processadas).',
    };
  }
  const score = clamp(Math.round((q.whole * 100 + q.mixed * 55 + q.processed * 15) / total));
  const fastingOk = isFastingWindowGood(nutrition, stage);
  return {
    id: 'nutrition_quality',
    labelEs: 'Calidad nutricional',
    labelEn: 'Nutrition quality',
    labelPt: 'Qualidade nutricional',
    score,
    display: `${q.whole} enteras · ${q.processed} proc.`,
    status: statusFromScore(score),
    source: 'self_report',
    category: 'nutrition',
    tipEs: fastingOk
      ? 'Ventana de ayuno razonable. Prioriza comida real.'
      : 'Cierra la cocina temprano y prioriza comida real.',
    tipEn: fastingOk
      ? 'Reasonable fasting window. Prioritize real food.'
      : 'Close the kitchen earlier; prioritize real food.',
    tipPt: fastingOk
      ? 'Janela de jejum razoável. Priorize comida de verdade.'
      : 'Feche a cozinha cedo e priorize comida de verdade.',
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
    labelPt: 'Preparação segundo o ciclo',
    score: snap.phase === 'unknown' ? null : score,
    display:
      snap.phase === 'unknown'
        ? 'Sin ciclo registrado'
        : `Día ${snap.dayInCycle} · ${snap.phase}`,
    status: snap.phase === 'unknown' ? 'unknown' : statusFromScore(score),
    source: 'self_report',
    category: 'exercise',
    tipEs: snap.tips[0] || 'Registra tu periodo para consejos por fase.',
    tipEn: 'Log your period for phase-aware coaching.',
    tipPt: snap.tips[0] || 'Registre o período para conselhos por fase.',
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
    labelPt: 'Anti-sedentarismo',
    score,
    display: `${Math.round(active)} min-eq activos`,
    status: statusFromScore(score),
    source: 'phone_sensor',
    category: 'exercise',
    tipEs: 'Levántate cada hora: 2–3 min de movimiento rompen el sedentarismo.',
    tipEn: 'Stand hourly: 2–3 min of movement breaks sedentarism.',
    tipPt: 'Levante-se a cada hora: 2–3 min de movimento quebram o sedentarismo.',
  };
}

export function computeBiomarkerReport(opts?: {
  isFemale?: boolean;
  day?: DaySensorIndicators;
  /** If set, only markers for this Health tab (no cross-tab duplicates). */
  category?: BiomarkerCategory;
}): BiomarkerReport {
  const day = opts?.day ?? (typeof window !== 'undefined' ? loadDayIndicators() : emptyDayIndicators());
  const stage = getCurrentHealthStage();
  const sleep = getTodaySleep();
  const reg = getSleepRegularity();
  const hydration = getTodayHydration(stage);
  const isFemale = !!opts?.isFemale;

  let biomarkers: Biomarker[] = [
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

  // Ensure category is always set from the map (forward-compatible)
  biomarkers = biomarkers.map((b) => ({
    ...b,
    category: b.category || categoryForBiomarkerId(b.id),
  }));

  if (opts?.category) {
    biomarkers = biomarkers.filter((b) => b.category === opts.category);
  }

  const scored = biomarkers.filter((b) => b.score != null) as (Biomarker & { score: number })[];
  const compositeScore =
    scored.length === 0
      ? 0
      : Math.round(scored.reduce((s, b) => s + b.score, 0) / scored.length);

  const weak = scored.filter((b) => b.score < 60).slice(0, 2);
  const strong = scored.filter((b) => b.score >= 80).slice(0, 2);

  const highlights: { es: string; en: string; pt: string }[] = [];
  if (strong.length) {
    highlights.push({
      es: `Fortaleza: ${strong.map((b) => b.labelEs).join(', ')}.`,
      en: `Strength: ${strong.map((b) => b.labelEn).join(', ')}.`,
      pt: `Força: ${strong.map((b) => b.labelPt).join(', ')}.`,
    });
  }
  if (weak.length) {
    highlights.push({
      es: `Prioriza hoy: ${weak.map((b) => b.labelEs).join(', ')}.`,
      en: `Focus today: ${weak.map((b) => b.labelEn).join(', ')}.`,
      pt: `Priorize hoje: ${weak.map((b) => b.labelPt).join(', ')}.`,
    });
  }
  if (!highlights.length) {
    const emptyByCat: Record<BiomarkerCategory, { es: string; en: string; pt: string }> = {
      exercise: {
        es: 'Mueve el cuerpo y usa sensores de pasos/GPS para llenar biomarcadores de ejercicio.',
        en: 'Move and use step/GPS sensors to populate exercise biomarkers.',
        pt: 'Mova o corpo e use sensores de passos/GPS para preencher biomarcadores de exercício.',
      },
      nutrition: {
        es: 'Registra comidas e hidratación para ver biomarcadores de alimentación.',
        en: 'Log meals and hydration to populate nutrition biomarkers.',
        pt: 'Registre refeições e hidratação para ver biomarcadores de alimentação.',
      },
      sleep: {
        es: 'Registra sueño y regularidad para ver biomarcadores de descanso.',
        en: 'Log sleep and regularity to populate rest biomarkers.',
        pt: 'Registre sono e regularidade para ver biomarcadores de descanso.',
      },
    };
    highlights.push(
      opts?.category
        ? emptyByCat[opts.category]
        : {
            es: 'Activa sensores y registra sueño/hidratación para ver biomarcadores.',
            en: 'Enable sensors and log sleep/hydration to populate biomarkers.',
            pt: 'Ative sensores e registre sono/hidratação para ver biomarcadores.',
          }
    );
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
