/**
 * Ficha clínica interoperable FHIR R4 (export / share).
 * Bundle tipo collection con Patient + Observations + Composition.
 * No es EHR hospitalario: resumen de salud personal Salvazion.
 */

import type { UserProfile } from '@/lib/types';
import { computeBiomarkerReport, type BiomarkerReport } from './sensor-biomarkers';
import { loadDayIndicators } from './phone-sensors';
import { getTodaySleep, getTodayHydration, loadSleepLog } from './biomarkers';
import { getCycleSnapshot, loadCycleLogs } from './cycle';
import { loadSports, sportProgress } from './sports';
import { getCurrentHealthStage } from './engine';

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'collection' | 'document';
  id: string;
  timestamp: string;
  meta: {
    lastUpdated: string;
    tag: { system: string; code: string; display: string }[];
  };
  entry: { fullUrl: string; resource: Record<string, unknown> }[];
}

function uid(): string {
  return `salv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function patientResource(profile: Partial<UserProfile>, patientId: string) {
  const name = (profile.name || 'Usuario Salvazion').trim();
  const parts = name.split(/\s+/);
  return {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
    active: true,
    name: [
      {
        use: 'usual',
        text: name,
        family: parts.length > 1 ? parts.slice(-1)[0] : name,
        given: parts.length > 1 ? parts.slice(0, -1) : [name],
      },
    ],
    gender:
      profile.sex === 'female'
        ? 'female'
        : profile.sex === 'male'
          ? 'male'
          : 'unknown',
    birthDate: profile.birthDate || undefined,
    address: profile.city || profile.country
      ? [
          {
            use: 'home',
            city: profile.city || undefined,
            country: profile.country || undefined,
          },
        ]
      : undefined,
    extension: [
      {
        url: 'https://salvazion.app/fhir/StructureDefinition/life-purpose',
        valueString: profile.purpose || '',
      },
    ],
  };
}

function observationFromBiomarker(
  bm: BiomarkerReport['biomarkers'][0],
  patientId: string,
  obsId: string,
  date: string
) {
  return {
    resourceType: 'Observation',
    id: obsId,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'activity',
            display: 'Activity',
          },
        ],
      },
    ],
    code: {
      coding: bm.loinc
        ? [
            {
              system: 'http://loinc.org',
              code: bm.loinc,
              display: bm.labelEn,
            },
          ]
        : [
            {
              system: 'https://salvazion.app/fhir/CodeSystem/biomarkers',
              code: bm.id,
              display: bm.labelEn,
            },
          ],
      text: bm.labelEs,
    },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: `${date}T12:00:00Z`,
    valueQuantity:
      bm.score != null
        ? {
            value: bm.score,
            unit: bm.unit || 'score',
            system: 'http://unitsofmeasure.org',
            code: '{score}',
          }
        : undefined,
    valueString: bm.score == null ? bm.display : undefined,
    note: [{ text: bm.tipEs }],
    component: [
      {
        code: { text: 'status' },
        valueString: bm.status,
      },
      {
        code: { text: 'source' },
        valueString: bm.source,
      },
      {
        code: { text: 'display' },
        valueString: bm.display,
      },
    ],
  };
}

function sleepObservation(patientId: string, obsId: string) {
  const sleep = getTodaySleep();
  if (!sleep) return null;
  return {
    resourceType: 'Observation',
    id: obsId,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'activity',
            display: 'Activity',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '93832-4',
          display: 'Sleep duration',
        },
      ],
      text: 'Duración del sueño',
    },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: `${sleep.date}T12:00:00Z`,
    valueQuantity: {
      value: Math.round((sleep.durationMinutes / 60) * 10) / 10,
      unit: 'h',
      system: 'http://unitsofmeasure.org',
      code: 'h',
    },
    component: [
      { code: { text: 'bedTime' }, valueString: sleep.bedTime },
      { code: { text: 'wakeTime' }, valueString: sleep.wakeTime },
    ],
  };
}

function cycleObservation(patientId: string, obsId: string, isFemale: boolean) {
  if (!isFemale) return null;
  const snap = getCycleSnapshot('es');
  if (snap.phase === 'unknown' && !snap.settings.lastPeriodStart) return null;
  return {
    resourceType: 'Observation',
    id: obsId,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'survey',
            display: 'Survey',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '92608-8',
          display: 'Menstrual status',
        },
      ],
      text: 'Ciclo menstrual',
    },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: new Date().toISOString(),
    valueString: snap.phase,
    component: [
      {
        code: { text: 'dayInCycle' },
        valueInteger: snap.dayInCycle ?? undefined,
      },
      {
        code: { text: 'cycleLength' },
        valueInteger: snap.cycleLength,
      },
      {
        code: { text: 'lastPeriodStart' },
        valueString: snap.settings.lastPeriodStart || '',
      },
      {
        code: { text: 'nextPeriodEstimate' },
        valueString: snap.nextPeriodEstimate || '',
      },
    ],
  };
}

/**
 * Genera Bundle FHIR R4 con resumen clínico personal.
 */
export function buildFhirClinicalSummary(
  profile: Partial<UserProfile>
): FhirBundle {
  const patientId = uid();
  const bundleId = uid();
  const isFemale = profile.sex === 'female';
  const day = loadDayIndicators();
  const report = computeBiomarkerReport({ isFemale, day });
  const stage = getCurrentHealthStage();
  const hydration = getTodayHydration(stage);
  const sports = loadSports();
  const timestamp = new Date().toISOString();

  const entries: FhirBundle['entry'] = [];

  entries.push({
    fullUrl: `urn:uuid:${patientId}`,
    resource: patientResource(profile, patientId) as Record<string, unknown>,
  });

  const compositionId = uid();
  entries.push({
    fullUrl: `urn:uuid:${compositionId}`,
    resource: {
      resourceType: 'Composition',
      id: compositionId,
      status: 'final',
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '11503-0',
            display: 'Medical records',
          },
        ],
        text: 'Salvazion Clinical Summary',
      },
      subject: { reference: `Patient/${patientId}` },
      date: timestamp,
      title: 'Ficha clínica Salvazion (FHIR R4)',
      author: [{ display: 'Salvazion Health Hub' }],
      section: [
        {
          title: 'Biomarcadores',
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">Índice compuesto: ${report.compositeScore}/100. ${report.highlights.map((h) => h.es).join(' ')}</div>`,
          },
        },
        {
          title: 'Sensores del día',
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">Pasos: ${day.steps}. Activos: ${day.activeMinutes} min. Exterior: ${day.outdoorMinutes} min. Distancia: ${(day.distanceMeters / 1000).toFixed(2)} km.</div>`,
          },
        },
      ],
    },
  });

  for (const bm of report.biomarkers) {
    const obsId = uid();
    entries.push({
      fullUrl: `urn:uuid:${obsId}`,
      resource: observationFromBiomarker(bm, patientId, obsId, report.date) as Record<
        string,
        unknown
      >,
    });
  }

  const sleepObs = sleepObservation(patientId, uid());
  if (sleepObs) {
    entries.push({
      fullUrl: `urn:uuid:${sleepObs.id}`,
      resource: sleepObs as Record<string, unknown>,
    });
  }

  const cycleObs = cycleObservation(patientId, uid(), isFemale);
  if (cycleObs) {
    entries.push({
      fullUrl: `urn:uuid:${cycleObs.id}`,
      resource: cycleObs as Record<string, unknown>,
    });
  }

  // Hidratación
  const hydId = uid();
  entries.push({
    fullUrl: `urn:uuid:${hydId}`,
    resource: {
      resourceType: 'Observation',
      id: hydId,
      status: 'final',
      code: {
        coding: [
          {
            system: 'https://salvazion.app/fhir/CodeSystem/biomarkers',
            code: 'hydration_glasses',
            display: 'Hydration glasses',
          },
        ],
        text: 'Hidratación (vasos)',
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: `${hydration.date}T12:00:00Z`,
      valueQuantity: {
        value: hydration.glasses,
        unit: 'glasses',
        system: 'http://unitsofmeasure.org',
        code: '{glasses}',
      },
      note: [{ text: `Meta: ${hydration.goal} vasos (~${hydration.goal * 250} ml)` }],
    },
  });

  // Deportes como observaciones de actividad
  for (const s of sports.slice(0, 8)) {
    const sid = uid();
    const progress = sportProgress(s);
    entries.push({
      fullUrl: `urn:uuid:${sid}`,
      resource: {
        resourceType: 'Observation',
        id: sid,
        status: 'final',
        code: {
          text: `Deporte: ${s.name}`,
          coding: [
            {
              system: 'https://salvazion.app/fhir/CodeSystem/sports',
              code: s.id,
              display: s.name,
            },
          ],
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: s.createdAt,
        valueString: `${s.environment} · ${s.frequency}`,
        component: [
          { code: { text: 'sessionsDone' }, valueInteger: progress.done },
          { code: { text: 'sessionsTarget' }, valueInteger: progress.target },
        ],
      },
    });
  }

  // Historial breve de sueño (últimos 7)
  for (const s of loadSleepLog().slice(0, 7)) {
    const sid = uid();
    entries.push({
      fullUrl: `urn:uuid:${sid}`,
      resource: {
        resourceType: 'Observation',
        id: sid,
        status: 'final',
        code: {
          coding: [{ system: 'http://loinc.org', code: '93832-4', display: 'Sleep duration' }],
          text: 'Sueño (histórico)',
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: `${s.date}T12:00:00Z`,
        valueQuantity: {
          value: Math.round((s.durationMinutes / 60) * 10) / 10,
          unit: 'h',
          system: 'http://unitsofmeasure.org',
          code: 'h',
        },
      },
    });
  }

  // Logs de ciclo recientes
  if (isFemale) {
    for (const log of loadCycleLogs().slice(0, 14)) {
      const cid = uid();
      entries.push({
        fullUrl: `urn:uuid:${cid}`,
        resource: {
          resourceType: 'Observation',
          id: cid,
          status: 'final',
          code: {
            coding: [
              { system: 'http://loinc.org', code: '92608-8', display: 'Menstrual status' },
            ],
            text: 'Registro menstrual diario',
          },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: `${log.date}T12:00:00Z`,
          valueString: log.flow,
          component: [
            {
              code: { text: 'symptoms' },
              valueString: (log.symptoms || []).join(','),
            },
            log.notes
              ? { code: { text: 'notes' }, valueString: log.notes }
              : undefined,
          ].filter(Boolean),
        },
      });
    }
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    id: bundleId,
    timestamp,
    meta: {
      lastUpdated: timestamp,
      tag: [
        {
          system: 'https://salvazion.app/fhir/tags',
          code: 'clinical-summary',
          display: 'Salvazion interoperable clinical summary (HL7 FHIR R4)',
        },
      ],
    },
    entry: entries,
  };
}

export function fhirBundleToJson(bundle: FhirBundle, pretty = true): string {
  return JSON.stringify(bundle, null, pretty ? 2 : 0);
}

export async function shareOrDownloadFhir(
  bundle: FhirBundle,
  filename = `salvazion-fhir-${bundle.timestamp.slice(0, 10)}.json`
): Promise<'shared' | 'downloaded' | 'copied' | 'failed'> {
  const text = fhirBundleToJson(bundle);
  const blob = new Blob([text], { type: 'application/fhir+json' });

  try {
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: 'application/fhir+json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Ficha clínica Salvazion (FHIR)',
          text: 'Resumen de salud interoperable HL7 FHIR R4',
        });
        return 'shared';
      }
    }
  } catch {
    // fall through
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      // still offer download
    }
  } catch {
    /* ignore */
  }

  try {
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
