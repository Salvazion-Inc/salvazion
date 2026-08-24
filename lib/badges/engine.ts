/**
 * Gamificación Salvazion — Insignias de virtud y constancia
 * No es dopamina vacía: cada insignia refleja disciplina real.
 */

import { computeScores } from '@/lib/scoring/engine';
import { loadSleepLog, loadHydrationLog, loadNutritionLog } from '@/lib/health/biomarkers';
import { loadSessions } from '@/lib/health/sports';
import { loadEvents } from '@/lib/calendar/engine';
import { loadReadingProgress } from '@/lib/bible/engine';
import { loadBodySessions } from '@/lib/health/body-composition';
import { loadMealPhotos } from '@/lib/health/meal-vision';
import { createClient } from '@/lib/supabase/client';

export type BadgeCategory =
  | 'salvation'
  | 'health'
  | 'freedom'
  | 'streak'
  | 'discipline'
  | 'special';

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
    id: 'bible_scholar',
    name: 'Estudiante de la Escritura',
    description: 'Has leído 30 capítulos de la Biblia.',
    icon: '📜',
    category: 'salvation',
    requirement: '30 capítulos leídos',
  }),
  b({
    id: 'prayer_warrior',
    name: 'Guerrero de Oración',
    description: 'Oraste 7 días distintos (acción de oración).',
    icon: '🙏',
    category: 'salvation',
    requirement: '7 registros de oración',
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
    name: 'Atleta de la Comunidad',
    description: '10 sesiones de deporte registradas.',
    icon: '🏟️',
    category: 'health',
    requirement: '10 sesiones de deporte',
  }),
  b({
    id: 'meal_steward',
    name: 'Mayordomo del Plato',
    description: 'Registraste comidas en 3 días distintos.',
    icon: '🥗',
    category: 'health',
    requirement: '3 días con comida registrada',
  }),
  b({
    id: 'body_temple',
    name: 'Templo Medido',
    description: 'Completaste tu primera composición corporal.',
    icon: '📏',
    category: 'health',
    requirement: '1 análisis de composición corporal',
  }),
  b({
    id: 'health_50',
    name: 'Cuerpo Despierto',
    description: 'Alcanzaste 50 en Health en un día.',
    icon: '💪',
    category: 'health',
    requirement: 'Health ≥ 50 en un día',
  }),
  b({
    id: 'health_100',
    name: 'Templo Firme',
    description: 'Alcanzaste 100 en Health en un día.',
    icon: '🏛️',
    category: 'health',
    requirement: 'Health ≥ 100 en un día',
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
  b({
    id: 'phalanx_builder',
    name: 'Constructor de la Comunidad',
    description: 'Invitaste o aceptaste un vínculo en la Comunidad.',
    icon: '🦁',
    category: 'freedom',
    requirement: '1 conexión Comunidad',
  }),
  b({
    id: 'freedom_50',
    name: 'Mente Libre',
    description: 'Alcanzaste 50 en Freedom en un día.',
    icon: '🕊️',
    category: 'freedom',
    requirement: 'Freedom ≥ 50 en un día',
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
    id: 'streak_14',
    name: 'Dos Semanas de Fuego',
    description: 'Racha de 14 días en cualquier pilar.',
    icon: '🔥',
    category: 'streak',
    requirement: 'Racha ≥ 14',
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
  b({
    id: 'disciplined_30',
    name: 'Orden Establecido',
    description: '30 eventos de calendario marcados como cumplidos.',
    icon: '🗓️',
    category: 'discipline',
    requirement: '30 disciplinas cumplidas',
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
    name: 'Excelencia de la Comunidad',
    description: 'Salvazion Score Global ≥ 90.',
    icon: '👑',
    category: 'special',
    requirement: 'Global ≥ 90',
  }),
  b({
    id: 'points_500',
    name: 'Quinientos de Virtud',
    description: 'Acumulaste 500 puntos a lo largo del camino.',
    icon: '⭐',
    category: 'special',
    requirement: '500 puntos de por vida',
  }),
  b({
    id: 'points_1500',
    name: 'Mil Quinientos Fieles',
    description: 'Acumulaste 1.500 puntos de por vida.',
    icon: '🌟',
    category: 'special',
    requirement: '1.500 puntos de por vida',
  }),
  b({
    id: 'lion_oath',
    name: 'Juramento de Salvazion AI',
    description: 'Aceptaste a Salvazion AI como coach.',
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
  return loadEarned().some((b) => b.badgeId === badgeId);
}

function loadScoreActionsLocal(): { type: string; pillar: string; points: number }[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('salvazion_actions') || '[]');
  } catch {
    return [];
  }
}

function countLinkedProfiles(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const profile = JSON.parse(localStorage.getItem('salvazion_profile') || '{}');
    const family = Array.isArray(profile.familyLinks) ? profile.familyLinks.length : 0;
    const friends = Array.isArray(profile.friendsLinks) ? profile.friendsLinks.length : 0;
    return family + friends;
  } catch {
    return 0;
  }
}

function distinctDaysWithType(
  actions: { type: string; date?: string }[],
  type: string
): number {
  const days = new Set(
    actions
      .filter((a) => a.type === type && a.date)
      .map((a) => a.date as string)
  );
  return days.size;
}

/** Push newly earned badges to Supabase (fire-and-forget safe). */
async function pushBadgesToServer(badgeIds: string[], earnedAt: string) {
  if (!badgeIds.length) return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const rows = badgeIds.map((badge_id) => ({
      user_id: user.id,
      badge_id,
      earned_at: earnedAt,
    }));

    const { error } = await supabase.from('user_badges').upsert(rows, {
      onConflict: 'user_id,badge_id',
      ignoreDuplicates: true,
    });
    if (error) console.error('[Salvazion] user_badges upsert', error);
  } catch (e) {
    console.warn('[Salvazion] pushBadgesToServer failed', e);
  }
}

/**
 * Pull earned badges from Supabase into local cache (multi-device).
 * Call on dashboard / badges mount after login.
 */
export async function syncBadgesFromServer(): Promise<EarnedBadge[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return loadEarned();

    const { data: rows, error } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: true });

    if (error) {
      console.warn('[Salvazion] sync badges failed', error);
      return loadEarned();
    }

    if (!rows?.length) return loadEarned();

    const local = loadEarned();
    const byId = new Map(local.map((e) => [e.badgeId, e]));

    for (const r of rows) {
      const id = r.badge_id as string;
      const at = (r.earned_at as string) || new Date().toISOString();
      const existing = byId.get(id);
      if (!existing) {
        byId.set(id, { badgeId: id, earnedAt: at });
      } else if (at < existing.earnedAt) {
        byId.set(id, { badgeId: id, earnedAt: at });
      }
    }

    const merged = Array.from(byId.values()).sort((a, b) =>
      a.earnedAt.localeCompare(b.earnedAt)
    );
    saveEarned(merged);

    // Push any local-only badges not yet on server
    const serverIds = new Set(rows.map((r) => r.badge_id as string));
    const missing = merged.filter((e) => !serverIds.has(e.badgeId));
    if (missing.length) {
      void pushBadgesToServer(
        missing.map((m) => m.badgeId),
        new Date().toISOString()
      );
    }

    return merged;
  } catch (e) {
    console.warn('[Salvazion] syncBadgesFromServer failed', e);
    return loadEarned();
  }
}

