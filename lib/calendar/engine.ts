/**
 * Calendario de disciplina Salvazion
 * Organiza Salvation · Health · Freedom
 */

export type CalendarPillar = 'salvation' | 'health' | 'freedom';
export type CalendarEventType =
  | 'devotional'
  | 'bible'
  | 'prayer'
  | 'sport'
  | 'exercise'
  | 'sleep'
  | 'meal_window'
  | 'learn'
  | 'connect'
  | 'contribute'
  | 'custom';

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

/** Plantillas de disciplina diaria recomendadas */
export function getDisciplineTemplates(): Omit<CalendarEvent, 'id' | 'date' | 'completed'>[] {
  return [
    { title: 'Devocional', pillar: 'salvation', type: 'devotional', time: '06:30', durationMin: 15, recurring: 'daily' },
    { title: 'Lectura bíblica', pillar: 'salvation', type: 'bible', time: '06:45', durationMin: 15, recurring: 'daily' },
    { title: 'Oración', pillar: 'salvation', type: 'prayer', time: '21:30', durationMin: 10, recurring: 'daily' },
    { title: 'Movimiento / deporte', pillar: 'health', type: 'exercise', time: '07:30', durationMin: 30, recurring: 'daily' },
    { title: 'Aire libre + sol', pillar: 'health', type: 'exercise', time: '12:00', durationMin: 20, recurring: 'daily' },
    { title: 'Aprender (artículo/video)', pillar: 'freedom', type: 'learn', time: '20:00', durationMin: 20, recurring: 'daily' },
    { title: 'Conexión familiar / fe', pillar: 'freedom', type: 'connect', time: '19:00', durationMin: 30, recurring: 'weekly' },
  ];
}

/** Instala plantillas del día si el calendario está vacío para esa fecha */
export function ensureDayBasics(date: string): CalendarEvent[] {
  const existing = getEventsForDate(date);
  if (existing.length > 0) return existing;

  const templates = getDisciplineTemplates().filter(t => t.recurring === 'daily');
  const created: CalendarEvent[] = [];
  for (const t of templates) {
    created.push(addEvent({ ...t, date }));
  }
  return created;
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
