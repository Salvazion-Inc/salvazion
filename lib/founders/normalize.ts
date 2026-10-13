import type { LiveCapsule, LiveYacht } from './types';

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeFx(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const serie = (payload as { serie?: unknown }).serie;
  if (!Array.isArray(serie) || !serie.length) return null;
  const valor = num((serie[0] as { valor?: unknown }).valor);
  return valor > 0 ? valor : null;
}

export function normalizeDex(payload: unknown): { paired: boolean; priceUsd: number | null } {
  const pairs = payload && typeof payload === 'object'
    ? (payload as { pairs?: unknown }).pairs
    : null;
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return { paired: false, priceUsd: null };
  }
  const price = num((pairs[0] as { priceUsd?: unknown }).priceUsd);
  return { paired: true, priceUsd: price > 0 ? price : null };
}

export function normalizeYachts(payload: unknown): LiveYacht[] {
  const list = payload && typeof payload === 'object'
    ? (payload as { yachts?: unknown }).yachts
    : null;
  if (!Array.isArray(list)) return [];
  const yachts: LiveYacht[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const price = num(row.priceFromUsd);
    const name = text(row.name);
    if (!name || price <= 0) continue;
    const captain = row.captain;
    const captainName =
      captain && typeof captain === 'object'
        ? text((captain as { name?: unknown }).name)
        : text(captain);
    const traits = Array.isArray(row.traits)
      ? row.traits.map((trait) => text(trait)).filter(Boolean)
      : [];
    yachts.push({
      name,
      ft: num(row.lengthFt),
      guests: Math.max(1, num(row.guests) || 1),
      price,
      hours: Math.max(1, num(row.hoursMin) || 1),
      marina: text(row.marina),
      captain: captainName.replace(/^Captain\s+/i, ''),
      kind: traits.join(' · ') || text(row.class),
    });
  }
  return yachts.sort((a, b) => a.price - b.price);
}

export function normalizeMarinas(payload: unknown): {
  checkoutMarinas: string[];
  mapHubs: number | null;
} {
  if (!payload || typeof payload !== 'object') {
    return { checkoutMarinas: [], mapHubs: null };
  }
  const row = payload as { places?: unknown; mapHubs?: unknown };
  const names = Array.isArray(row.places)
    ? row.places
        .map((place) =>
          place && typeof place === 'object' ? text((place as { name?: unknown }).name) : ''
        )
        .filter(Boolean)
    : [];
  const hubs = num(row.mapHubs);
  return {
    checkoutMarinas: names,
    mapHubs: hubs > 0 ? hubs : null,
  };
}

export function normalizeCapsules(payload: unknown): LiveCapsule[] {
  const list = payload && typeof payload === 'object'
    ? (payload as { capsules?: unknown }).capsules
    : null;
  if (!Array.isArray(list)) return [];
  const capsules: LiveCapsule[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const name = text(row.name);
    const price = num(row.price);
    if (!name || price <= 0) continue;
    const lands = Array.isArray(row.lands)
      ? row.lands.map((land) => text(land)).filter(Boolean)
      : [];
    capsules.push({
      name,
      place: text(row.place),
      lands,
      land: lands[0] || 'Otros',
      price,
      guests: Math.max(1, num(row.guests) || 1),
    });
  }
  return capsules;
}

export function normalizeCatalogCounts(payload: unknown): {
  destinations: number;
  parks: number;
  gastronomy: number;
  activities: number;
} {
  const row = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  return {
    destinations: num(row.destinations),
    parks: num(row.parks),
    gastronomy: num(row.gastronomy),
    activities: num(row.activities),
  };
}

export function normalizePartners(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const partners = (payload as { partners?: unknown }).partners;
  return Array.isArray(partners) ? partners.length : null;
}
