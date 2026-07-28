/**
 * Salvazion discipline calendar — Salvation · Health · Freedom
 * Drag-and-drop routine blocks for consistency over time.
 */

export type CalendarPillar = 'salvation' | 'health' | 'freedom';

export type CalendarEventType =
  | 'prayer'
  | 'bible'
  | 'devotional'
  | 'worship'
  | 'meeting'
  | 'sleep'
  | 'nap'
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'outdoor'
  | 'exercise'
  | 'sport'
  | 'gym'
  | 'learn'
  | 'work'
  | 'inspire'
  | 'collaborate'
  | 'congregate'
  | 'church'
  | 'meal'
  | 'meal_window'
  | 'connect'
  | 'contribute'
  | 'custom';

export type AgendaBlockDef = {
  key: string;
  titleKey: string;
  pillar: CalendarPillar;
  type: CalendarEventType;
  /** Default start if none chosen */
  defaultTime: string;
  durationMin: number;
  href?: string;
};

export interface CalendarEvent {
  id: string;
  title: string;
  pillar: CalendarPillar;
  type: CalendarEventType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  durationMin?: number;
  recurring?: 'daily' | 'weekly' | null;
  sportId?: string;
  completed?: boolean;
  completedAt?: string;
  notes?: string;
  /** Template key for i18n (agenda.blocks.*) */
  blockKey?: string;
}

const STORAGE_EVENTS = 'salvazion_calendar_events';

/** Timeline window */
export const DAY_START_MIN = 5 * 60; // 05:00
export const DAY_END_MIN = 24 * 60; // 24:00
export const SNAP_MIN = 15;

export function scoreActionForEventType(type: CalendarEventType): string | null {
  switch (type) {
    case 'prayer':
      return 'pray_5min';
    case 'bible':
      return 'bible_chapter';
    case 'devotional':
      return 'devotional_complete';
    case 'worship':
    case 'meeting':
    case 'congregate':
    case 'church':
    case 'connect':
      return 'connect_real';
    case 'exercise':
    case 'sport':
    case 'gym':
      return 'hit_15min';
    case 'outdoor':
      return 'outdoor_sun_20min';
    case 'breakfast':
    case 'lunch':
    case 'dinner':
    case 'meal':
    case 'meal_window':
      return 'hydration_daily';
    case 'sleep':
    case 'nap':
      return 'sleep_ideal';
    case 'learn':
    case 'inspire':
      return 'learn_article_video';
    case 'work':
    case 'collaborate':
    case 'contribute':
      return 'contribute_project';
    default:
      return null;
  }
}

/**
 * Predetermined routine blocks — three pillars / three colors.
 */
export const ROUTINE_BLOCKS: AgendaBlockDef[] = [
  // Salvation
  { key: 'pray', titleKey: 'agenda.blocks.pray', pillar: 'salvation', type: 'prayer', defaultTime: '06:15', durationMin: 15, href: '/hub/bible' },
  { key: 'bible', titleKey: 'agenda.blocks.bible', pillar: 'salvation', type: 'bible', defaultTime: '06:30', durationMin: 20, href: '/hub/bible' },
  { key: 'devotional', titleKey: 'agenda.blocks.devotional', pillar: 'salvation', type: 'devotional', defaultTime: '07:00', durationMin: 15, href: '/hub/devotional' },
  { key: 'worship', titleKey: 'agenda.blocks.worship', pillar: 'salvation', type: 'worship', defaultTime: '10:00', durationMin: 90 },
  { key: 'meeting', titleKey: 'agenda.blocks.meeting', pillar: 'salvation', type: 'meeting', defaultTime: '19:00', durationMin: 60 },
  // Health
  { key: 'sleep', titleKey: 'agenda.blocks.sleep', pillar: 'health', type: 'sleep', defaultTime: '22:30', durationMin: 480, href: '/hub/health' },
  { key: 'nap', titleKey: 'agenda.blocks.nap', pillar: 'health', type: 'nap', defaultTime: '14:00', durationMin: 25, href: '/hub/health' },
  { key: 'breakfast', titleKey: 'agenda.blocks.breakfast', pillar: 'health', type: 'breakfast', defaultTime: '08:00', durationMin: 30, href: '/hub/health' },
  { key: 'lunch', titleKey: 'agenda.blocks.lunch', pillar: 'health', type: 'lunch', defaultTime: '13:00', durationMin: 40, href: '/hub/health' },
  { key: 'dinner', titleKey: 'agenda.blocks.dinner', pillar: 'health', type: 'dinner', defaultTime: '19:30', durationMin: 40, href: '/hub/health' },
  { key: 'outdoor', titleKey: 'agenda.blocks.outdoor', pillar: 'health', type: 'outdoor', defaultTime: '12:00', durationMin: 30, href: '/hub/health' },
  { key: 'exercise', titleKey: 'agenda.blocks.exercise', pillar: 'health', type: 'exercise', defaultTime: '07:30', durationMin: 30, href: '/hub/health' },
  { key: 'sport', titleKey: 'agenda.blocks.sport', pillar: 'health', type: 'sport', defaultTime: '17:00', durationMin: 60, href: '/hub/health' },
  { key: 'gym', titleKey: 'agenda.blocks.gym', pillar: 'health', type: 'gym', defaultTime: '18:00', durationMin: 60, href: '/hub/health' },
  // Freedom
  { key: 'learn', titleKey: 'agenda.blocks.learn', pillar: 'freedom', type: 'learn', defaultTime: '20:00', durationMin: 30, href: '/hub/freedom' },
  { key: 'work', titleKey: 'agenda.blocks.work', pillar: 'freedom', type: 'work', defaultTime: '09:00', durationMin: 180 },
];

