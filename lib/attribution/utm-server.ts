import type { SupabaseClient, User } from '@supabase/supabase-js';
import { parseUtmCookie, utmFromRecord, utmToProfileColumns, type Utm } from './utm';

/**
 * First-touch: writes utm_* to profiles only when utm_captured_at is empty.
 * Source: cookie (same device) → user_metadata (set at signUp, survives a
 * confirm on another device). Best-effort: never blocks auth.
 */
export async function stampProfileUtm(
  supabase: SupabaseClient,
  user: User,
  cookieValue: string | undefined
): Promise<void> {
  try {
    const utm: Utm | null = parseUtmCookie(cookieValue) ?? utmFromRecord(user.user_metadata);
    if (!utm) return;
    const { data: existing, error } = await supabase
      .from('profiles')
      .select('utm_captured_at')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      console.warn('[utm] read skipped', error.message);
      return;
    }
    if (!existing || existing.utm_captured_at) return;
    const { error: upErr } = await supabase
      .from('profiles')
      .update(utmToProfileColumns(utm))
      .eq('id', user.id)
      .is('utm_captured_at', null);
    if (upErr) console.warn('[utm] stamp skipped', upErr.message);
  } catch (e) {
    console.warn('[utm] stamp failed', e);
  }
}

/** Profile first-touch UTM for checkout metadata; null if none / columns missing. */
export async function readProfileUtm(supabase: SupabaseClient, userId: string): Promise<Utm | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('utm_source, utm_medium, utm_campaign, utm_content, utm_term')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return utmFromRecord(data);
  } catch {
    return null;
  }
}
