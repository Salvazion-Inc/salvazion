/**
 * Seal/unseal small JSON payloads for httpOnly cookies (tokens, PKCE state).
 * Uses AES-256-GCM + key derived from WEARABLES_TOKEN_SECRET (or fallbacks).
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function getKey(): Buffer {
  const secret =
    process.env.WEARABLES_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.XAI_API_KEY ||
    'salvazion-dev-wearables-secret-change-me';
  return createHash('sha256').update(secret).digest();
}

export function sealJson(payload: unknown, maxAgeSec = 60 * 60 * 24 * 90): string {
  const body = JSON.stringify({
    exp: Date.now() + maxAgeSec * 1000,
    data: payload,
  });
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([cipher.update(body, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function unsealJson<T>(token: string): T | null {
  try {
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 28) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(plain) as { exp: number; data: T };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