/** Evalúa todas las condiciones y otorga insignias nuevas. Devuelve las recién ganadas. */
export function evaluateBadges(opts?: { onboardingCompleted?: boolean }): BadgeDef[] {
  const earned = loadEarned();
  const earnedIds = new Set(earned.map((e) => e.badgeId));
  const newly: BadgeDef[] = [];

  const scores = computeScores();
  const actions = loadScoreActionsLocal() as {
    type: string;
    pillar: string;
    points: number;
    date?: string;
  }[];

  const countType = (type: string) => actions.filter((a) => a.type === type).length;

  const sleepLog = loadSleepLog();
  const hydrationDays = loadHydrationLog().filter((h) => h.glasses >= h.goal).length;
  const sportSessions = loadSessions().length;
  const calendarDone = loadEvents().filter((e) => e.completed).length;
  const bibleChapters = loadReadingProgress().length;
  const bodySessions = loadBodySessions().filter((s) => s.analysis).length;
  const mealPhotosApplied = loadMealPhotos().filter((m) => m.appliedToLog).length;
  const nutritionDays = loadNutritionLog().filter((n) => n.meals?.length > 0).length;
  const mealDays =
    distinctDaysWithType(actions, 'meal_logged') ||
    Math.max(nutritionDays, mealPhotosApplied > 0 ? 1 : 0);
  const lifetimePoints = actions.reduce((sum, a) => sum + (a.points || 0), 0);
  const linked = countLinkedProfiles();

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
  const anyDayComplete = Object.values(byDate).some(
    (d) => d.total > 0 && d.done === d.total
  );

  const checks: Record<string, boolean> = {
    first_devotional: countType('devotional_complete') >= 1,
    bible_reader: bibleChapters >= 5 || countType('bible_chapter') >= 5,
    bible_scholar: bibleChapters >= 30 || countType('bible_chapter') >= 30,
    prayer_warrior: countType('pray_5min') >= 7,
    salvation_50: scores.salvation >= 50 || scores.raw.salvation >= 50,
    salvation_100: scores.salvation >= 100,
    first_movement:
      countType('hit_15min') + countType('outdoor_sun_20min') + sportSessions >= 1,
    sun_walker: countType('outdoor_sun_20min') >= 3,
    hydration_hero: hydrationDays >= 3,
    sleep_guardian: sleepLog.length >= 5,
    athlete: sportSessions >= 10,
    meal_steward: mealDays >= 3,
    body_temple: bodySessions >= 1 || countType('body_composition') >= 1,
    health_50: scores.health >= 50 || scores.raw.health >= 50,
    health_100: scores.health >= 100,
    first_learn:
      countType('learn_article_video') + countType('learn_lesson') >= 1,
    connector: countType('connect_real') >= 3,
    phalanx_builder: countType('phalanx_connect') >= 1 || linked >= 1,
    freedom_50: scores.freedom >= 50 || scores.raw.freedom >= 50,
    streak_3: maxStreak >= 3,
    streak_7: maxStreak >= 7,
    streak_14: maxStreak >= 14,
    streak_30: maxStreak >= 30,
    day_complete: anyDayComplete,
    disciplined_7: calendarDone >= 7,
    disciplined_30: calendarDone >= 30,
    global_70: scores.global >= 70,
    global_90: scores.global >= 90,
    points_500: lifetimePoints >= 500,
    points_1500: lifetimePoints >= 1500,
    lion_oath: !!opts?.onboardingCompleted || earnedIds.has('lion_oath'),
  };

  // Also grant lion_oath from profile if needed
  if (typeof window !== 'undefined') {
    try {
      const profile = JSON.parse(localStorage.getItem('salvazion_profile') || '{}');
      if (profile.hasAcceptedLionCoach || profile.onboardingCompleted) {
        checks.lion_oath = true;
      }
    } catch {
      /* ignore */
    }
  }

  const earnedAt = new Date().toISOString();
  const newIds: string[] = [];

  for (const badge of BADGE_CATALOG) {
    if (earnedIds.has(badge.id)) continue;
    if (checks[badge.id]) {
      earned.push({ badgeId: badge.id, earnedAt });
      newly.push(badge);
      newIds.push(badge.id);
    }
  }

  if (newly.length > 0) {
    saveEarned(earned);
    void pushBadgesToServer(newIds, earnedAt);
  }

  return newly;
}

export function getBadgeDef(id: string): BadgeDef | undefined {
  return BADGE_CATALOG.find((b) => b.id === id);
}

export function getEarnedBadgesDetailed(): (BadgeDef & { earnedAt: string })[] {
  const earned = loadEarned();
  return earned
    .map((e) => {
      const def = getBadgeDef(e.badgeId);
      if (!def) return null;
      return { ...def, earnedAt: e.earnedAt };
    })
    .filter(Boolean) as (BadgeDef & { earnedAt: string })[];
}

export function getBadgeProgress(): { earned: number; total: number } {
  return { earned: loadEarned().length, total: BADGE_CATALOG.length };
}
