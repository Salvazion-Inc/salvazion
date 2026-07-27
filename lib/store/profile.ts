import { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { extractXIdentity } from '@/lib/auth/x-oauth';

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
    sex:
      row.sex === 'female' || row.sex === 'male' || row.sex === 'unspecified'
        ? row.sex
        : undefined,
    avatarUrl: row.avatar_url || undefined,
    xUsername: row.x_username || undefined,
    xUserId: row.x_user_id || undefined,
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
    sex: profile.sex || null,
    // http(s) → DB; empty string → clear column; data: URLs stay local only
    avatar_url:
      profile.avatarUrl === ''
        ? null
        : profile.avatarUrl && /^https?:\/\//i.test(profile.avatarUrl)
          ? profile.avatarUrl
          : undefined,
    x_username: profile.xUsername || null,
    x_user_id: profile.xUserId || null,
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
/**
 * Merge X OAuth identity into profile fields (name, avatar, handle).
 * Safe to call on every session start.
 */
export async function applyXIdentityToProfile(): Promise<Partial<UserProfile> | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const x = extractXIdentity(user);
    if (!x) return null;

    const local = loadLocal();
    const patch: Partial<UserProfile> = {
      xUsername: x.username,
      xUserId: x.userId,
    };

    // Prefer X display name only when profile name is empty
    if (!local.name?.trim() && x.displayName) {
      patch.name = x.displayName;
    } else if (!local.name?.trim()) {
      patch.name = x.username;
    }

    // Prefer X avatar when none set (or previous was also from X/twitter CDN)
    if (x.avatarUrl) {
      if (
        !local.avatarUrl ||
        /twimg\.com|twitter\.com|pbs\.twimg/i.test(local.avatarUrl)
      ) {
        patch.avatarUrl = x.avatarUrl;
      }
    }

    // Persist to local immediately
    saveLocal(patch);

    // Upsert X fields + name/avatar to Supabase
    const payload: Record<string, unknown> = {
      id: user.id,
      x_username: x.username,
      x_user_id: x.userId || null,
      updated_at: new Date().toISOString(),
    };
    if (patch.name) payload.name = patch.name;
    if (patch.avatarUrl && /^https?:\/\//i.test(patch.avatarUrl)) {
      payload.avatar_url = patch.avatarUrl;
    }

    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) {
      // Column may not exist yet — retry without x_* fields
      if (
        String(error.message || '').includes('x_username') ||
        String(error.message || '').includes('x_user_id')
      ) {
        delete payload.x_username;
        delete payload.x_user_id;
        await supabase.from('profiles').upsert(payload);
        console.warn(
          '[Salvazion] profiles.x_username missing — run supabase/x-auth.sql'
        );
      } else {
        console.warn('[Salvazion] applyXIdentity upsert failed', error);
      }
    }

    return { ...loadLocal() };
  } catch (e) {
    console.warn('[Salvazion] applyXIdentityToProfile failed', e);
    return null;
  }
}

export async function ensureProfileForUser(preferredName?: string): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const x = extractXIdentity(user);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, x_username')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[Salvazion] ensureProfile select failed', error);
      // still try X apply locally
      await applyXIdentityToProfile();
      return;
    }

    const name =
      preferredName?.trim() ||
      (data?.name && String(data.name).trim()) ||
      x?.displayName ||
      (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '') ||
      x?.username ||
      user.email?.split('@')[0] ||
      '';

    if (!data) {
      const insert: Record<string, unknown> = {
        id: user.id,
        name,
        updated_at: new Date().toISOString(),
      };
      if (x?.username) insert.x_username = x.username;
      if (x?.userId) insert.x_user_id = x.userId;
      if (x?.avatarUrl) insert.avatar_url = x.avatarUrl;

      const { error: upsertErr } = await supabase.from('profiles').upsert(insert);
      if (upsertErr) {
        // Retry without x columns if migration not applied
        delete insert.x_username;
        delete insert.x_user_id;
        const { error: e2 } = await supabase.from('profiles').upsert(insert);
        if (e2) console.warn('[Salvazion] ensureProfile upsert failed', e2);
      }
      await supabase.from('user_streaks').upsert({ user_id: user.id });
    } else {
      // Existing row: fill empty name / missing X handle from OAuth
      await applyXIdentityToProfile();
    }
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
        // Prefer server name; if empty, fill from metadata / X for first onboarding paint
        if (!profile.name) {
          const x = extractXIdentity(user);
          const metaName =
            typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '';
          profile.name =
            metaName || x?.displayName || x?.username || user.email?.split('@')[0] || local.name || '';
        }
        // X handle: server first, then identity, then local
        if (!profile.xUsername) {
          const x = extractXIdentity(user);
          profile.xUsername = x?.username || local.xUsername;
          profile.xUserId = x?.userId || local.xUserId;
        }
        // Keep local data-URL avatar if server has none yet
        if (!profile.avatarUrl && local.avatarUrl) {
          profile.avatarUrl = local.avatarUrl;
        }
        // Apply X identity if still missing handle (non-blocking)
        if (!profile.xUsername) {
          void applyXIdentityToProfile();
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
