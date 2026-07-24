/**
 * Deportes que la persona practica (indoor / outdoor)
 * Frecuencia: diaria o semanal
 */

export type SportEnvironment = 'indoor' | 'outdoor';
export type SportFrequency = 'daily' | 'weekly';

export interface UserSport {
  id: string;
  name: string;
  environment: SportEnvironment;
  frequency: SportFrequency;
  targetSessions: number; // por semana si weekly; 1 si daily
  createdAt: string;
}

export interface SportSession {
  id: string;
  sportId: string;
  sportName: string;
  environment: SportEnvironment;
  date: string; // YYYY-MM-DD
  durationMin: number;
  createdAt: string;
}

const STORAGE_SPORTS = 'salvazion_user_sports';
const STORAGE_SESSIONS = 'salvazion_sport_sessions';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadSports(): UserSport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSports(sports: UserSport[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_SPORTS, JSON.stringify(sports));
}

export function addSport(
  name: string,
  environment: SportEnvironment,
  frequency: SportFrequency,
  targetSessions = frequency === 'daily' ? 1 : 3
): UserSport {
  const sport: UserSport = {
    id: uid(),
    name: name.trim(),
    environment,
    frequency,
    targetSessions,
    createdAt: new Date().toISOString()
  };
  const list = loadSports();
  list.push(sport);
  saveSports(list);
  return sport;
}

export function removeSport(id: string) {
  saveSports(loadSports().filter(s => s.id !== id));
}

export function loadSessions(): SportSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logSportSession(
  sport: UserSport,
  durationMin: number,
  date = today()
): SportSession {
  const session: SportSession = {
    id: uid(),
    sportId: sport.id,
    sportName: sport.name,
    environment: sport.environment,
    date,
    durationMin,
    createdAt: new Date().toISOString()
  };
  const all = loadSessions();
  all.push(session);
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(all));
  return session;
}

export function getSessionsForDate(date: string): SportSession[] {
  return loadSessions().filter(s => s.date === date);
}

export function getWeekSessions(sportId: string): SportSession[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // domingo como inicio simple
  start.setHours(0, 0, 0, 0);
  return loadSessions().filter(s => {
    if (s.sportId !== sportId) return false;
    const d = new Date(s.date);
    return d >= start && d <= now;
  });
}

/** ¿Cumplió la meta de frecuencia esta semana / hoy? */
export function sportProgress(sport: UserSport): { done: number; target: number; complete: boolean } {
  if (sport.frequency === 'daily') {
    const todayCount = getSessionsForDate(today()).filter(s => s.sportId === sport.id).length;
    return { done: todayCount, target: 1, complete: todayCount >= 1 };
  }
  const week = getWeekSessions(sport.id);
  return {
    done: week.length,
    target: sport.targetSessions,
    complete: week.length >= sport.targetSessions
  };
}

export const SUGGESTED_SPORTS: { name: string; environment: SportEnvironment }[] = [
  { name: 'Caminata', environment: 'outdoor' },
  { name: 'Running', environment: 'outdoor' },
  { name: 'Ciclismo', environment: 'outdoor' },
  { name: 'Fútbol', environment: 'outdoor' },
  { name: 'Básquet', environment: 'outdoor' },
  { name: 'Natación', environment: 'indoor' },
  { name: 'Gimnasio / pesas', environment: 'indoor' },
  { name: 'CrossFit / HIT', environment: 'indoor' },
  { name: 'Yoga', environment: 'indoor' },
  { name: 'Artes marciales', environment: 'indoor' },
  { name: 'Tenis', environment: 'outdoor' },
  { name: 'Senderismo', environment: 'outdoor' },
];
