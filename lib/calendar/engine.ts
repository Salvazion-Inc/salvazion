/**
 * Salvazion discipline calendar — Salvation · Health · Freedom
 * Day runs 00:00–24:00; default blocks 30 min (editable).
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
  | 'family'
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
  defaultTime: string;
  /** Default length when attaching (user can change) */
  durationMin: number;
  href?: string;
};

export interface CalendarEvent {
  id: string;
  title: string;
  pillar: CalendarPillar;
  type: CalendarEventType;
  date: string;
  time?: string;
  durationMin?: number;
  recurring?: 'daily' | 'weekly' | null;
  sportId?: string;
  completed?: boolean;
  completedAt?: string;
  notes?: string;
  blockKey?: string;
}

const STORAGE_EVENTS = 'salvazion_calendar_events';

/** Full day window */
export const DAY_START_MIN = 0; // 00:00
export const DAY_END_MIN = 24 * 60; // 24:00
export const SNAP_MIN = 15;
export const DEFAULT_BLOCK_MIN = 30;

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
    case 'family':
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
      // Meals are discipline (calendar %) only — hydration points come from
      // glasses / wearables, not from marking a meal block done.
      return null;
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
 * Palette blocks (default 30 min unless noted).
 */
export const ROUTINE_BLOCKS: AgendaBlockDef[] = [
  // Salvation
  { key: 'pray', titleKey: 'agenda.blocks.pray', pillar: 'salvation', type: 'prayer', defaultTime: '07:00', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/bible' },
  { key: 'bible', titleKey: 'agenda.blocks.bible', pillar: 'salvation', type: 'bible', defaultTime: '07:15', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/bible' },
  { key: 'devotional', titleKey: 'agenda.blocks.devotional', pillar: 'salvation', type: 'devotional', defaultTime: '13:30', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/devotional' },
  { key: 'worship', titleKey: 'agenda.blocks.worship', pillar: 'salvation', type: 'worship', defaultTime: '10:00', durationMin: DEFAULT_BLOCK_MIN },
  { key: 'meeting', titleKey: 'agenda.blocks.meeting', pillar: 'salvation', type: 'meeting', defaultTime: '19:00', durationMin: DEFAULT_BLOCK_MIN },
  // Health
  { key: 'sleep', titleKey: 'agenda.blocks.sleep', pillar: 'health', type: 'sleep', defaultTime: '00:00', durationMin: 420, href: '/hub/health' },
  { key: 'nap', titleKey: 'agenda.blocks.nap', pillar: 'health', type: 'nap', defaultTime: '14:00', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/health' },
  { key: 'breakfast', titleKey: 'agenda.blocks.breakfast', pillar: 'health', type: 'breakfast', defaultTime: '09:00', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/health' },
  { key: 'lunch', titleKey: 'agenda.blocks.lunch', pillar: 'health', type: 'lunch', defaultTime: '14:00', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/health' },
  { key: 'dinner', titleKey: 'agenda.blocks.dinner', pillar: 'health', type: 'dinner', defaultTime: '19:00', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/health' },
  { key: 'outdoor', titleKey: 'agenda.blocks.outdoor', pillar: 'health', type: 'outdoor', defaultTime: '18:00', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/health' },
  { key: 'exercise', titleKey: 'agenda.blocks.exercise', pillar: 'health', type: 'exercise', defaultTime: '07:30', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/health' },
  { key: 'sport', titleKey: 'agenda.blocks.sport', pillar: 'health', type: 'sport', defaultTime: '17:00', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/health' },
  { key: 'gym', titleKey: 'agenda.blocks.gym', pillar: 'health', type: 'gym', defaultTime: '18:00', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/health' },
  // Freedom
  { key: 'learn', titleKey: 'agenda.blocks.learn', pillar: 'freedom', type: 'learn', defaultTime: '20:00', durationMin: DEFAULT_BLOCK_MIN, href: '/hub/freedom' },
  { key: 'work', titleKey: 'agenda.blocks.work', pillar: 'freedom', type: 'work', defaultTime: '10:00', durationMin: DEFAULT_BLOCK_MIN },
  { key: 'family', titleKey: 'agenda.blocks.family', pillar: 'freedom', type: 'family', defaultTime: '21:00', durationMin: DEFAULT_BLOCK_MIN },
];

export const DAILY_AGENDA_BLOCKS = ROUTINE_BLOCKS;

/**
 * Ideal default day schedule (00:00–24:00).
 * Sleep 00:00–07:00 · Pray+Bible 07:00–07:30 · Exercise 07:30–08:30 ·
 * Breakfast 09:00–10:00 · Work 10:00–13:30 · Devotional 13:30–14:00 ·
 * Lunch 14:00–15:00 · Work 15:00–18:00 · Outdoor 18:00–19:00 ·
 * Dinner 19:00–20:00 · Family 21:00–23:00 · Pray+Bible study 23:00–00:00
 */
export type DefaultSlot = {
  blockKey: string;
  time: string;
  durationMin: number;
};

export const DEFAULT_DAY_SCHEDULE: DefaultSlot[] = [
  { blockKey: 'sleep', time: '00:00', durationMin: 420 }, // → 07:00
  { blockKey: 'pray', time: '07:00', durationMin: 15 },
  { blockKey: 'bible', time: '07:15', durationMin: 15 }, // 07:00–07:30 together
  { blockKey: 'exercise', time: '07:30', durationMin: 60 }, // → 08:30
  { blockKey: 'breakfast', time: '09:00', durationMin: 60 }, // → 10:00
  { blockKey: 'work', time: '10:00', durationMin: 210 }, // → 13:30
  { blockKey: 'devotional', time: '13:30', durationMin: 30 }, // → 14:00
  { blockKey: 'lunch', time: '14:00', durationMin: 60 }, // → 15:00
  { blockKey: 'work', time: '15:00', durationMin: 180 }, // → 18:00
  { blockKey: 'outdoor', time: '18:00', durationMin: 60 }, // → 19:00
  { blockKey: 'dinner', time: '19:00', durationMin: 60 }, // → 20:00
  { blockKey: 'family', time: '21:00', durationMin: 120 }, // → 23:00
  { blockKey: 'pray', time: '23:00', durationMin: 30 },
  { blockKey: 'bible', time: '23:30', durationMin: 30 }, // → 00:00
];

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

/** Planned vs completed for a day (for progress % UI). */
export function getDayCompletionStats(date: string): {
  total: number;
  done: number;
  percent: number;
} {
  const events = getEventsForDate(date);
  const total = events.length;
  const done = events.filter((e) => e.completed).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

export type DayDisciplinePoint = {
  date: string;
  percent: number;
  done: number;
  total: number;
};

/**
 * Last N days of calendar completion % for weekly discipline charts.
 * Uses local events only (no extra forms required).
 */
export function getDisciplineHistory(days = 7): DayDisciplinePoint[] {
  const points: DayDisciplinePoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const stats = getDayCompletionStats(date);
    points.push({
      date,
      percent: stats.percent,
      done: stats.done,
      total: stats.total,
    });
  }
  return points;
}

/** True when local clock is in evening of `date` (or date is in the past). */
export function isDaySummaryWindow(date: string, now = new Date()): boolean {
  const today = todayStr();
  if (date < today) return true;
  if (date > today) return false;
  return now.getHours() >= 20;
}

export function getEventsInRange(start: string, end: string): CalendarEvent[] {
  return loadEvents().filter((e) => e.date >= start && e.date <= end);
}

export function addEvent(
  partial: Omit<CalendarEvent, 'id' | 'completed'>
): CalendarEvent {
  const event: CalendarEvent = {
    ...partial,
    durationMin: partial.durationMin ?? DEFAULT_BLOCK_MIN,
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

/** Attach palette block to calendar (default 30 min unless overridden) */
export function placeBlock(
  date: string,
  blockKey: string,
  time?: string,
  durationMin?: number
): CalendarEvent | null {
  const def = getBlockDef(blockKey);
  if (!def) return null;
  return addEvent({
    title: def.key,
    pillar: def.pillar,
    type: def.type,
    date,
    time: time || def.defaultTime,
    durationMin: durationMin ?? def.durationMin ?? DEFAULT_BLOCK_MIN,
    recurring: null,
    notes: def.titleKey,
    blockKey: def.key,
  });
}

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

export function endTimeOf(ev: CalendarEvent): string {
  const start = timeToMinutes(ev.time || '00:00');
  const end = start + (ev.durationMin || DEFAULT_BLOCK_MIN);
  if (end >= 24 * 60) return '00:00';
  return minutesToTime(end);
}

/**
 * Format duration for UI.
 * Short slots stay in minutes so 15/30 min blocks stay readable:
 *   15 → "15 min", 30 → "30 min", 60 → "1 h", 90 → "1.5 h", 420 → "7 h"
 */
export function formatDurationHours(durationMin: number): string {
  const min = Math.max(0, durationMin || 0);
  if (min > 0 && min < 60) return `${min} min`;
  const hours = min / 60;
  if (Number.isInteger(hours)) return `${hours} h`;
  const one = Math.round(hours * 10) / 10;
  if (Math.abs(hours - one) < 0.001) return `${one} h`;
  return `${Math.round(hours * 100) / 100} h`;
}

/**
 * Layout density for agenda/calendar rows.
 * compact under 15m (rare) · cozy 15–45m (pray 07:00, bible 07:15, 30-min) · roomy longer.
 * 15-min default slots share the same two-line face as 30-min blocks.
 */
export type AgendaBlockLayout = 'compact' | 'cozy' | 'roomy';

export function agendaBlockLayout(durationMin: number): AgendaBlockLayout {
  const m = Math.max(1, durationMin || DEFAULT_BLOCK_MIN);
  // Keep compact only for ultra-short custom slots; 15-min routine uses cozy face.
  if (m < 15) return 'compact';
  if (m <= 45) return 'cozy';
  return 'roomy';
}

/**
 * Vertical size (px) of an agenda/calendar block proportional to duration.
 * Compact slots use a fixed single-line height so type/title never clips.
 *   15 min → 52 px (cozy), 30 → 52 (cozy), 60 → 72, 120 → 144, 420 → 504.
 */
export const AGENDA_PX_PER_MIN = 1.2;
/** Single-line compact row (under 15 min custom activities). */
export const AGENDA_BLOCK_COMPACT_H = 40;
/** Cozy two-line short block (15–45 min, incl. pray 07:00 / bible 07:15). */
export const AGENDA_BLOCK_COZY_H = 52;
/** Floor for roomy proportional blocks. */
export const AGENDA_BLOCK_MIN_H = 64;
/** Soft ceiling for bad/out-of-range data only (≈ 9 h). */
export const AGENDA_BLOCK_MAX_H = 540;

export function agendaBlockHeightPx(durationMin: number): number {
  const m = Math.max(1, durationMin || DEFAULT_BLOCK_MIN);
  const layout = agendaBlockLayout(m);
  if (layout === 'compact') return AGENDA_BLOCK_COMPACT_H;
  if (layout === 'cozy') {
    return Math.max(AGENDA_BLOCK_COZY_H, Math.round(m * 1.1));
  }
  const raw = m * AGENDA_PX_PER_MIN;
  return Math.round(Math.min(AGENDA_BLOCK_MAX_H, Math.max(AGENDA_BLOCK_MIN_H, raw)));
}

export function clearDay(date: string): void {
  saveEvents(loadEvents().filter((e) => e.date !== date));
}

/** Seed the ideal default schedule if the day has no events */
export function seedDefaultDay(date: string): CalendarEvent[] {
  const existing = getEventsForDate(date);
  if (existing.length > 0) return existing;

  for (const slot of DEFAULT_DAY_SCHEDULE) {
    const def = getBlockDef(slot.blockKey);
    if (!def) continue;
    addEvent({
      title: def.key,
      pillar: def.pillar,
      type: def.type,
      date,
      time: slot.time,
      durationMin: slot.durationMin,
      recurring: 'daily',
      notes: def.titleKey,
      blockKey: def.key,
    });
  }
  return getEventsForDate(date);
}

/** Reset day to the ideal default schedule */
export function resetToDefaultDay(date: string): CalendarEvent[] {
  clearDay(date);
  return seedDefaultDay(date);
}

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

export function duplicateToTomorrow(fromDate: string): number {
  return duplicateDay(fromDate, addDays(fromDate, 1));
}

export function duplicateToWeek(fromDate: string): number {
  let n = 0;
  for (let i = 1; i <= 6; i++) {
    n += duplicateDay(fromDate, addDays(fromDate, i));
  }
  return n;
}

export function getDisciplineTemplates(): Omit<CalendarEvent, 'id' | 'date' | 'completed'>[] {
  return DEFAULT_DAY_SCHEDULE.map((slot) => {
    const def = getBlockDef(slot.blockKey)!;
    return {
      title: def.key,
      pillar: def.pillar,
      type: def.type,
      time: slot.time,
      durationMin: slot.durationMin,
      recurring: 'daily' as const,
      notes: def.titleKey,
      blockKey: def.key,
    };
  });
}

export function ensureDayAgenda(date: string): CalendarEvent[] {
  return seedDefaultDay(date);
}

export function ensureDayBasics(date: string): CalendarEvent[] {
  return seedDefaultDay(date);
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
