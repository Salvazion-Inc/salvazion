/**
 * First-touch UTM attribution (DEC-20261021-05).
 * Pure helpers shared by proxy (capture), signup (user_metadata), auth
 * callback/confirm (write to profiles) and checkout (Stripe metadata).
 */
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

export const UTM_COOKIE = 'slz_utm';
export const UTM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const MAX_LEN = 100;

/** Keep only [A-Za-z0-9 _.-+], trim, cap at 100 chars. Empty → undefined. */
export function sanitizeUtmValue(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const v = raw.replace(/[^A-Za-z0-9 _.+\-]/g, '').trim().slice(0, MAX_LEN);
  return v ? v : undefined;
}

function clean(get: (k: UtmKey) => unknown): Utm | null {
  const out: Utm = {};
  for (const k of UTM_KEYS) {
    const v = sanitizeUtmValue(get(k));
    if (v) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

export function utmFromSearchParams(sp: URLSearchParams): Utm | null {
  return clean((k) => sp.get(k));
}

export function utmFromRecord(rec: unknown): Utm | null {
  if (!rec || typeof rec !== 'object') return null;
  const r = rec as Record<string, unknown>;
  return clean((k) => r[k]);
}

export function serializeUtmCookie(utm: Utm): string {
  return encodeURIComponent(JSON.stringify(utm));
}

export function parseUtmCookie(value: string | undefined | null): Utm | null {
  if (!value) return null;
  // Next's cookies.set() percent-encodes again, so the raw browser value
  // (document.cookie) is double-encoded while request.cookies is single.
  let v = value;
  for (let i = 0; i < 3; i++) {
    try {
      return utmFromRecord(JSON.parse(v));
    } catch {
      try {
        v = decodeURIComponent(v);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Only non-empty values; safe for Stripe metadata (≤500 chars/value). */
export function utmToMetadata(utm: Utm | null | undefined): Record<string, string> {
  return utmFromRecord(utm) ?? {};
}

/** Columns for profiles (first-touch stamp). */
export function utmToProfileColumns(utm: Utm, now = new Date()) {
  return {
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_content: utm.utm_content ?? null,
    utm_term: utm.utm_term ?? null,
    utm_captured_at: now.toISOString(),
  };
}
