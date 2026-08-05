/**
 * Cineantropometría por fotos (frontal / lateral / posterior).
 * Estimaciones con Grok Vision — no es DEXA ni plicometría clínica.
 */

export type BodyPhotoView = 'front' | 'side' | 'back';

export type BodyMassBreakdown = {
  /** kg estimados */
  weightKg: number | null;
  muscleMassKg: number | null;
  boneMassKg: number | null;
  residualMassKg: number | null;
  /** Grasa / tejido subcutáneo (cineantropometría) */
  skinFatMassKg: number | null;
  bodyFatPercent: number | null;
  bmi: number | null;
  somatotypeHint: string | null;
  confidence: 'low' | 'medium' | 'high';
  observations: string;
  recommendations: string;
};

export type BodyCompositionSession = {
  id: string;
  createdAt: string;
  date: string;
  /** Compressed data URLs */
  photos: Partial<Record<BodyPhotoView, string>>;
  /** Optional user-declared metrics for better estimates */
  declaredHeightCm?: number;
  declaredWeightKg?: number;
  analysis: BodyMassBreakdown | null;
  model?: string | null;
  error?: string | null;
};

const STORAGE = 'salvazion_body_composition_v1';
const MAX_SESSIONS = 24;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(): string {
  return `body-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadBodySessions(): BodyCompositionSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw ? (JSON.parse(raw) as BodyCompositionSession[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: BodyCompositionSession[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE, JSON.stringify(list.slice(0, MAX_SESSIONS)));
}

export function saveBodySession(
  session: BodyCompositionSession
): BodyCompositionSession[] {
  const list = loadBodySessions().filter((s) => s.id !== session.id);
  list.unshift(session);
  saveAll(list);
  return list;
}

export function deleteBodySession(id: string): BodyCompositionSession[] {
  const list = loadBodySessions().filter((s) => s.id !== id);
  saveAll(list);
  return list;
}

export function createDraftSession(
  photos: Partial<Record<BodyPhotoView, string>>,
  opts?: { heightCm?: number; weightKg?: number }
): BodyCompositionSession {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    date: today(),
    photos,
    declaredHeightCm: opts?.heightCm,
    declaredWeightKg: opts?.weightKg,
    analysis: null,
  };
}

/** Series for progress charts (weight / muscle / fat over time). */
export function bodyProgressSeries(): {
  date: string;
  weightKg: number | null;
  muscleMassKg: number | null;
  skinFatMassKg: number | null;
  bodyFatPercent: number | null;
}[] {
  return loadBodySessions()
    .filter((s) => s.analysis)
    .slice()
    .reverse()
    .map((s) => ({
      date: s.date,
      weightKg: s.analysis!.weightKg,
      muscleMassKg: s.analysis!.muscleMassKg,
      skinFatMassKg: s.analysis!.skinFatMassKg,
      bodyFatPercent: s.analysis!.bodyFatPercent,
    }));
}
