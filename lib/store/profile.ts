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
    avatarUrl: row.avatar_url || undefined,
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
    // http(s) → DB; empty string → clear column; data: URLs stay local only
    avatar_url:
      profile.avatarUrl === ''
        ? null
        : profile.avatarUrl && /^https?:\/\//i.test(profile.avatarUrl)
          ? profile.avatarUrl
          : undefined,
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
 * Ensure a profiles (+ streaks) row exists for the current user.
 * Covers race conditions when the DB trigger has not run yet, or was missing.
 */
export async function ensureProfileForUser(preferredName?: string): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[Salvazion] ensureProfile select failed', error);
      return;
    }
    if (data) return;

    const name =
      preferredName?.trim() ||
      (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '') ||
      user.email?.split('@')[0] ||
      '';

    const { error: upsertErr } = await supabase.from('profiles').upsert({
      id: user.id,
      name,
      updated_at: new Date().toISOString(),
    });
    if (upsertErr) {
      console.warn('[Salvazion] ensureProfile upsert failed', upsertErr);
      return;
    }

    // streaks row is optional for UI; ignore conflicts
    await supabase.from('user_streaks').upsert({ user_id: user.id });
  } catch (e) {
    console.warn('[Salvazion] ensureProfileForUser failed', e);
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
      await ensureProfileForUser();

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
        // Prefer server name; if empty, fill from metadata for first onboarding paint
        if (!profile.name) {
          const metaName =
            typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '';
          profile.name = metaName || user.email?.split('@')[0] || local.name || '';
        }
        // Keep local data-URL avatar if server has none yet
        if (!profile.avatarUrl && local.avatarUrl) {
          profile.avatarUrl = local.avatarUrl;
        }
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
  // Merge with current local so partial updates (e.g. only avatar) keep the rest
  const merged = { ...loadLocal(), ...profile };
  saveLocal(merged);

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const row = toDb(merged);
    // Drop undefined keys so we don't wipe columns unintentionally
    const payload: Record<string, unknown> = {
      id: user.id,
      updated_at: new Date().toISOString(),
    };
    for (const [k, v] of Object.entries(row)) {
      if (v !== undefined) payload[k] = v;
    }

    const { error } = await supabase.from('profiles').upsert(payload);

    if (error) {
      // avatar_url column may not exist yet — retry without it
      if (String(error.message || '').includes('avatar_url')) {
        delete payload.avatar_url;
        const { error: e2 } = await supabase.from('profiles').upsert(payload);
        if (e2) console.error('[Salvazion] Profile upsert failed', e2);
      } else {
        console.error('[Salvazion] Profile upsert failed', error);
      }
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
  localStorage.removeItem('salvazion_linked_wallet');
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
