import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/billing/ai-usage';
import { findLinkByWallet } from '@/lib/billing/holder-links';
import { holderSecret, isSameOrigin, parseLang, readJson, requestHost } from '@/lib/billing/holder-api';
import { consumeRateLimit } from '@/lib/billing/request-guard';
import {
  HOLDER_CHALLENGE_TTL_MS,
  buildHolderMessage,
  isValidSolanaAddress,
  newNonce,
  signChallengeToken,
  type HolderChallengePayload,
} from '@/lib/solana/holder-proof';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Issue a one-time, read-only message for the wallet to sign. */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  const secret = holderSecret();
  if (!secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (!consumeRateLimit(`holder-challenge:${user.id}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const body = await readJson(req);
  const wallet = typeof body.wallet === 'string' ? body.wallet.trim() : '';
  if (!isValidSolanaAddress(wallet)) {
    return NextResponse.json({ error: 'invalid_wallet' }, { status: 400 });
  }

  try {
    const other = await findLinkByWallet(wallet);
    if (other && other.userId !== user.id) {
      return NextResponse.json({ error: 'wallet_taken' }, { status: 409 });
    }
  } catch {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const payload: HolderChallengePayload = {
    v: 1,
    domain: requestHost(req),
    userId: user.id,
    wallet,
    nonce: newNonce(),
    issuedAt: new Date().toISOString(),
    lang: parseLang(body.lang),
  };
  return NextResponse.json({
    message: buildHolderMessage(payload),
    token: signChallengeToken(payload, secret),
    expiresAt: new Date(Date.parse(payload.issuedAt) + HOLDER_CHALLENGE_TTL_MS).toISOString(),
  });
}
