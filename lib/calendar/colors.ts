import type { CalendarPillar } from '@/lib/calendar/engine';
import { PILLAR_COLORS as BASE, pillarPalette as basePalette } from '@/lib/theme/pillars';

/** Re-export pillar colors for calendar (same source of truth for solid/accents). */
export const PILLAR_COLORS = BASE;

/**
 * Calendar/agenda surface palette.
 * Salvation is the white pillar: on calendar cards we use a solid light plate
 * with dark ink so titles (Oración, Devocional, Lectura bíblica…) stay readable.
 * Health/Freedom keep translucent tint + light text on the dark app chrome.
 * `control` is for Sí/No faces that sit on dark chrome (always light enough).
 */
export type CalendarPillarPalette = {
  solid: string;
  soft: string;
  border: string;
  text: string;
  muted: string;
  /** Foreground on dark controls (Sí/No inactive, badges on dark). */
  control: string;
  /** True when labels use dark ink on a light plate. */
  lightPlate: boolean;
};

export function pillarPalette(pillar: CalendarPillar): CalendarPillarPalette {
  const base = basePalette(pillar);
  if (pillar === 'salvation') {
    return {
      solid: base.solid,
      // Near-opaque white plate — the “white block” identity of Salvation
      soft: 'rgba(245, 247, 245, 0.94)',
      border: 'rgba(210, 218, 210, 0.95)',
      text: '#121412',
      muted: 'rgba(18, 20, 18, 0.62)',
      control: '#F5F7F5',
      lightPlate: true,
    };
  }
  return {
    solid: base.solid,
    soft: base.soft,
    border: base.border,
    text: base.text,
    muted: base.muted,
    control: base.text,
    lightPlate: false,
  };
}

/**
 * Fraction of the local calendar day elapsed (0 at 00:00 → 1 at 24:00).
 * Uses the browser timezone of the user.
 */
export function localDayProgress(date: Date = new Date()): number {
  const mins = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
  return Math.min(1, Math.max(0, mins / (24 * 60)));
}

/**
 * Ambient darken amount for the Dashboard agenda (0–1).
 * Morning stays relatively open; evening/night shift toward true black.
 */
export function agendaAmbientDarken(date: Date = new Date()): number {
  const p = localDayProgress(date);
  // Gentle at dawn, steeper after midday, deepest late night
  // ~0.04 at 00:00, ~0.22 at noon, ~0.48 at 18:00, ~0.62 at 23:59
  const curve = p * p * 0.35 + p * 0.28;
  return Math.min(0.68, 0.04 + curve);
}

/** Minutes from local midnight for HH:MM. */
export function timeToMinutes(time: string | undefined): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

export type AgendaEventPhase = 'past' | 'now' | 'future';

/** Normalize start/end/current minutes so overnight blocks compare correctly. */
function agendaWindowMinutes(
  startTime: string | undefined,
  endTime: string | undefined,
  now: Date = new Date()
): { start: number; end: number; cur: number } {
  const nowM = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  // Overnight blocks (e.g. sleep 00:00–07:00) already have end > start in normal cases;
  // if end <= start treat as next-day wrap only when start is late evening.
  if (end <= start) end += 24 * 60;
  let cur = nowM;
  // For wrap windows that cross midnight, map early-morning "now" into the wrap range
  if (end > 24 * 60 && cur < start) cur += 24 * 60;
  return { start, end, cur };
}

export function agendaEventPhase(
  startTime: string | undefined,
  endTime: string | undefined,
  now: Date = new Date()
): AgendaEventPhase {
  const { start, end, cur } = agendaWindowMinutes(startTime, endTime, now);
  if (cur < start) return 'future';
  if (cur >= end) return 'past';
  return 'now';
}

/**
 * Progress inside the current block (0 → 1). Returns 0 if not in the window.
 */
export function agendaEventProgress(
  startTime: string | undefined,
  endTime: string | undefined,
  now: Date = new Date()
): number {
  const { start, end, cur } = agendaWindowMinutes(startTime, endTime, now);
  const span = end - start;
  if (span <= 0) return 0;
  if (cur < start) return 0;
  if (cur >= end) return 1;
  return Math.min(1, Math.max(0, (cur - start) / span));
}

/** Whole minutes remaining in the current block (0 if not active). */
export function agendaEventRemainingMin(
  startTime: string | undefined,
  endTime: string | undefined,
  now: Date = new Date()
): number {
  const { start, end, cur } = agendaWindowMinutes(startTime, endTime, now);
  if (cur < start || cur >= end) return 0;
  return Math.max(0, Math.ceil(end - cur));
}

/**
 * Per-event darken multiplier on top of ambient (0–1).
 * Past slots deepen; current stays readable; future stays slightly lighter.
 */
export function agendaEventDarken(
  ambient: number,
  phase: AgendaEventPhase
): number {
  if (phase === 'past') return Math.min(0.78, ambient + 0.18 + ambient * 0.15);
  if (phase === 'now') return Math.max(0.06, ambient * 0.55);
  return Math.max(0.02, ambient * 0.72);
}

/**
 * Ambient darken for a calendar block. Salvation light plates darken gently
 * so dark ink remains readable (never pure black background + black text).
 */
export function agendaBlockDarken(
  pillar: CalendarPillar,
  ambient: number,
  phase: AgendaEventPhase
): number {
  const raw = agendaEventDarken(ambient, phase);
  if (pillar === 'salvation') {
    // Cap so the white plate stays light enough for dark labels
    return Math.min(0.28, raw * 0.4);
  }
  return raw;
}

/**
 * Mix a color toward pure black using CSS color-mix (user local theme).
 * `amount` 0 = original, 1 = full black.
 */
export function mixTowardBlack(color: string, amount: number): string {
  const a = Math.min(1, Math.max(0, amount));
  if (a <= 0.001) return color;
  if (a >= 0.999) return '#040404';
  const keep = Math.round((1 - a) * 1000) / 10;
  const black = Math.round(a * 1000) / 10;
  return `color-mix(in srgb, ${color} ${keep}%, #040404 ${black}%)`;
}

/** Shell surface for the agenda list that tracks local time of day. */
export function agendaShellStyle(now: Date = new Date()): {
  background: string;
  borderColor: string;
  transition: string;
} {
  const ambient = agendaAmbientDarken(now);
  const base = 'color-mix(in srgb, var(--surface) 70%, #040404)';
  return {
    background: mixTowardBlack(base, ambient * 0.85),
    borderColor: mixTowardBlack('var(--border-soft)', ambient * 0.5),
    transition: 'background 1.2s ease, border-color 1.2s ease, opacity 0.6s ease',
  };
}

