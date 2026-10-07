/**
 * $SALVAZION holder bonus — wallet ownership proof (pure, server-safe).
 *
 * Flow: the signed-in user asks for a challenge → the server returns a
 * human-readable message bound to (domain, user id, wallet, nonce, issuedAt)
 * plus an HMAC token over the same fields → the wallet signs the message
 * (ed25519 `signMessage`, read-only: no transaction, no fee) → the server
 * rebuilds the exact message from the token, checks HMAC + expiry + user,
 * verifies the ed25519 signature, and burns the nonce (single use).
 *
 * Relative imports only so `npm test` (tsx) can load it without path aliases.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export const HOLDER_CHALLENGE_TTL_MS = 10 * 60 * 1000;
/** Allow small clock skew for issuedAt in the future. */
const FUTURE_SKEW_MS = 60 * 1000;

export type HolderLang = 'es' | 'en' | 'pt';

export type HolderChallengePayload = {
  v: 1;
  domain: string;
  userId: string;
  wallet: string;
  nonce: string;
  issuedAt: string;
  lang: HolderLang;
};

export function isValidSolanaAddress(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (s.length < 32 || s.length > 44) return false;
  try {
    return bs58.decode(s).length === 32;
  } catch {
    return false;
  }
}

export function newNonce(): string {
  return randomBytes(16).toString('hex');
}

const HEADERS: Record<HolderLang, [string, string]> = {
  es: [
    'Salvazion: verificar wallet para el bono holder del plan Free (IA).',
    'Esta firma solo prueba que la wallet es tuya. No es una transacción, no mueve fondos y no tiene costo.',
  ],
  en: [
    'Salvazion: verify wallet for the Free plan holder bonus (AI).',
    'This signature only proves you own this wallet. It is not a transaction, moves no funds and costs nothing.',
  ],
  pt: [
    'Salvazion: verificar wallet para o bônus holder do plano Free (IA).',
    'Esta assinatura só prova que a wallet é sua. Não é uma transação, não move fundos e não tem custo.',
  ],
};

/** Exact text the wallet signs. Must be rebuilt byte-for-byte on verify. */
export function buildHolderMessage(p: HolderChallengePayload): string {
  const [title, body] = HEADERS[p.lang] ?? HEADERS.es;
  return [
    title,
    body,
    '',
    `Domain: ${p.domain}`,
    `Wallet: ${p.wallet}`,
    `Account: ${p.userId}`,
    `Nonce: ${p.nonce}`,
    `Issued At: ${p.issuedAt}`,
  ].join('\n');
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

function hmac(secret: string, data: string): Buffer {
  return createHmac('sha256', `salvazion-holder-v1:${secret}`).update(data).digest();
}

export function signChallengeToken(
  payload: HolderChallengePayload,
  secret: string
): string {
  const body = b64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const mac = b64url(hmac(secret, body));
  return `${body}.${mac}`;
}

export type TokenCheck =
  | { ok: true; payload: HolderChallengePayload }
  | { ok: false; error: 'bad_token' | 'expired' };

export function verifyChallengeToken(
  token: unknown,
  secret: string,
  now = Date.now()
): TokenCheck {
  if (typeof token !== 'string' || token.length > 4096) {
    return { ok: false, error: 'bad_token' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, error: 'bad_token' };
  const [body, mac] = parts;
  let given: Buffer;
  try {
    given = Buffer.from(mac, 'base64url');
  } catch {
    return { ok: false, error: 'bad_token' };
  }
  const expected = hmac(secret, body);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, error: 'bad_token' };
  }
  let payload: HolderChallengePayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, error: 'bad_token' };
  }
  if (
    !payload ||
    payload.v !== 1 ||
    typeof payload.domain !== 'string' ||
    typeof payload.userId !== 'string' ||
    typeof payload.nonce !== 'string' ||
    typeof payload.issuedAt !== 'string' ||
    !isValidSolanaAddress(payload.wallet) ||
    !['es', 'en', 'pt'].includes(payload.lang)
  ) {
    return { ok: false, error: 'bad_token' };
  }
  const issued = Date.parse(payload.issuedAt);
  if (!Number.isFinite(issued)) return { ok: false, error: 'bad_token' };
  if (issued > now + FUTURE_SKEW_MS) return { ok: false, error: 'bad_token' };
  if (now - issued > HOLDER_CHALLENGE_TTL_MS) return { ok: false, error: 'expired' };
  return { ok: true, payload };
}

/** Accept base58 (Phantom/Solflare default) or base64 signatures. */
export function decodeSignature(input: unknown): Uint8Array | null {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  if (!s || s.length > 200) return null;
  try {
    const raw = bs58.decode(s);
    if (raw.length === 64) return raw;
  } catch {
    // not base58
  }
  try {
    if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(s)) {
      const raw = Buffer.from(s, s.includes('-') || s.includes('_') ? 'base64url' : 'base64');
      if (raw.length === 64) return new Uint8Array(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

/** ed25519 detached signature check of `message` by `wallet` (base58 pubkey). */
export function verifyWalletSignature(
  message: string,
  signature: Uint8Array,
  wallet: string
): boolean {
  if (!isValidSolanaAddress(wallet) || signature.length !== 64) return false;
  try {
    const pubkey = bs58.decode(wallet);
    return nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      signature,
      pubkey
    );
  } catch {
    return false;
  }
}

/** Shape of one entry from getTokenAccountsByOwner (jsonParsed). */
export type ParsedTokenAccount = {
  account?: {
    data?: {
      parsed?: {
        info?: {
          mint?: string;
          tokenAmount?: { amount?: string; decimals?: number };
        };
      };
    };
  };
};

/** Sum raw (integer) balances of `mint` across every token account. */
export function sumMintBalance(
  accounts: ParsedTokenAccount[],
  mint: string,
  decimals: number
): { raw: string; ui: number } {
  let total = BigInt(0);
  for (const acc of accounts) {
    const info = acc?.account?.data?.parsed?.info;
    if (!info || info.mint !== mint) continue;
    const amt = info.tokenAmount?.amount;
    if (typeof amt !== 'string' || !/^\d+$/.test(amt)) continue;
    total += BigInt(amt);
  }
  const raw = total.toString();
  const base = BigInt(10) ** BigInt(decimals);
  const whole = total / base;
  const frac = total % base;
  const ui = Number(whole) + Number(frac) / Number(base);
  return { raw, ui };
}
