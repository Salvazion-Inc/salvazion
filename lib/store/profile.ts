import { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'salvazion_profile';
const STORAGE_VERSION = 2;

interface StoredPayload {
  v: number;
  ts: number;
  data: Partial<UserProfile>;
  checksum: string;
}

function simpleChecksum(obj: unknown): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function fromDb(row: any): Partial<UserProfile> {
  if (!row) return {};
  return {
    name: row.name ?? '',
    language: row.language ?? 'es',
    spiritualMaturity: row.spiritual_maturity ?? 'growing',
    familyStatus: row.family_status ?? 'family',
    currentFocus: row.current_focus ?? [],
    struggles: row.struggles ?? [],
    preferredBibleVersion: row.preferred_bible_version ?? 'rv1960',
    purpose: row.purpose ?? '',
    city: row.city ?? '',
    country: row.country ?? '',
    birthDate: row.birth_date ?? '',
    hasAcceptedLionCoach: row.has_accepted_lion_coach ?? false,
    onboardingCompleted: row.onboarding_completed ?? false,
    // familyLinks / friendsLinks live primarily in localStorage for now
    // (schema does not yet persist the social graph). Callers must merge.
    familyLinks: [],
    friendsLinks: [],
  };
}

function toDb(profile: Partial<UserProfile>) {
  return {
    name: profile.name,
    language: profile.language,
    spiritual_maturity: profile.spiritualMaturity,
    family_status: profile.familyStatus,
    current_focus: profile.currentFocus,
    struggles: profile.struggles,
    preferred_bible_version: profile.preferredBibleVersion,
    purpose: profile.purpose,
    city: profile.city,
    country: profile.country,
    birth_date: profile.birthDate || null,
    has_accepted_lion_coach: profile.hasAcceptedLionCoach,
    onboarding_completed: profile.onboardingCompleted,
  };
}

function saveLocal(profile: Partial<UserProfile>) {
  if (typeof window === 'undefined') return;
  const current = loadLocal();
  const merged = { ...current, ...profile };
  const payload: StoredPayload = {
    v: STORAGE_VERSION,
    ts: Date.now(),
    data: merged,
    checksum: simpleChecksum(merged),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadLocal(): Partial<UserProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed.v && !parsed.data) return parsed as Partial<UserProfile>;
    const payload = parsed as StoredPayload;
    if (payload.checksum !== simpleChecksum(payload.data)) {
      console.warn('[Salvazion] Profile integrity check failed.');
      return { ...payload.data, _integrityWarning: true } as any;
    }
    return payload.data;
  } catch {
    return {};
  }
}

/**
 * Load profile (async).
 * Source of truth: Supabase when authenticated. Local cache as fallback / offline.
 * familyLinks & friendsLinks are merged from localStorage (not yet in DB schema).
 */
export async function loadProfileAsync(): Promise<Partial<UserProfile>> {
  const local = loadLocal();
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const profile = fromDb(data);
        // Preserve local social graph until we add a proper links table
        profile.familyLinks = local.familyLinks ?? [];
        profile.friendsLinks = local.friendsLinks ?? [];
        saveLocal(profile);
        return profile;
      }
    }
  } catch (e) {
    console.warn('[Salvazion] Supabase profile load failed, using local', e);
  }
  return local;
}

/** Sync load for existing components (reads local cache). Prefer loadProfileAsync when possible. */
export function loadProfile(): Partial<UserProfile> {
  return loadLocal();
}

/**
 * Save profile.
 * Optimistic local write + upsert to Supabase when session exists.
 */
export async function saveProfile(profile: Partial<UserProfile>) {
  saveLocal(profile);

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...toDb(profile),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[Salvazion] Profile upsert failed', error);
    }
  } catch (e) {
    console.warn('[Salvazion] Supabase save failed', e);
  }
}

export function clearProfile() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('salvazion_actions');
  localStorage.removeItem('salvazion_streaks');
  localStorage.removeItem('salvazion_badges');
}

export async function signOut() {
  clearProfile();
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {}
}

export function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

export type LifeStage =
  | 'infancia'
  | 'juventud'
  | 'young_adult'
  | 'adult'
  | 'mature'
  | 'senior'
  | 'unknown';

export function getLifeStage(age: number | null): LifeStage {
  if (age === null) return 'unknown';
  if (age < 13) return 'infancia';
  if (age < 18) return 'juventud';
  if (age < 30) return 'young_adult';
  if (age < 50) return 'adult';
  if (age < 65) return 'mature';
  return 'senior';
}

export function getLifeStageLabel(stage: LifeStage, lang: 'es' | 'en' = 'es'): string {
  const labels = {
    es: {
      infancia: 'Infancia',
      juventud: 'Juventud',
      young_adult: 'Adulto joven',
      adult: 'Adultez',
      mature: 'Madurez',
      senior: 'Senior',
      unknown: '—',
    },
    en: {
      infancia: 'Childhood',
      juventud: 'Youth',
      young_adult: 'Young Adult',
      adult: 'Adulthood',
      mature: 'Mature',
      senior: 'Senior',
      unknown: '—',
    },
  };
  return labels[lang][stage];
}
