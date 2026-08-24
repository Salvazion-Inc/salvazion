import { Pillar, ScoreAction, DailyScore, StreakState, ComputedScores } from './types';
import { loadProfile, calculateAge, getLifeStage, LifeStage } from '@/lib/store/profile';
import { createClient } from '@/lib/supabase/client';

/** Pesos oficiales del Score Global */
export const WEIGHTS = {
  salvation: 0.40,
  health: 0.35,
  freedom: 0.25,
} as const;

/** Multiplicadores por racha */
export function getStreakMultiplier(days: number): number {
  if (days >= 60) return 2.0;
  if (days >= 30) return 1.8;
  if (days >= 14) return 1.5;
  if (days >= 7) return 1.3;
  if (days >= 3) return 1.15;
  return 1.0;
}

/**
 * Catálogo de puntos base por acción (referencia adulta).
 * Se ajustan según etapa de vida en getPointsForAction().
 */
export const ACTION_CATALOG: Record<string, { pillar: Pillar; points: number; label: string }> = {
  // Salvation
  bible_chapter: { pillar: 'salvation', points: 12, label: 'Leer 1 capítulo de la Biblia' },
  devotional_complete: { pillar: 'salvation', points: 18, label: 'Completar Devocional del día' },
  pray_5min: { pillar: 'salvation', points: 10, label: 'Orar ≥ 5 minutos' },
  bible_study_15min: { pillar: 'salvation', points: 20, label: 'Estudio bíblico ≥ 15 min' },

  // Health
  hit_15min: { pillar: 'health', points: 22, label: 'HIT / entrenamiento ≥ 15 min' },
  outdoor_sun_20min: { pillar: 'health', points: 15, label: 'Aire libre + sol ≥ 20 min' },
  hydration_daily: { pillar: 'health', points: 8, label: 'Hidratación diaria completada' },
  fasting: { pillar: 'health', points: 12, label: 'Ayuno registrado' },
  sleep_ideal: { pillar: 'health', points: 18, label: 'Sueño dentro de ventana circadiana' },
  cycle_log: { pillar: 'health', points: 10, label: 'Registro de ciclo / salud femenina' },
  /** Primera comida del día (manual o foto → log). 1×/día. */
  meal_logged: { pillar: 'health', points: 10, label: 'Comida registrada (log / foto)' },
  /** Cineantropometría por fotos (Grok Vision). 1×/día. */
  body_composition: { pillar: 'health', points: 12, label: 'Composición corporal registrada' },

  // Freedom
  learn_article_video: { pillar: 'freedom', points: 8, label: 'Artículo o video corto completado' },
  learn_lesson: { pillar: 'freedom', points: 15, label: 'Lección de mini-curso' },
  debate_participate: { pillar: 'freedom', points: 12, label: 'Participar en debate estructurado' },
  connect_real: { pillar: 'freedom', points: 10, label: 'Conexión real (familia/iglesia)' },
  contribute_project: { pillar: 'freedom', points: 20, label: 'Aportar a proyecto o startup' },
  /** Invitar o aceptar vínculo en la Comunidad. 1×/día. */
  phalanx_connect: { pillar: 'freedom', points: 15, label: 'Conexión Comunidad (invitar / aceptar)' },
};

/**
 * Ajuste de puntos base según etapa de vida.
 */
export function getPointsForAction(actionType: string, stage: LifeStage = 'adult'): number {
  const base = ACTION_CATALOG[actionType]?.points ?? 0;
  if (!base) return 0;

  const stageMultiplier: Record<LifeStage, number> = {
    infancia: 1.15,
    juventud: 1.1,
    young_adult: 1.0,
    adult: 1.0,
    mature: 1.05,
    senior: 1.1,
    unknown: 1.0,
  };

  let points = Math.round(base * (stageMultiplier[stage] ?? 1));

  if (stage === 'infancia') {
    if (actionType === 'hit_15min') points = 12;
    if (actionType === 'outdoor_sun_20min') points = 18;
    if (actionType === 'fasting') points = 0;
    if (actionType === 'bible_chapter') points = 14;
    if (actionType === 'connect_real') points = 14;
  }

  if (stage === 'juventud') {
    if (actionType === 'hit_15min') points = 24;
    if (actionType === 'learn_article_video') points = 10;
    if (actionType === 'learn_lesson') points = 18;
    if (actionType === 'debate_participate') points = 14;
  }

  if (stage === 'senior') {
    if (actionType === 'hit_15min') points = 16;
    if (actionType === 'outdoor_sun_20min') points = 20;
    if (actionType === 'sleep_ideal') points = 22;
    if (actionType === 'fasting') points = 10;
  }

  if (stage === 'mature') {
    if (actionType === 'sleep_ideal') points = 20;
    if (actionType === 'connect_real') points = 12;
    if (actionType === 'contribute_project') points = 22;
    if (actionType === 'meal_logged') points = 12;
  }

  if (stage === 'senior') {
    if (actionType === 'meal_logged') points = 12;
    if (actionType === 'body_composition') points = 14;
  }

  if (stage === 'infancia') {
    if (actionType === 'meal_logged') points = 12;
    if (actionType === 'body_composition') points = 0;
    if (actionType === 'phalanx_connect') points = 12;
  }

  return Math.max(0, points);
}

