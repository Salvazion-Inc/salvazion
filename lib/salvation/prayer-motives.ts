/**
 * Motivos de oración — pilar Salvation (local-first).
 * Orden persistente = prioridad (0 = más urgente).
 */

export type PrayerMotiveStatus = 'open' | 'prayed' | 'answered' | 'archived';

export type PrayerCategory =
  | 'family'
  | 'health'
  | 'nation'
  | 'church'
  | 'work'
  | 'personal'
  | 'world';

export const PRAYER_CATEGORIES: readonly PrayerCategory[] = [
  'family',
  'health',
  'nation',
  'church',
  'work',
  'personal',
  'world',
] as const;

export interface PrayerMotive {
  id: string;
  text: string;
  /** Quién / para qué (opcional) */
  forWhom?: string;
  status: PrayerMotiveStatus;
  category?: PrayerCategory;
  /** Lower = higher priority. Compacted 0..n on save. */
  sortOrder: number;
  /** Times the user marked “I prayed”. */
  prayedCount: number;
  createdAt: string;
  updatedAt: string;
  prayedAt?: string;
  answeredAt?: string;
}

const STORAGE_KEY = 'salvazion_prayer_motives';
const DAYS_KEY = 'salvazion_prayer_days';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function todayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isStatus(v: unknown): v is PrayerMotiveStatus {
  return v === 'open' || v === 'prayed' || v === 'answered' || v === 'archived';
}

function isCategory(v: unknown): v is PrayerCategory {
  return (
    v === 'family' ||
    v === 'health' ||
    v === 'nation' ||
    v === 'church' ||
    v === 'work' ||
    v === 'personal' ||
    v === 'world'
  );
}

