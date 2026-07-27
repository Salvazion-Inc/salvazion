/**
 * Motivos de oración — pilar Salvation (local-first).
 */

export type PrayerMotiveStatus = 'open' | 'prayed' | 'answered' | 'archived';

export interface PrayerMotive {
  id: string;
  text: string;
  /** Quién / para qué (opcional) */
  forWhom?: string;
  status: PrayerMotiveStatus;
  createdAt: string;
  updatedAt: string;
  prayedAt?: string;
  answeredAt?: string;
}

const STORAGE_KEY = 'salvazion_prayer_motives';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadPrayerMotives(): PrayerMotive[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as PrayerMotive[];
    return Array.isArray(list)
      ? list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : [];
  } catch {
    return [];
  }
}

function saveAll(list: PrayerMotive[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 300)));
}

export function addPrayerMotive(text: string, forWhom?: string): PrayerMotive {
  const now = new Date().toISOString();
  const entry: PrayerMotive = {
    id: uid(),
    text: text.trim().slice(0, 500),
    forWhom: forWhom?.trim().slice(0, 120) || undefined,
    status: 'open',
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
  patch: Partial<Pick<PrayerMotive, 'text' | 'forWhom' | 'status'>>
): PrayerMotive | null {
  const list = loadPrayerMotives();
  const idx = list.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const prev = list[idx];
  const next: PrayerMotive = {
    ...prev,
    ...patch,
    text: patch.text != null ? patch.text.trim().slice(0, 500) : prev.text,
    forWhom:
      patch.forWhom != null
        ? patch.forWhom.trim().slice(0, 120) || undefined
        : prev.forWhom,
    updatedAt: now,
  };
  if (patch.status === 'prayed' && prev.status !== 'prayed') {
    next.prayedAt = now;
  }
  if (patch.status === 'answered' && prev.status !== 'answered') {
    next.answeredAt = now;
  }
  list[idx] = next;
  saveAll(list);
  return next;
}

export function removePrayerMotive(id: string): void {
  saveAll(loadPrayerMotives().filter((m) => m.id !== id));
}

export function markPrayed(id: string): PrayerMotive | null {
  return updatePrayerMotive(id, { status: 'prayed' });
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