function getCurrentStage(): LifeStage {
  const profile = loadProfile();
  if (!profile?.birthDate) return 'adult';
  const age = calculateAge(profile.birthDate);
  return getLifeStage(age);
}

const STORAGE_ACTIONS = 'salvazion_actions';
const STORAGE_STREAKS = 'salvazion_streaks';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Local storage helpers ───────────────────────────────────

function loadActions(): ScoreAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_ACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveActions(actions: ScoreAction[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_ACTIONS, JSON.stringify(actions));
}

function loadStreaks(): StreakState {
  if (typeof window === 'undefined') {
    return {
      salvation: 0,
      health: 0,
      freedom: 0,
      lastActive: { salvation: null, health: null, freedom: null },
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_STREAKS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    salvation: 0,
    health: 0,
    freedom: 0,
    lastActive: { salvation: null, health: null, freedom: null },
  };
}

function saveStreaks(streaks: StreakState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_STREAKS, JSON.stringify(streaks));
}

function updateStreakLocal(pillar: Pillar, date: string): StreakState {
  const streaks = loadStreaks();
  const last = streaks.lastActive[pillar];

  if (last === date) return streaks;

  if (last) {
    const lastDate = new Date(last);
    const current = new Date(date);
    const diffDays = Math.floor(
      (current.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      streaks[pillar] += 1;
    } else if (diffDays > 1) {
      streaks[pillar] = 1;
    }
  } else {
    streaks[pillar] = 1;
  }

  streaks.lastActive[pillar] = date;
  saveStreaks(streaks);
  return streaks;
}

// ─── Supabase sync ───────────────────────────────────────────

/** Push one action + updated streaks to Supabase (fire-and-forget safe) */
async function pushActionToServer(action: ScoreAction, streaks: StreakState) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Insert action
    const { error: actionErr } = await supabase.from('score_actions').insert({
      user_id: user.id,
      action_type: action.type,
      pillar: action.pillar,
      points: action.points,
      label: action.label,
      action_date: action.date,
      created_at: action.timestamp,
    });
    if (actionErr) console.error('[Salvazion] score_actions insert', actionErr);

    // Upsert streaks
    const { error: streakErr } = await supabase.from('user_streaks').upsert({
      user_id: user.id,
      salvation: streaks.salvation,
      health: streaks.health,
      freedom: streaks.freedom,
      last_active_salvation: streaks.lastActive.salvation,
      last_active_health: streaks.lastActive.health,
      last_active_freedom: streaks.lastActive.freedom,
      updated_at: new Date().toISOString(),
    });
    if (streakErr) console.error('[Salvazion] user_streaks upsert', streakErr);
  } catch (e) {
    console.warn('[Salvazion] pushActionToServer failed', e);
  }
}

/**
 * Pull last N days of actions + streaks from Supabase into local cache.
 * Call on dashboard mount / after login so multi-device weekly charts work.
 */
