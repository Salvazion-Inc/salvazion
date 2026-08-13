/**
 * Anamnesis clínica (próxima + remota) — ficha legible del paciente.
 * Se guarda en localStorage; se rellena con perfil + Health de la app.
 */

import type { UserProfile } from '@/lib/types';
import { calculateAge, getLifeStage, getLifeStageLabel } from '@/lib/store/profile';
import {
  getTodaySleep,
  getSleepRegularity,
  getTodayHydration,
  getTodayNutrition,
  qualitySummary,
  totalEstimatedKcal,
  loadSleepLog,
  idealSleepHours,
} from './biomarkers';
import { getCurrentHealthStage } from './engine';
import { getCycleSnapshot, loadCycleSettings } from './cycle';
import { loadSports, sportProgress, loadSessions } from './sports';
import {
  getCombinedHealthIndicators,
  toDaySensorIndicators,
} from './wearables';
import { computeBiomarkerReport } from './sensor-biomarkers';

const STORAGE_KEY = 'salvazion_anamnesis_v1';

/** Anamnesis remota — historia de vida y antecedentes */
export type RemoteAnamnesis = {
  /** Antecedentes personales patológicos (enfermedades previas) */
  personalHistory: string;
  /** Cirugías / hospitalizaciones */
  surgicalHistory: string;
  /** Antecedentes familiares */
  familyHistory: string;
  /** Alergias (fármacos, alimentos, etc.) */
  allergies: string;
  /** Medicación habitual */
  medications: string;
  /** Hábitos tóxicos (tabaco, alcohol, otras) */
  toxicHabits: string;
  /** Ocupación / actividad laboral o ministerial */
  occupation: string;
  /** Actividad física habitual (texto libre; se prellena con deportes) */
  physicalActivity: string;
  /** Antecedentes gineco-obstétricos (solo si aplica) */
  gynObstetric: string;
  /** Otros antecedentes relevantes */
  otherRemote: string;
};

/** Anamnesis próxima — situación actual / enfermedad actual */
export type ProximateAnamnesis = {
  /** Motivo de consulta */
  chiefComplaint: string;
  /** Historia de la enfermedad actual */
  presentIllness: string;
  /** Síntomas actuales */
  currentSymptoms: string;
  /** Sueño actual (texto + se enriquece con logs) */
  currentSleep: string;
  /** Actividad / ejercicio reciente */
  currentActivity: string;
  /** Alimentación / hidratación reciente */
  currentNutrition: string;
  /** Estado anímico / estrés (opcional, no diagnóstico) */
  moodStress: string;
  /** Notas del paciente o para el clínico */
  notes: string;
};

export type AnamnesisRecord = {
  version: 1;
  updatedAt: string;
  remote: RemoteAnamnesis;
  proximate: ProximateAnamnesis;
  /** Snapshot de métricas al último autofill (solo lectura) */
  vitalsSnapshot?: string;
};

function emptyRemote(): RemoteAnamnesis {
  return {
    personalHistory: '',
    surgicalHistory: '',
    familyHistory: '',
    allergies: '',
    medications: '',
    toxicHabits: '',
    occupation: '',
    physicalActivity: '',
    gynObstetric: '',
    otherRemote: '',
  };
}

function emptyProximate(): ProximateAnamnesis {
  return {
    chiefComplaint: '',
    presentIllness: '',
    currentSymptoms: '',
    currentSleep: '',
    currentActivity: '',
    currentNutrition: '',
    moodStress: '',
    notes: '',
  };
}

export function emptyAnamnesis(): AnamnesisRecord {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    remote: emptyRemote(),
    proximate: emptyProximate(),
  };
}

export function loadAnamnesis(): AnamnesisRecord {
  if (typeof window === 'undefined') return emptyAnamnesis();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAnamnesis();
    const parsed = JSON.parse(raw) as AnamnesisRecord;
    return {
      version: 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      remote: { ...emptyRemote(), ...parsed.remote },
      proximate: { ...emptyProximate(), ...parsed.proximate },
      vitalsSnapshot: parsed.vitalsSnapshot,
    };
  } catch {
    return emptyAnamnesis();
  }
}