/** @deprecated use ROUTINE_BLOCKS */
export const DAILY_AGENDA_BLOCKS = ROUTINE_BLOCKS;

function uid(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function loadEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_EVENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: CalendarEvent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events));
}

export function getEventsForDate(date: string): CalendarEvent[] {
  return loadEvents()
    .filter((e) => e.date === date)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}

export function getEventsInRange(start: string, end: string): CalendarEvent[] {
  return loadEvents().filter((e) => e.date >= start && e.date <= end);
}

export function addEvent(
  partial: Omit<CalendarEvent, 'id' | 'completed'>
): CalendarEvent {
  const event: CalendarEvent = {
    ...partial,
    id: uid(),
    completed: false,
  };
  const all = loadEvents();
  all.push(event);
  saveEvents(all);
  return event;
}

export function toggleEventComplete(id: string): CalendarEvent | null {
  const all = loadEvents();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const done = !all[idx].completed;
  all[idx] = {
    ...all[idx],
    completed: done,
    completedAt: done ? new Date().toISOString() : undefined,
  };
  saveEvents(all);
  return all[idx];
}

export function removeEvent(id: string) {
  saveEvents(loadEvents().filter((e) => e.id !== id));
}

export function updateEvent(
  id: string,
  patch: Partial<Omit<CalendarEvent, 'id'>>
): CalendarEvent | null {
  const all = loadEvents();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch };
  saveEvents(all);
  return all[idx];
}

export function eventTitleKey(ev: CalendarEvent): string | null {
  if (ev.notes?.startsWith('agenda.blocks.')) return ev.notes;
  if (ev.blockKey) {
    const def = ROUTINE_BLOCKS.find((b) => b.key === ev.blockKey);
    if (def) return def.titleKey;
  }
  const def = ROUTINE_BLOCKS.find((b) => b.type === ev.type || b.key === ev.title);
  return def?.titleKey ?? null;
}

export function getBlockDef(keyOrType: string): AgendaBlockDef | undefined {
  return (
    ROUTINE_BLOCKS.find((b) => b.key === keyOrType) ||
    ROUTINE_BLOCKS.find((b) => b.type === keyOrType)
  );
}

/** Place a palette block onto a day at a given time */
export function placeBlock(
  date: string,
  blockKey: string,
  time?: string
): CalendarEvent | null {
  const def = getBlockDef(blockKey);
  if (!def) return null;
  return addEvent({
    title: def.key,
    pillar: def.pillar,
    type: def.type,
    date,
    time: time || def.defaultTime,
    durationMin: def.durationMin,
    recurring: null,
    notes: def.titleKey,
    blockKey: def.key,
  });
}

/** Move event to new time (HH:mm), snapped */
export function moveEventToTime(id: string, time: string): CalendarEvent | null {
  return updateEvent(id, { time: snapTime(time) });
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - SNAP_MIN, total));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function snapMinutes(min: number): number {
  return Math.round(min / SNAP_MIN) * SNAP_MIN;
}

export function snapTime(time: string): string {
  return minutesToTime(snapMinutes(timeToMinutes(time)));
}

/** Clear all events on a date */
export function clearDay(date: string): void {
  saveEvents(loadEvents().filter((e) => e.date !== date));
}

/**
 * Copy routine from one day to another (replaces target day).
 * Completions are reset so the new day is a fresh routine.
 */
export function duplicateDay(fromDate: string, toDate: string): number {
  if (fromDate === toDate) return 0;
  const src = getEventsForDate(fromDate);
  const all = loadEvents().filter((e) => e.date !== toDate);
  for (const e of src) {
    all.push({
      ...e,
      id: uid(),
      date: toDate,
      completed: false,
      completedAt: undefined,
    });
  }
  saveEvents(all);
  return src.length;
}

/** Copy selected day onto the next day */
export function duplicateToTomorrow(fromDate: string): number {
  return duplicateDay(fromDate, addDays(fromDate, 1));
}

/**
 * Copy selected day onto the next 6 days (build a full week of the same routine).
 */
export function duplicateToWeek(fromDate: string): number {
  let n = 0;
  for (let i = 1; i <= 6; i++) {
    n += duplicateDay(fromDate, addDays(fromDate, i));
  }
  return n;
}

export function getDisciplineTemplates(): Omit<CalendarEvent, 'id' | 'date' | 'completed'>[] {
  return ROUTINE_BLOCKS.map((b) => ({
    title: b.key,
    pillar: b.pillar,
    type: b.type,
    time: b.defaultTime,
    durationMin: b.durationMin,
    recurring: 'daily' as const,
    notes: b.titleKey,
    blockKey: b.key,
  }));
}

/** Do not auto-flood the day — empty until user places blocks */
export function ensureDayAgenda(date: string): CalendarEvent[] {
  return getEventsForDate(date);
}

export function ensureDayBasics(date: string): CalendarEvent[] {
  return getEventsForDate(date);
}

export function weekDates(anchor = new Date()): string[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function pillarColor(pillar: CalendarPillar): string {
  if (pillar === 'salvation') return '#F5F7F5';
  if (pillar === 'health') return '#4A9EFF';
  return '#7BC98A';
}

export function pillarLabel(pillar: CalendarPillar): string {
  return pillar === 'salvation' ? 'Salvation' : pillar === 'health' ? 'Health' : 'Freedom';
}

export function pillarSolid(pillar: CalendarPillar): string {
  if (pillar === 'salvation') return '#F5F7F5';
  if (pillar === 'health') return '#4A9EFF';
  return '#7BC98A';
}