export async function syncScoresFromServer(
  opts?: { days?: number }
): Promise<ComputedScores> {
  const historyDays = Math.max(1, Math.min(30, opts?.days ?? 7));
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return computeScores();

    const start = new Date();
    start.setDate(start.getDate() - (historyDays - 1));
    const startDate = start.toISOString().slice(0, 10);

    // Multi-day actions for weekly charts across devices
    const { data: rows, error: actionsErr } = await supabase
      .from('score_actions')
      .select('id, action_type, pillar, points, label, action_date, created_at')
      .eq('user_id', user.id)
      .gte('action_date', startDate)
      .order('created_at', { ascending: true });

    if (actionsErr) {
      console.warn('[Salvazion] sync actions failed', actionsErr);
    } else if (rows) {
      const serverActions: ScoreAction[] = rows.map((r) => ({
        id: r.id,
        type: r.action_type,
        pillar: r.pillar as Pillar,
        points: r.points,
        label: r.label,
        timestamp: r.created_at,
        date: r.action_date,
      }));

      const serverIds = new Set(serverActions.map((a) => a.id));
      const serverKeys = new Set(
        serverActions.map((a) => `${a.date}::${a.type}`)
      );

      // Keep local outside the window + pending locals not yet on server
      // (client ids look like "bible_chapter-173…")
      const localAll = loadActions();
      const outsideWindow = localAll.filter((a) => a.date < startDate);
      const pendingLocal = localAll.filter((a) => {
        if (a.date < startDate) return false;
        if (serverIds.has(a.id)) return false;
        // Prefer server as truth when same type+day already exists
        if (serverKeys.has(`${a.date}::${a.type}`)) return false;
        return a.id.includes('-');
      });

      saveActions([...outsideWindow, ...serverActions, ...pendingLocal]);
    }

    // Streaks
    const { data: streakRow, error: streakErr } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!streakErr && streakRow) {
      const streaks: StreakState = {
        salvation: streakRow.salvation ?? 0,
        health: streakRow.health ?? 0,
        freedom: streakRow.freedom ?? 0,
        lastActive: {
          salvation: streakRow.last_active_salvation ?? null,
          health: streakRow.last_active_health ?? null,
          freedom: streakRow.last_active_freedom ?? null,
        },
      };
      saveStreaks(streaks);
    }
  } catch (e) {
    console.warn('[Salvazion] syncScoresFromServer failed', e);
  }

  return computeScores();
}

// ─── Public API (same surface as before) ─────────────────────

/** True if this action type was already scored today (one log per type/day). */
export function hasLoggedActionToday(actionType: string, date = today()): boolean {
  return loadActions().some((a) => a.date === date && a.type === actionType);
}

/** Set of action types already scored on a date (default today). */
export function getLoggedActionTypesToday(date = today()): Set<string> {
  return new Set(
    loadActions().filter((a) => a.date === date).map((a) => a.type)
  );
}

function evaluateBadgesAfterLog(): void {
  // Avoid circular import at module load: badges → scoring.
  void Promise.all([
    import('@/lib/badges/engine'),
    import('@/lib/store/profile'),
  ])
    .then(([{ evaluateBadges }, { loadProfile }]) => {
      const p = loadProfile();
      evaluateBadges({ onboardingCompleted: !!p?.onboardingCompleted });
    })
    .catch(() => {});
}

/**
 * Registra una acción (optimistic local + push a Supabase).
 * At most one score per action type per calendar day (agenda + hub + wearable share truth).
 * Devuelve scores recalculados de inmediato.
 */
export function logAction(actionType: string): ComputedScores | null {
  const catalog = ACTION_CATALOG[actionType];
  if (!catalog) return null;

  const stage = getCurrentStage();
  const points = getPointsForAction(actionType, stage);
  if (points <= 0) return computeScores();

  const date = today();

  // Canonical: one type per day — calendar, Bible hub, Health, Freedom, wearables.
  if (hasLoggedActionToday(actionType, date)) {
    return computeScores();
  }

  const action: ScoreAction = {
    id: `${actionType}-${Date.now()}`,
    type: actionType,
    pillar: catalog.pillar,
    points,
    label: catalog.label,
    timestamp: new Date().toISOString(),
    date,
  };

  const actions = loadActions();
  actions.push(action);
  saveActions(actions);

  const streaks = updateStreakLocal(catalog.pillar, date);

  // Background sync — does not block UI
  pushActionToServer(action, streaks);
  evaluateBadgesAfterLog();

  return computeScores();
}

/**
 * Async variant that waits for the server write.
 * Use when you need guaranteed persistence (e.g. after critical actions).
 */
export async function logActionAsync(actionType: string): Promise<ComputedScores | null> {
  const result = logAction(actionType);
  // logAction already fired the push; we just re-sync to get server ids
  if (result) await syncScoresFromServer();
  return result;
}

/**
 * Calcula los scores actuales desde el cache local.
 * Llama syncScoresFromServer() antes si quieres datos frescos del servidor.
 */