export function saveAnamnesis(record: AnamnesisRecord): AnamnesisRecord {
  const next: AnamnesisRecord = {
    ...record,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function patchAnamnesis(
  patch: {
    remote?: Partial<RemoteAnamnesis>;
    proximate?: Partial<ProximateAnamnesis>;
    vitalsSnapshot?: string;
  }
): AnamnesisRecord {
  const cur = loadAnamnesis();
  return saveAnamnesis({
    ...cur,
    remote: { ...cur.remote, ...patch.remote },
    proximate: { ...cur.proximate, ...patch.proximate },
    vitalsSnapshot:
      patch.vitalsSnapshot !== undefined
        ? patch.vitalsSnapshot
        : cur.vitalsSnapshot,
  });
}

function joinNonEmpty(parts: (string | null | undefined)[], sep = '\n'): string {
  return parts.map((p) => (p || '').trim()).filter(Boolean).join(sep);
}

/**
 * Rellena campos vacíos (o fuerza overwrite) con datos reales de la app.
 * No inventa diagnósticos: solo resume lo registrado.
 */
export function autofillAnamnesis(
  profile: Partial<UserProfile>,
  opts?: { overwrite?: boolean; lang?: 'es' | 'en' | 'pt' }
): AnamnesisRecord {
  const lang = opts?.lang ?? 'en';
  const es = lang === 'es';
  const overwrite = !!opts?.overwrite;
  const cur = loadAnamnesis();
  const stage = getCurrentHealthStage();
  const age = profile.birthDate ? calculateAge(profile.birthDate) : null;
  const lifeStage =
    age != null
      ? getLifeStageLabel(getLifeStage(age), lang)
      : null;

  const sleep = getTodaySleep();
  const reg = getSleepRegularity();
  const ideal = idealSleepHours(stage);
  const hydration = getTodayHydration(stage);
  const nutrition = getTodayNutrition();
  const mealQ = qualitySummary(nutrition);
  const kcalEst = totalEstimatedKcal(nutrition);
  const combined = getCombinedHealthIndicators();
  const day = toDaySensorIndicators(combined);
  const biomarkers = computeBiomarkerReport({
    isFemale: profile.sex === 'female',
    day,
  });
  const sports = loadSports();
  const sessions = loadSessions();
  const sleepLog = loadSleepLog();

  // ── Remote autofill ─────────────────────────────────────────
  const sportsText =
    sports.length > 0
      ? sports
          .map((s) => {
            const p = sportProgress(s);
            return es
              ? `• ${s.name} (${s.environment}, ${s.frequency}) · progreso ${p.done}/${p.target}`
              : `• ${s.name} (${s.environment}, ${s.frequency}) · progress ${p.done}/${p.target}`;
          })
          .join('\n')
      : es
        ? 'Sin deportes configurados en la app.'
        : 'No sports configured in the app.';

  const activityRemote = es
    ? `Actividad en Salvazion:\n${sportsText}\nSesiones totales en historial: ${sessions.length}.`
    : `Activity in Salvazion:\n${sportsText}\nTotal sessions in history: ${sessions.length}.`;

  let gyn = cur.remote.gynObstetric;
  if (profile.sex === 'female') {
    const cycle = getCycleSnapshot(lang);
    const settings = loadCycleSettings();
    gyn = es
      ? joinNonEmpty([
          `Ciclo menstrual (app): ciclo ~${settings.avgCycleLength} d, menstruación ~${settings.avgPeriodLength} d.`,
          cycle.dayInCycle != null
            ? `Día actual del ciclo: ${cycle.dayInCycle}. Fase estimada: ${cycle.phase}.`
            : 'Sin fecha de última menstruación configurada.',
          cycle.tips?.length ? cycle.tips.slice(0, 2).join(' ') : null,
        ])
      : joinNonEmpty([
          `Menstrual cycle (app): ~${settings.avgCycleLength} d cycle, ~${settings.avgPeriodLength} d period.`,
          cycle.dayInCycle != null
            ? `Current cycle day: ${cycle.dayInCycle}. Estimated phase: ${cycle.phase}.`
            : 'No LMP configured.',
          cycle.tips?.length ? cycle.tips.slice(0, 2).join(' ') : null,
        ]);
  }

  const fill = (current: string, next: string) =>
    overwrite || !current.trim() ? next : current;

  const remote: RemoteAnamnesis = {
    ...cur.remote,
    physicalActivity: fill(cur.remote.physicalActivity, activityRemote),
    occupation: fill(
      cur.remote.occupation,
      profile.familyStatus
        ? es
          ? `Situación familiar declarada: ${profile.familyStatus}. (Completar ocupación manualmente.)`
          : `Declared family status: ${profile.familyStatus}. (Complete occupation manually.)`
        : cur.remote.occupation
    ),
    gynObstetric:
      profile.sex === 'female'
        ? fill(cur.remote.gynObstetric, gyn)
        : cur.remote.gynObstetric,
    // Keep medical free-text unless empty with gentle prompts
    personalHistory: fill(
      cur.remote.personalHistory,
      es
        ? 'Sin enfermedades crónicas declaradas en la app. Indique diagnósticos previos, hospitalizaciones o tratamientos crónicos.'
        : 'No chronic conditions declared in the app. List prior diagnoses, hospitalizations, or chronic treatments.'
    ),
    surgicalHistory: fill(
      cur.remote.surgicalHistory,
      es
        ? 'Sin cirugías declaradas. Indique intervenciones y años aproximados.'
        : 'No surgeries declared. List procedures and approximate years.'
    ),
    familyHistory: fill(
      cur.remote.familyHistory,
      es
        ? 'Indique antecedentes familiares relevantes (HTA, DM, cáncer, cardiopatía, salud mental, etc.).'
        : 'List relevant family history (HTN, DM, cancer, heart disease, mental health, etc.).'
    ),
    allergies: fill(
      cur.remote.allergies,
      es
        ? 'NKDA / sin alergias conocidas (confirmar).'
        : 'NKDA / no known allergies (confirm).'
    ),
    medications: fill(
      cur.remote.medications,
      es
        ? 'Sin medicación habitual registrada. Liste fármacos, dosis y pauta.'
        : 'No routine meds logged. List drugs, dose, and schedule.'
    ),
    toxicHabits: fill(
      cur.remote.toxicHabits,
      es
        ? 'Tabaco: no declarado · Alcohol: no declarado · Otras: —'
        : 'Tobacco: not declared · Alcohol: not declared · Other: —'
    ),
    otherRemote: fill(
      cur.remote.otherRemote,
      profile.purpose
        ? es
          ? `Propósito de vida (contexto psicosocial): ${profile.purpose}`
          : `Life purpose (psychosocial context): ${profile.purpose}`
        : ''
    ),
  };

  // ── Proximate autofill ──────────────────────────────────────
  const sleepHours = sleep
    ? (sleep.durationMinutes / 60).toFixed(1)
    : combined.sleepHours != null
      ? combined.sleepHours.toFixed(1)
      : null;

  const sleepText = es
    ? joinNonEmpty([
        sleep
          ? `Último sueño registrado: ${sleep.bedTime}–${sleep.wakeTime} (${sleepHours} h). Ideal etapa: ${ideal.min}–${ideal.max} h.`
          : sleepHours
            ? `Sueño desde dispositivo: ~${sleepHours} h.`
            : 'Sin registro de sueño hoy.',
        reg.samples >= 2
          ? `Regularidad 7 d: score ${reg.score}/100 · desviación media ±${reg.avgDeviationMinutes ?? '—'} min (${reg.samples} noches).`
          : `Regularidad: insuficientes registros (${reg.samples}).`,
        sleepLog.length
          ? `Historial de sueño en app: ${sleepLog.length} entradas.`
          : null,
      ])
    : joinNonEmpty([
        sleep
          ? `Last sleep log: ${sleep.bedTime}–${sleep.wakeTime} (${sleepHours} h). Stage ideal: ${ideal.min}–${ideal.max} h.`
          : sleepHours
            ? `Device sleep: ~${sleepHours} h.`
            : 'No sleep log today.',
        reg.samples >= 2
          ? `7-day regularity: score ${reg.score}/100 · mean deviation ±${reg.avgDeviationMinutes ?? '—'} min (${reg.samples} nights).`
          : `Regularity: insufficient logs (${reg.samples}).`,
        sleepLog.length ? `Sleep history in app: ${sleepLog.length} entries.` : null,
      ]);

  const activityText = es
    ? joinNonEmpty([
        `Hoy (dispositivos): ${combined.steps} pasos · ${combined.activeMinutes} min activos · ${(combined.distanceMeters / 1000).toFixed(2)} km.`,
        combined.outdoorMinutes > 0
          ? `Exterior / GPS: ${combined.outdoorMinutes} min.`
          : null,
        combined.restingHr != null || combined.avgHeartRate != null
          ? `FC: reposo ${combined.restingHr ?? '—'} · media ${combined.avgHeartRate ?? '—'} bpm.`
          : null,
        combined.hrv != null ? `HRV: ${combined.hrv}.` : null,
        sports.length
          ? `Deportes activos: ${sports.map((s) => s.name).join(', ')}.`
          : 'Sin deportes activos.',
      ])
    : joinNonEmpty([
        `Today (devices): ${combined.steps} steps · ${combined.activeMinutes} active min · ${(combined.distanceMeters / 1000).toFixed(2)} km.`,
        combined.outdoorMinutes > 0
          ? `Outdoor / GPS: ${combined.outdoorMinutes} min.`
          : null,
        combined.restingHr != null || combined.avgHeartRate != null
          ? `HR: resting ${combined.restingHr ?? '—'} · avg ${combined.avgHeartRate ?? '—'} bpm.`
          : null,
        combined.hrv != null ? `HRV: ${combined.hrv}.` : null,
        sports.length
          ? `Active sports: ${sports.map((s) => s.name).join(', ')}.`
          : 'No active sports.',
      ]);

  const nutritionText = es
    ? joinNonEmpty([
        `Hidratación: ${hydration.glasses}/${hydration.goal} vasos.`,
        nutrition.meals?.length
          ? `Comidas hoy: ${nutrition.meals.length} · calidad (enteras/mixtas/procesadas): ${mealQ.whole}/${mealQ.mixed}/${mealQ.processed} · ~${kcalEst || '—'} kcal est.`
          : 'Sin comidas registradas hoy.',
      ])
    : joinNonEmpty([
        `Hydration: ${hydration.glasses}/${hydration.goal} glasses.`,
        nutrition.meals?.length
          ? `Meals today: ${nutrition.meals.length} · quality (whole/mixed/processed): ${mealQ.whole}/${mealQ.mixed}/${mealQ.processed} · ~${kcalEst || '—'} kcal est.`
          : 'No meals logged today.',
      ]);

  const bmLine = biomarkers.biomarkers
    .filter((b) => b.score != null)
    .slice(0, 6)
    .map(
      (b) =>
        `${lang === 'pt' ? b.labelPt : es ? b.labelEs : b.labelEn}: ${b.score}${b.unit || ''}`
    )
    .join(' · ');

  const vitalsSnapshot = es
    ? joinNonEmpty([
        `Fecha snapshot: ${new Date().toLocaleString('es')}.`,
        `Identidad: ${profile.name || '—'} · ${age != null ? `${age} años` : 'edad —'}${lifeStage ? ` (${lifeStage})` : ''} · sexo ${profile.sex || '—'} · ${[profile.city, profile.country].filter(Boolean).join(', ') || 'ubicación —'}.`,
        `Dispositivos: pasos ${combined.steps}, activos ${combined.activeMinutes} min, sueño ${sleepHours ?? '—'} h, FC ${combined.restingHr ?? combined.avgHeartRate ?? '—'}.`,
        `Índice biomarcadores compuesto: ${biomarkers.compositeScore}/100.`,
        bmLine ? `Detalle: ${bmLine}.` : null,
        `Fuentes: ${combined.sources.phone ? 'teléfono' : ''}${combined.sources.phone && combined.sources.wearable ? ' + ' : ''}${combined.sources.wearable ? 'wearable' : !combined.sources.phone ? 'sin dispositivo' : ''}.`,
      ])
    : joinNonEmpty([
        `Snapshot date: ${new Date().toLocaleString('en')}.`,
        `Identity: ${profile.name || '—'} · ${age != null ? `${age} y` : 'age —'}${lifeStage ? ` (${lifeStage})` : ''} · sex ${profile.sex || '—'} · ${[profile.city, profile.country].filter(Boolean).join(', ') || 'location —'}.`,
        `Devices: steps ${combined.steps}, active ${combined.activeMinutes} min, sleep ${sleepHours ?? '—'} h, HR ${combined.restingHr ?? combined.avgHeartRate ?? '—'}.`,
        `Biomarker composite: ${biomarkers.compositeScore}/100.`,
        bmLine ? `Detail: ${bmLine}.` : null,
        `Sources: ${combined.sources.phone ? 'phone' : ''}${combined.sources.phone && combined.sources.wearable ? ' + ' : ''}${combined.sources.wearable ? 'wearable' : !combined.sources.phone ? 'no device' : ''}.`,
      ]);

  const proximate: ProximateAnamnesis = {
    ...cur.proximate,
    chiefComplaint: fill(
      cur.proximate.chiefComplaint,
      es
        ? 'Control / seguimiento de salud integral (Salvazion). Completar motivo específico si hay consulta.'
        : 'General health follow-up (Salvazion). Complete specific chief complaint if presenting.'
    ),
    presentIllness: fill(
      cur.proximate.presentIllness,
      es
        ? 'Paciente en seguimiento de hábitos de Salvation · Health · Freedom. Sin relato de enfermedad aguda en la app. Describir inicio, evolución y factores asociados si hay molestia actual.'
        : 'Patient on Salvation · Health · Freedom habit follow-up. No acute illness narrative in the app. Describe onset, course, and related factors if currently symptomatic.'
    ),
    currentSymptoms: fill(
      cur.proximate.currentSymptoms,
      es
        ? 'Síntomas no declarados en la app. Liste síntomas actuales (localización, intensidad, tiempo).'
        : 'No symptoms declared in the app. List current symptoms (location, intensity, time course).'
    ),
    currentSleep: fill(cur.proximate.currentSleep, sleepText),
    currentActivity: fill(cur.proximate.currentActivity, activityText),
    currentNutrition: fill(cur.proximate.currentNutrition, nutritionText),
    moodStress: fill(
      cur.proximate.moodStress,
      profile.currentFocus?.length
        ? es
          ? `Focos actuales en app: ${profile.currentFocus.join(', ')}. (Estado anímico no medido clínicamente.)`
          : `Current app focus areas: ${profile.currentFocus.join(', ')}. (Mood not clinically measured.)`
        : es
          ? 'Estado anímico no registrado. Describir estrés, ansiedad o ánimo si es relevante.'
          : 'Mood not logged. Describe stress, anxiety, or mood if relevant.'
    ),
    notes: fill(
      cur.proximate.notes,
      es
        ? 'Documento orientativo generado desde datos de la app. No sustituye evaluación médica profesional.'
        : 'Guidance document generated from app data. Does not replace professional medical evaluation.'
    ),
  };

  return saveAnamnesis({
    version: 1,
    updatedAt: new Date().toISOString(),
    remote,
    proximate,
    vitalsSnapshot,
  });
}

export type ReadableAnamnesisOptions = {
  profile: Partial<UserProfile>;
  record?: AnamnesisRecord;
  lang?: 'es' | 'en' | 'pt';
};

/** Documento clínico legible (texto plano / markdown suave). */
export function formatAnamnesisReadable(opts: ReadableAnamnesisOptions): string {
  const lang = opts.lang ?? 'en';
  const es = lang === 'es';
  const profile = opts.profile || {};
  const rec = opts.record || loadAnamnesis();
  const age = profile.birthDate ? calculateAge(profile.birthDate) : null;
  const stage =
    age != null
      ? getLifeStageLabel(getLifeStage(age), lang)
      : '—';
  const r = rec.remote;
  const p = rec.proximate;
  const updated = rec.updatedAt
    ? new Date(rec.updatedAt).toLocaleString(lang === 'pt' ? 'pt-BR' : es ? 'es' : 'en')
    : '—';

  const L = es
    ? {
        title: 'FICHA CLÍNICA · ANAMNESIS',
        subtitle: 'Salvazion — resumen de salud personal (no es historia clínica hospitalaria)',
        id: '1. IDENTIFICACIÓN',
        remote: '2. ANAMNESIS REMOTA',
        prox: '3. ANAMNESIS PRÓXIMA',
        vitals: '4. MÉTRICAS / SIGNOS DESDE LA APP',
        footer:
          'Documento generado en dispositivo del usuario. Compartir solo con profesionales de confianza. No reemplaza evaluación clínica presencial.',
        name: 'Nombre',
        age: 'Edad / etapa',
        sex: 'Sexo',
        loc: 'Ubicación',
        purpose: 'Contexto / propósito',
        app: 'Antecedentes personales patológicos',
        surg: 'Antecedentes quirúrgicos',
        fam: 'Antecedentes familiares',
        all: 'Alergias',
        meds: 'Medicación habitual',
        toxic: 'Hábitos tóxicos',
        occ: 'Ocupación',
        act: 'Actividad física habitual',
        gyn: 'Antecedentes gineco-obstétricos',
        other: 'Otros',
        cc: 'Motivo de consulta',
        hpi: 'Enfermedad actual',
        sx: 'Síntomas actuales',
        sleep: 'Sueño actual',
        actNow: 'Actividad reciente',
        nutr: 'Alimentación e hidratación',
        mood: 'Ánimo / estrés',
        notes: 'Notas',
        empty: '—',
        updated: 'Actualizado',
      }
    : {
        title: 'CLINICAL RECORD · ANAMNESIS',
        subtitle:
          'Salvazion — personal health summary (not a hospital EHR chart)',
        id: '1. IDENTIFICATION',
        remote: '2. REMOTE ANAMNESIS (PAST HISTORY)',
        prox: '3. PROXIMATE ANAMNESIS (PRESENT)',
        vitals: '4. APP METRICS / VITALS SNAPSHOT',
        footer:
          'Generated on the user device. Share only with trusted clinicians. Does not replace in-person clinical evaluation.',
        name: 'Name',
        age: 'Age / stage',
        sex: 'Sex',
        loc: 'Location',
        purpose: 'Context / purpose',
        app: 'Past medical history',
        surg: 'Surgical history',
        fam: 'Family history',
        all: 'Allergies',
        meds: 'Current medications',
        toxic: 'Toxic habits',
        occ: 'Occupation',
        act: 'Usual physical activity',
        gyn: 'Gynecologic / obstetric history',
        other: 'Other',
        cc: 'Chief complaint',
        hpi: 'History of present illness',
        sx: 'Current symptoms',
        sleep: 'Current sleep',
        actNow: 'Recent activity',
        nutr: 'Nutrition & hydration',
        mood: 'Mood / stress',
        notes: 'Notes',
        empty: '—',
        updated: 'Updated',
      };

  const line = (label: string, value: string) =>
    `${label}:\n${(value || '').trim() || L.empty}\n`;

  const blocks = [
    L.title,
    L.subtitle,
    `${L.updated}: ${updated}`,
    '',
    L.id,
    '────────────',
    `${L.name}: ${profile.name || L.empty}`,
    `${L.age}: ${age != null ? `${age} · ${stage}` : L.empty}`,
    `${L.sex}: ${profile.sex || L.empty}`,
    `${L.loc}: ${[profile.city, profile.country].filter(Boolean).join(', ') || L.empty}`,
    profile.purpose ? `${L.purpose}: ${profile.purpose}` : null,
    '',
    L.remote,
    '────────────',
    line(L.app, r.personalHistory),
    line(L.surg, r.surgicalHistory),
    line(L.fam, r.familyHistory),
    line(L.all, r.allergies),
    line(L.meds, r.medications),
    line(L.toxic, r.toxicHabits),
    line(L.occ, r.occupation),
    line(L.act, r.physicalActivity),
    profile.sex === 'female' ? line(L.gyn, r.gynObstetric) : null,
    line(L.other, r.otherRemote),
    L.prox,
    '────────────',
    line(L.cc, p.chiefComplaint),
    line(L.hpi, p.presentIllness),
    line(L.sx, p.currentSymptoms),
    line(L.sleep, p.currentSleep),
    line(L.actNow, p.currentActivity),
    line(L.nutr, p.currentNutrition),
    line(L.mood, p.moodStress),
    line(L.notes, p.notes),
    L.vitals,
    '────────────',
    rec.vitalsSnapshot?.trim() || L.empty,
    '',
    L.footer,
  ];

  return blocks.filter((b) => b != null).join('\n');
}

export async function shareOrCopyAnamnesisText(
  text: string,
  filename = `salvazion-anamnesis-${new Date().toISOString().slice(0, 10)}.txt`
): Promise<'shared' | 'downloaded' | 'copied' | 'failed'> {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      const file = new File([text], filename, { type: 'text/plain' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Anamnesis Salvazion',
          text: text.slice(0, 200),
        });
        return 'shared';
      }
      await navigator.share({ title: 'Anamnesis Salvazion', text });
      return 'shared';
    }
  } catch {
    /* fall through */
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    /* ignore */
  }
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
