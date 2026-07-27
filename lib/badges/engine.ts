/**
 * Gamificación Salvazion — Insignias de virtud y constancia
 * No es dopamina vacía: cada insignia refleja disciplina real.
 */

import { computeScores } from '@/lib/scoring/engine';
import { loadSleepLog, loadHydrationLog } from '@/lib/health/biomarkers';
import { loadSports, loadSessions } from '@/lib/health/sports';
import { loadEvents } from '@/lib/calendar/engine';
import { loadReadingProgress } from '@/lib/bible/engine';

export type BadgeCategory = 'salvation' | 'health' | 'freedom' | 'streak' | 'discipline' | 'special';

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  /** Emoji fallback (accesibilidad / legacy) */
  icon: string;
  /** Icono de marca Imagine — estilo Salvazion HUD */
  iconSrc: string;
  category: BadgeCategory;
  /** Condición legible */
  requirement: string;
}

/** Ruta pública del icono de insignia */
export function badgeIconSrc(id: string): string {
  return `/icons/badges/${id}.jpg`;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}

const STORAGE_BADGES = 'salvazion_badges';

function b(
  partial: Omit<BadgeDef, 'iconSrc'> & { id: string }
): BadgeDef {
  return { ...partial, iconSrc: badgeIconSrc(partial.id) };
}

export const BADGE_CATALOG: BadgeDef[] = [
  // Salvation
  b({
    id: 'first_devotional',
    name: 'Primera Palabra',
    description: 'Completaste tu primer Devocional.',
    icon: '✝️',
    category: 'salvation',
    requirement: '1 devocional completado',
  }),
  b({
    id: 'bible_reader',
    name: 'Lector Fiel',
    description: 'Has leído 5 capítulos de la Biblia.',
    icon: '📖',
    category: 'salvation',
    requirement: '5 capítulos leídos',
  }),
  b({
    id: 'salvation_50',
    name: 'Alma Despierta',
    description: 'Alcanzaste 50 en Salvation en un día.',
    icon: '🔥',
    category: 'salvation',
    requirement: 'Salvation ≥ 50 en un día',
  }),
  b({
    id: 'salvation_100',
    name: 'Firme en la Roca',
    description: 'Alcanzaste 100 en Salvation en un día.',
    icon: '🪨',
    category: 'salvation',
    requirement: 'Salvation ≥ 100 en un día',
  }),

  // Health
  b({
    id: 'first_movement',
    name: 'Cuerpo en Movimiento',
    description: 'Registraste tu primera sesión de ejercicio o deporte.',
    icon: '⚡',
    category: 'health',
    requirement: '1 acción de movimiento',
  }),
  b({
    id: 'sun_walker',
    name: 'Hijo del Sol',
    description: '3 días con aire libre / sol registrados.',
    icon: '☀️',
    category: 'health',
    requirement: '3 registros outdoor/sol',
  }),
  b({
    id: 'hydration_hero',
    name: 'Templo Hidratado',
    description: 'Completaste la meta de hidratación 3 días.',
    icon: '💧',
    category: 'health',
    requirement: '3 días de hidratación completa',
  }),
  b({
    id: 'sleep_guardian',
    name: 'Guardián del Sueño',
    description: '5 registros de sueño circadiano.',
    icon: '🌙',
    category: 'health',
    requirement: '5 noches registradas',
  }),
  b({
    id: 'athlete',
    name: 'Atleta de la Phalanx',
    description: '10 sesiones de deporte registradas.',
    icon: '🏟️',
    category: 'health',
    requirement: '10 sesiones de deporte',
  }),

  // Freedom
  b({
    id: 'first_learn',
    name: 'Mente Despierta',
    description: 'Completaste tu primera acción de aprendizaje.',
    icon: '📚',
    category: 'freedom',
    requirement: '1 acción Freedom de aprendizaje',
  }),
  b({
    id: 'connector',
    name: 'Tejido Vivo',
    description: '3 conexiones reales (familia / fe).',
    icon: '🤝',
    category: 'freedom',
    requirement: '3 conexiones reales',
  }),

  // Streaks
  b({
    id: 'streak_3',
    name: 'Tres Días Firme',
    description: 'Racha de 3 días en cualquier pilar.',
    icon: '3️⃣',
    category: 'streak',
    requirement: 'Racha ≥ 3',
  }),
  b({
    id: 'streak_7',
    name: 'Semana de Virtud',
    description: 'Racha de 7 días en cualquier pilar.',
    icon: '7️⃣',
    category: 'streak',
    requirement: 'Racha ≥ 7',
  }),
  b({
    id: 'streak_30',
    name: 'Mes de Constancia',
    description: 'Racha de 30 días en cualquier pilar.',
    icon: '📅',
    category: 'streak',
    requirement: 'Racha ≥ 30',
  }),

  // Discipline / Calendar
  b({
    id: 'day_complete',
    name: 'Día Ordenado',
    description: 'Completaste todas las disciplinas de un día en el calendario.',
    icon: '✅',
    category: 'discipline',
    requirement: '100% del día en calendario',
  }),
  b({
    id: 'disciplined_7',
    name: 'Siete Días de Orden',
    description: '7 eventos de calendario marcados como cumplidos.',
    icon: '🦁',
    category: 'discipline',
    requirement: '7 disciplinas cumplidas',
  }),

  // Special
  b({
    id: 'global_70',
    name: 'Equilibrio Vivo',
    description: 'Salvazion Score Global ≥ 70.',
    icon: '⚖️',
    category: 'special',
    requirement: 'Global ≥ 70',
  }),
  b({
    id: 'global_90',
    name: 'Excelencia de la Phalanx',
    description: 'Salvazion Score Global ≥ 90.',
    icon: '👑',
    category: 'special',
    requirement: 'Global ≥ 90',
  }),
  b({
    id: 'lion_oath',
    name: 'Juramento del León',
    description: 'Aceptaste al León Verde como coach.',
    icon: '🦁',
    category: 'special',
    requirement: 'Onboarding completado',
  }),
];

