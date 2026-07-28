import type { CalendarPillar } from '@/lib/calendar/engine';

/** Pillar colors — Salvation white, Health blue, Freedom green */
export const PILLAR_COLORS = {
  salvation: {
    solid: '#F5F7F5',
    soft: 'rgba(245, 247, 245, 0.16)',
    border: 'rgba(245, 247, 245, 0.55)',
    text: '#F5F7F5',
  },
  health: {
    solid: '#4A9EFF',
    soft: 'rgba(74, 158, 255, 0.18)',
    border: 'rgba(74, 158, 255, 0.55)',
    text: '#8FC4FF',
  },
  freedom: {
    solid: '#7BC98A',
    soft: 'rgba(123, 201, 138, 0.2)',
    border: 'rgba(123, 201, 138, 0.55)',
    text: '#8FD99A',
  },
} as const;

export function pillarPalette(pillar: CalendarPillar) {
  return PILLAR_COLORS[pillar];
}
