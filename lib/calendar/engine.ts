/**
 * Calendario de disciplina Salvazion
 * Organiza Salvation · Health · Freedom
 */

export type CalendarPillar = 'salvation' | 'health' | 'freedom';
export type CalendarEventType =
  | 'devotional'
  | 'bible'
  | 'prayer'
  | 'congregate'
  | 'church'
  | 'sport'
  | 'exercise'
  | 'outdoor'
  | 'sleep'
  | 'meal_window'
  | 'meal'
  | 'learn'
  | 'work'
  | 'inspire'
  | 'collaborate'
  | 'connect'
  | 'contribute'
  | 'custom';

/** Score action type when completing an agenda block (if any) */
export function scoreActionForEventType(type: CalendarEventType): string | null {
  switch (type) {
    case 'prayer':
      return 'pray_5min';
    case 'bible':
      return 'bible_chapter';
    case 'devotional':
      return 'devotional_complete';
    case 'congregate':
    case 'church':
    case 'connect':
      return 'connect_real';
    case 'exercise':
    case 'sport':
      return 'hit_15min';
    case 'outdoor':
      return 'outdoor_sun_20min';
    case 'meal':
    case 'meal_window':
      return 'hydration_daily';
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

export type AgendaBlockDef = {
  key: string;
  titleKey: string;
  pillar: CalendarPillar;
  type: CalendarEventType;
  time?: string;
  durationMin?: number;
  /** Deep link inside app */
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
}

const STORAGE_EVENTS = 'salvazion_calendar_events';

function uid(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
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
    .filter(e => e.date === date)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

export function getEventsInRange(start: string, end: string): CalendarEvent[] {
  return loadEvents().filter(e => e.date >= start && e.date <= end);
}

export function addEvent(
  partial: Omit<CalendarEvent, 'id' | 'completed'>
): CalendarEvent {
  const event: CalendarEvent = {
    ...partial,
    id: uid(),
    completed: false
  };
  const all = loadEvents();
  all.push(event);
  saveEvents(all);
  return event;
}

export function toggleEventComplete(id: string): CalendarEvent | null {
  const all = loadEvents();
  const idx = all.findIndex(e => e.id === id);
  if (idx < 0) return null;
  const done = !all[idx].completed;
  all[idx] = {
    ...all[idx],
    completed: done,
    completedAt: done ? new Date().toISOString() : undefined
  };
  saveEvents(all);
  return all[idx];
}

export function removeEvent(id: string) {
  saveEvents(loadEvents().filter(e => e.id !== id));
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

/**
 * Daily agenda blocks — Salvation · Health · Freedom
 * titleKey resolves via i18n (agenda.blocks.*)
 */
export const DAILY_AGENDA_BLOCKS: AgendaBlockDef[] = [
  // Salvation
  { key: 'pray', titleKey: 'agenda.blocks.pray', pillar: 'salvation', type: 'prayer', time: '06:15', durationMin: 10, href: '/hub/bible' },
  { key: 'bible', titleKey: 'agenda.blocks.bible', pillar: 'salvation', type: 'bible', time: '06:30', durationMin: 15, href: '/hub/bible' },
  { key: 'devotional', titleKey: 'agenda.blocks.devotional', pillar: 'salvation', type: 'devotional', time: '07:00', durationMin: 15, href: '/hub/devotional' },
  { key: 'congregate', titleKey: 'agenda.blocks.congregate', pillar: 'salvation', type: 'congregate', time: '10:00', durationMin: 60 },
  { key: 'church', titleKey: 'agenda.blocks.church', pillar: 'salvation', type: 'church', time: '11:00', durationMin: 90 },
  // Health
  { key: 'meals', titleKey: 'agenda.blocks.meals', pillar: 'health', type: 'meal', time: '08:00', durationMin: 30, href: '/hub/health' },
  { key: 'exercise', titleKey: 'agenda.blocks.exercise', pillar: 'health', type: 'exercise', time: '07:30', durationMin: 30, href: '/hub/health' },
  { key: 'sport', titleKey: 'agenda.blocks.sport', pillar: 'health', type: 'sport', time: '17:00', durationMin: 45, href: '/hub/health' },
  { key: 'outdoor', titleKey: 'agenda.blocks.outdoor', pillar: 'health', type: 'outdoor', time: '12:00', durationMin: 20, href: '/hub/health' },
  // Freedom
  { key: 'learn', titleKey: 'agenda.blocks.learn', pillar: 'freedom', type: 'learn', time: '20:00', durationMin: 25, href: '/hub/freedom' },
  { key: 'work', titleKey: 'agenda.blocks.work', pillar: 'freedom', type: 'work', time: '09:00', durationMin: 120 },
  { key: 'inspire', titleKey: 'agenda.blocks.inspire', pillar: 'freedom', type: 'inspire', time: '21:00', durationMin: 20, href: '/hub/freedom' },
  { key: 'collaborate', titleKey: 'agenda.blocks.collaborate', pillar: 'freedom', type: 'collaborate', time: '18:00', durationMin: 45, href: '/hub/freedom' },
];

/** Resolve display title key for an event (agenda.blocks.* or custom title) */
export function eventTitleKey(ev: CalendarEvent): string | null {
  if (ev.notes?.startsWith('agenda.blocks.')) return ev.notes;
  const def = DAILY_AGENDA_BLOCKS.find((b) => b.type === ev.type);
  return def?.titleKey ?? null;
}

/** Plantillas de disciplina diaria recomendadas (legacy + expanded) */
export function getDisciplineTemplates(): Omit<CalendarEvent, 'id' | 'date' | 'completed'>[] {
  return DAILY_AGENDA_BLOCKS.map((b) => ({
    title: b.key,
    pillar: b.pillar,
    type: b.type,
    time: b.time,
    durationMin: b.durationMin,
    recurring: 'daily' as const,
    notes: b.titleKey,
  }));
}

/**
 * Ensure today's full agenda exists (idempotent by type+date).
 * Adds missing blocks without wiping user custom events.
 */
export function ensureDayAgenda(date: string): CalendarEvent[] {
  const existing = getEventsForDate(date);
  const byType = new Set(existing.map((e) => e.type));
  const created: CalendarEvent[] = [...existing];

  for (const b of DAILY_AGENDA_BLOCKS) {
    if (byType.has(b.type)) continue;
    created.push(
      addEvent({
        title: b.key,
        pillar: b.pillar,
        type: b.type,
        date,
        time: b.time,
        durationMin: b.durationMin,
        recurring: 'daily',
        notes: b.titleKey,
      })
    );
  }
  return getEventsForDate(date);
}

/** Instala plantillas del día si el calendario está vacío para esa fecha */
export function ensureDayBasics(date: string): CalendarEvent[] {
  const existing = getEventsForDate(date);
  if (existing.length > 0) return ensureDayAgenda(date);

  for (const t of getDisciplineTemplates()) {
    addEvent({ ...t, date });
  }
  return getEventsForDate(date);
}

export function weekDates(anchor = new Date()): string[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay()); // domingo
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function pillarColor(pillar: CalendarPillar): string {
  if (pillar === 'salvation') return '#00F511';
  if (pillar === 'health') return '#00B10C';
  return '#B7F7AC';
}

export function pillarLabel(pillar: CalendarPillar): string {
  return pillar === 'salvation' ? 'Salvation' : pillar === 'health' ? 'Health' : 'Freedom';
}
