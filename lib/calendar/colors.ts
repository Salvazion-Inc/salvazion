import type { CalendarPillar } from '@/lib/calendar/engine';
import { PILLAR_COLORS as BASE, pillarPalette as basePalette } from '@/lib/theme/pillars';

/** Re-export pillar colors for calendar (same source of truth). */
export const PILLAR_COLORS = BASE;

export function pillarPalette(pillar: CalendarPillar) {
  return basePalette(pillar);
}