function migrateList(raw: unknown): PrayerMotive[] {
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();
  const items: PrayerMotive[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const m = row as Partial<PrayerMotive>;
    if (!m.id || typeof m.text !== 'string' || !m.text.trim()) continue;
    items.push({
      id: String(m.id),
      text: String(m.text).slice(0, 500),
      forWhom: m.forWhom ? String(m.forWhom).slice(0, 120) : undefined,
      status: isStatus(m.status) ? m.status : 'open',
      category: isCategory(m.category) ? m.category : undefined,
      sortOrder:
        typeof m.sortOrder === 'number' && Number.isFinite(m.sortOrder)
          ? m.sortOrder
          : Number.NaN,
      prayedCount:
        typeof m.prayedCount === 'number' && Number.isFinite(m.prayedCount)
          ? Math.max(0, Math.floor(m.prayedCount))
          : m.prayedAt
            ? 1
            : 0,
      createdAt: typeof m.createdAt === 'string' ? m.createdAt : now,
      updatedAt: typeof m.updatedAt === 'string' ? m.updatedAt : now,
      prayedAt: typeof m.prayedAt === 'string' ? m.prayedAt : undefined,
      answeredAt: typeof m.answeredAt === 'string' ? m.answeredAt : undefined,
    });
  }
  const hasOrder = items.some((m) => Number.isFinite(m.sortOrder));
  if (!hasOrder) {
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    items.sort((a, b) => {
      const ao = Number.isFinite(a.sortOrder) ? a.sortOrder : 1e9;
      const bo = Number.isFinite(b.sortOrder) ? b.sortOrder : 1e9;
      if (ao !== bo) return ao - bo;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }
  return items.map((m, i) => ({ ...m, sortOrder: i }));
}

export function loadPrayerMotives(): PrayerMotive[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return migrateList(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveAll(list: PrayerMotive[]) {
  if (typeof window === 'undefined') return;
  const compacted = list.slice(0, 300).map((m, i) => ({ ...m, sortOrder: i }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted));
}

export function addPrayerMotive(
  text: string,
  forWhom?: string,
  category?: PrayerCategory
): PrayerMotive {
  const now = new Date().toISOString();
  const entry: PrayerMotive = {
    id: uid(),
    text: text.trim().slice(0, 500),
    forWhom: forWhom?.trim().slice(0, 120) || undefined,
    status: 'open',
    category,
    sortOrder: 0,
    prayedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const list = loadPrayerMotives().filter((m) => m.id !== entry.id);
  list.unshift(entry);
  saveAll(list);
  return entry;
}

export function updatePrayerMotive(
  id: string,
  patch: Partial<Pick<PrayerMotive, 'text' | 'forWhom' | 'status'>> & {
    category?: PrayerCategory | '';
  }
): PrayerMotive | null {
  const list = loadPrayerMotives();
  const idx = list.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const prev = list[idx];
  const next: PrayerMotive = {
    ...prev,
    updatedAt: now,
  };
  if (patch.text != null) next.text = patch.text.trim().slice(0, 500);
  if (patch.forWhom !== undefined) {
    next.forWhom = patch.forWhom.trim().slice(0, 120) || undefined;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'category')) {
    next.category = patch.category || undefined;
  }
  if (patch.status != null && patch.status !== prev.status) {
    next.status = patch.status;
    if (patch.status === 'prayed') {
      next.prayedAt = now;
      next.prayedCount = prev.prayedCount + 1;
    }
    if (patch.status === 'answered') next.answeredAt = now;
  }
  list[idx] = next;
  saveAll(list);
  return next;
}

export function removePrayerMotive(id: string): void {
  saveAll(loadPrayerMotives().filter((m) => m.id !== id));
}

/**
 * Reorder a visible subset (e.g. open motives) while leaving the rest in place.
 * `orderedSubsetIds` is the new priority order (first = highest).
 */
export function reorderPrayerMotives(orderedSubsetIds: string[]): void {
  if (!orderedSubsetIds.length) return;
  const all = loadPrayerMotives();
  const idSet = new Set(orderedSubsetIds);
  const positions = all
    .map((m, i) => i)
    .filter((i) => idSet.has(all[i].id));
  if (positions.length !== orderedSubsetIds.length) {
    // Fall back to global order of the ids we still have
    const byId = new Map(all.map((m) => [m.id, m]));
    const next: PrayerMotive[] = [];
    for (const id of orderedSubsetIds) {
      const m = byId.get(id);
      if (m) {
        next.push(m);
        byId.delete(id);
      }
    }
    byId.forEach((m) => next.push(m));
    saveAll(next);
    return;
  }
  const byId = new Map(all.map((m) => [m.id, m]));
  const next = [...all];
  orderedSubsetIds.forEach((id, k) => {
    const item = byId.get(id);
    if (item) next[positions[k]] = item;
  });
  saveAll(next);
}

export function movePrayerMotive(id: string, direction: -1 | 1): boolean {
  const list = loadPrayerMotives();
  const idx = list.findIndex((m) => m.id === id);
  const j = idx + direction;
  if (idx < 0 || j < 0 || j >= list.length) return false;
  const ids = list.map((m) => m.id);
  const tmp = ids[idx];
  ids[idx] = ids[j];
  ids[j] = tmp;
  reorderPrayerMotives(ids);
  return true;
}

export function markPrayed(id: string): PrayerMotive | null {
  const list = loadPrayerMotives();
  const idx = list.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const prev = list[idx];
  list[idx] = {
    ...prev,
    status: prev.status === 'answered' ? prev.status : 'prayed',
    prayedAt: now,
    prayedCount: prev.prayedCount + 1,
    updatedAt: now,
  };
  saveAll(list);
  recordPrayerDay();
  return list[idx];
}

export function markAnswered(id: string): PrayerMotive | null {
  return updatePrayerMotive(id, { status: 'answered' });
}

export function reopenMotive(id: string): PrayerMotive | null {
  return updatePrayerMotive(id, { status: 'open' });
}

export function countOpenMotives(): number {
  return loadPrayerMotives().filter((m) => m.status === 'open').length;
}

export function getTopOpenMotive(): PrayerMotive | null {
  return loadPrayerMotives().find((m) => m.status === 'open') ?? null;
}

function loadPrayerDays(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DAYS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list)
      ? list.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
      : [];
  } catch {
    return [];
  }
}

export function recordPrayerDay(date = todayIso()): void {
  if (typeof window === 'undefined') return;
  const days = loadPrayerDays();
  if (!days.includes(date)) {
    days.push(date);
    localStorage.setItem(DAYS_KEY, JSON.stringify(days.slice(-400)));
  }
}

export function getPrayerStreak(): number {
  const set = new Set(loadPrayerDays());
  if (set.size === 0) return 0;
  const d = new Date();
  if (!set.has(todayIso(d))) {
    d.setDate(d.getDate() - 1);
    if (!set.has(todayIso(d))) return 0;
  }
  let n = 0;
  while (set.has(todayIso(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function prayedToday(): boolean {
  return loadPrayerDays().includes(todayIso());
}
