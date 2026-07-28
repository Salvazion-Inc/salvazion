/**
 * Official three-pillar colors for Salvazion.
 * Salvation = white · Health = blue · Freedom = green
 */

export type PillarId = 'salvation' | 'health' | 'freedom';

export const PILLAR_COLORS = {
  salvation: {
    solid: '#F5F7F5',
    soft: 'rgba(245, 247, 245, 0.16)',
    border: 'rgba(245, 247, 245, 0.55)',
    text: '#F5F7F5',
    muted: 'rgba(245, 247, 245, 0.65)',
  },
  health: {
    solid: '#4A9EFF',
    soft: 'rgba(74, 158, 255, 0.18)',
    border: 'rgba(74, 158, 255, 0.55)',
    text: '#8FC4FF',
    muted: 'rgba(143, 196, 255, 0.75)',
  },
  freedom: {
    solid: '#7BC98A',
    soft: 'rgba(123, 201, 138, 0.2)',
    border: 'rgba(123, 201, 138, 0.55)',
    text: '#8FD99A',
    muted: 'rgba(143, 217, 154, 0.75)',
  },
} as const;

export function pillarPalette(pillar: PillarId) {
  return PILLAR_COLORS[pillar];
}

export function pillarSolid(pillar: PillarId): string {
  return PILLAR_COLORS[pillar].solid;
}
