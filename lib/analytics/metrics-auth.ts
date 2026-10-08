/**
 * Bearer-token guard for internal read-only metrics endpoints.
 * Relative imports only (unit-tested with tsx).
 */
import { createHash, timingSafeEqual } from 'node:crypto';

export type MetricsAuth = 'ok' | 'unauthorized' | 'not_configured';

function digest(v: string): Buffer {
  return createHash('sha256').update(v, 'utf8').digest();
}

/** Constant-time compare (hashing first so length differences don't leak). */
export function safeTokenEqual(given: string, expected: string): boolean {
  return timingSafeEqual(digest(given), digest(expected)) && given.length === expected.length;
}

export function bearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return m ? m[1] : null;
}

export function checkMetricsAuth(
  authorization: string | null | undefined,
  expected: string | undefined
): MetricsAuth {
  const secret = expected?.trim();
  if (!secret) return 'not_configured';
  const given = bearerToken(authorization);
  if (!given) return 'unauthorized';
  return safeTokenEqual(given, secret) ? 'ok' : 'unauthorized';
}