export function loadEarned(): EarnedBadge[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_BADGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEarned(list: EarnedBadge[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_BADGES, JSON.stringify(list));
}

export function hasBadge(badgeId: string): boolean {
  return loadEarned().some(b => b.badgeId === badgeId);
}

/** Evalúa todas las condiciones y otorga insignias nuevas. Devuelve las recién ganadas. */
export function evaluateBadges(opts?: { onboardingCompleted?: boolean }): BadgeDef[] {
  const earned = loadEarned();
  const earnedIds = new Set(earned.map(e => e.badgeId));
  const newly: BadgeDef[] = [];

  const scores = computeScores();
  const actions = typeof window !== 'undefined' ? (() => {
    try {
      return JSON.parse(localStorage.getItem('salvazion_actions') || '[]');
    } catch {
      return [];
    }
  })() : [];

  const countType = (type: string) => actions.filter((a: { type: string }) => a.type === type).length;
  const countPillar = (pillar: string) => actions.filter((a: { pillar: string }) => a.pillar === pillar).length;

  const sleepLog = loadSleepLog();
  const hydrationDays = loadHydrationLog().filter(h => h.glasses >= h.goal).length;
  const sportSessions = loadSessions().length;
  const calendarDone = loadEvents().filter(e => e.completed).length;
  const bibleChapters = loadReadingProgress().length;

  const maxStreak = Math.max(
    scores.streaks.salvation,
    scores.streaks.health,
    scores.streaks.freedom
  );

  // Check day complete (any day with all events done and at least 1 event)
  const byDate: Record<string, { total: number; done: number }> = {};
  for (const e of loadEvents()) {
    if (!byDate[e.date]) byDate[e.date] = { total: 0, done: 0 };
    byDate[e.date].total++;
    if (e.completed) byDate[e.date].done++;
  }
  const anyDayComplete = Object.values(byDate).some(d => d.total > 0 && d.done === d.total);

  const checks: Record<string, boolean> = {
    first_devotional: countType('devotional_complete') >= 1,
    bible_reader: bibleChapters >= 5 || countType('bible_chapter') >= 5,
    salvation_50: scores.salvation >= 50 || scores.raw.salvation >= 50,
    salvation_100: scores.salvation >= 100,
    first_movement:
      countType('hit_15min') + countType('outdoor_sun_20min') + sportSessions >= 1,
    sun_walker: countType('outdoor_sun_20min') >= 3,
    hydration_hero: hydrationDays >= 3,
    sleep_guardian: sleepLog.length >= 5,
    athlete: sportSessions >= 10,
    first_learn:
      countType('learn_article_video') + countType('learn_lesson') >= 1,
    connector: countType('connect_real') >= 3,
    streak_3: maxStreak >= 3,
    streak_7: maxStreak >= 7,
    streak_30: maxStreak >= 30,
    day_complete: anyDayComplete,
    disciplined_7: calendarDone >= 7,
    global_70: scores.global >= 70,
    global_90: scores.global >= 90,
    lion_oath: !!opts?.onboardingCompleted || earnedIds.has('lion_oath'),
  };

  // Also grant lion_oath from profile if needed
  if (typeof window !== 'undefined') {
    try {
      const profile = JSON.parse(localStorage.getItem('salvazion_profile') || '{}');
      if (profile.hasAcceptedLionCoach || profile.onboardingCompleted) {
        checks.lion_oath = true;
      }
    } catch {}
  }

  for (const badge of BADGE_CATALOG) {
    if (earnedIds.has(badge.id)) continue;
    if (checks[badge.id]) {
      earned.push({ badgeId: badge.id, earnedAt: new Date().toISOString() });
      newly.push(badge);
    }
  }

  if (newly.length > 0) {
    saveEarned(earned);
  }

  return newly;
}

export function getBadgeDef(id: string): BadgeDef | undefined {
  return BADGE_CATALOG.find(b => b.id === id);
}

export function getEarnedBadgesDetailed(): (BadgeDef & { earnedAt: string })[] {
  const earned = loadEarned();
  return earned
    .map(e => {
      const def = getBadgeDef(e.badgeId);
      if (!def) return null;
      return { ...def, earnedAt: e.earnedAt };
    })
    .filter(Boolean) as (BadgeDef & { earnedAt: string })[];
}

export function getBadgeProgress(): { earned: number; total: number } {
  return { earned: loadEarned().length, total: BADGE_CATALOG.length };
}
