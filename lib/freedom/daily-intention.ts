/**
 * Daily intention + digital fast — Freedom pillar (local-first).
 * Inspired by intention-setting and attention-fast tools, without emptying faith.
 */

export type DailyIntentionState = {
  date: string;
  text: string;
  /** Epoch ms when the current digital fast ends. */
  fastUntil: number | null;
  fastMinutes: number;
};

const STORAGE_KEY = 'salvazion_daily_intention';

function todayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const EMPTY: DailyIntentionState = {
  date: '',
  text: '',
  fastUntil: null,
  fastMinutes: 30,
};

export function loadDailyIntention(): DailyIntentionState {
  if (typeof window === 'undefined') return { ...EMPTY, date: todayIso() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, date: todayIso() };
    const parsed = JSON.parse(raw) as Partial<DailyIntentionState>;
    const date = todayIso();
    const sameDay = parsed.date === date;
    return {
      date,
      text: sameDay && typeof parsed.text === 'string' ? parsed.text.slice(0, 280) : '',
      fastUntil:
        sameDay && typeof parsed.fastUntil === 'number' && parsed.fastUntil > Date.now()
          ? parsed.fastUntil
          : null,
      fastMinutes:
        typeof parsed.fastMinutes === 'number' && parsed.fastMinutes > 0
          ? parsed.fastMinutes
          : 30,
    };
  } catch {
    return { ...EMPTY, date: todayIso() };
  }
}

function save(state: DailyIntentionState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function saveIntentionText(text: string): DailyIntentionState {
  const prev = loadDailyIntention();
  const next: DailyIntentionState = {
    ...prev,
    date: todayIso(),
    text: text.trim().slice(0, 280),
  };
  save(next);
  return next;
}

export function startDigitalFast(minutes: number): DailyIntentionState {
  const prev = loadDailyIntention();
  const mins = Math.min(180, Math.max(5, Math.round(minutes)));
  const next: DailyIntentionState = {
    ...prev,
    date: todayIso(),
    fastMinutes: mins,
    fastUntil: Date.now() + mins * 60_000,
  };
  save(next);
  return next;
}

export function stopDigitalFast(): DailyIntentionState {
  const prev = loadDailyIntention();
  const next: DailyIntentionState = { ...prev, date: todayIso(), fastUntil: null };
  save(next);
  return next;
}

export function remainingFastMs(state: DailyIntentionState, now = Date.now()): number {
  if (!state.fastUntil) return 0;
  return Math.max(0, state.fastUntil - now);
}