export function computeScores(): ComputedScores {
  const actions = loadActions();
  const streaks = loadStreaks();
  const date = today();

  const todayActions = actions.filter((a) => a.date === date);

  const raw = { salvation: 0, health: 0, freedom: 0 };
  for (const a of todayActions) {
    raw[a.pillar] += a.points;
  }

  const capped = {
    salvation: Math.min(raw.salvation, 100),
    health: Math.min(raw.health, 100),
    freedom: Math.min(raw.freedom, 100),
  };

  const multipliers = {
    salvation: getStreakMultiplier(streaks.salvation),
    health: getStreakMultiplier(streaks.health),
    freedom: getStreakMultiplier(streaks.freedom),
  };

  const salvation = Math.round(Math.min(capped.salvation * multipliers.salvation, 150));
  const health = Math.round(Math.min(capped.health * multipliers.health, 150));
  const freedom = Math.round(Math.min(capped.freedom * multipliers.freedom, 150));

  const globalRaw =
    salvation * WEIGHTS.salvation + health * WEIGHTS.health + freedom * WEIGHTS.freedom;
  const global = Math.round(Math.min(globalRaw, 100));

  return {
    salvation,
    health,
    freedom,
    global,
    raw: capped,
    multipliers,
    streaks,
    todayActions,
  };
}

/** Historial de un día (local) */
export function getDailyScore(date: string): DailyScore {
  const actions = loadActions().filter((a) => a.date === date);
  const raw = { salvation: 0, health: 0, freedom: 0 };
  for (const a of actions) {
    raw[a.pillar] += a.points;
  }
  return { date, ...raw, actions };
}

export type DayProgressPoint = {
  date: string;
  /** Short weekday label key is handled in UI */
  salvation: number;
  health: number;
  freedom: number;
  global: number;
  actionCount: number;
};

/**
 * Last N days of pillar/global progress for charts (local action history).
 * Scores use raw capped points (0–100) without streak multipliers for fair day-to-day comparison.
 */
export function getProgressHistory(days = 7): DayProgressPoint[] {
  const points: DayProgressPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const day = getDailyScore(date);
    const salvation = Math.min(day.salvation, 100);
    const health = Math.min(day.health, 100);
    const freedom = Math.min(day.freedom, 100);
    const global = Math.round(
      Math.min(
        salvation * WEIGHTS.salvation +
          health * WEIGHTS.health +
          freedom * WEIGHTS.freedom,
        100
      )
    );
    points.push({
      date,
      salvation,
      health,
      freedom,
      global,
      actionCount: day.actions.length,
    });
  }
  return points;
}

/** Totals for action mix charts */
export function getActionMixTotals(): {
  salvation: number;
  health: number;
  freedom: number;
  total: number;
} {
  const actions = loadActions();
  const out = { salvation: 0, health: 0, freedom: 0, total: 0 };
  for (const a of actions) {
    out[a.pillar] += a.points;
    out.total += a.points;
  }
  return out;
}

/** Lifetime points from all logged actions (local cache; includes synced server history). */
export function getLifetimePoints(): {
  salvation: number;
  health: number;
  freedom: number;
  total: number;
  actionCount: number;
} {
  const mix = getActionMixTotals();
  return {
    ...mix,
    actionCount: loadActions().length,
  };
}

/** Points earned today (raw sum before pillar cap / streak multipliers). */
export function getTodayPointsRaw(): {
  salvation: number;
  health: number;
  freedom: number;
  total: number;
  actionCount: number;
} {
  const date = today();
  const actions = loadActions().filter((a) => a.date === date);
  const out = { salvation: 0, health: 0, freedom: 0, total: 0, actionCount: actions.length };
  for (const a of actions) {
    out[a.pillar] += a.points;
    out.total += a.points;
  }
  return out;
}

/** Catalog entry for UI previews (label + base points + pillar). */
export function getActionCatalogEntry(
  actionType: string
): { pillar: Pillar; points: number; label: string } | null {
  return ACTION_CATALOG[actionType] ?? null;
}

/**
 * Reset local + borra acciones de hoy y streaks en servidor (si hay sesión).
 * Solo para demo / desarrollo.
 */
export async function resetScores() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_ACTIONS);
    localStorage.removeItem(STORAGE_STREAKS);
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const date = today();
    await supabase
      .from('score_actions')
      .delete()
      .eq('user_id', user.id)
      .eq('action_date', date);

    await supabase.from('user_streaks').upsert({
      user_id: user.id,
      salvation: 0,
      health: 0,
      freedom: 0,
      last_active_salvation: null,
      last_active_health: null,
      last_active_freedom: null,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Salvazion] resetScores server clear failed', e);
  }
}
