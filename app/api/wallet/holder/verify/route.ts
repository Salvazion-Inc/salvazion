import { NextRequest, NextResponse } from 'next/server';
import { clearHolderCache, getRequestUser } from '@/lib/billing/ai-usage';
import {
  AI_FEATURES,
  SALVAZION_HOLDER_MULTIPLIER,
  freeLimitFor,
  type AiFeature,
} from '@/lib/billing/ai-quota';
import {
  HolderStoreUnavailable,
  burnNonce,
  findLinkByWallet,
  getHolderLink,
  upsertVerifiedLink,
} from '@/lib/billing/holder-links';
import { holderSecret, isSameOrigin, readJson, requestHost } from '@/lib/billing/holder-api';
import { consumeRateLimit } from '@/lib/billing/request-guard';
import { logProductEvent } from '@/lib/analytics/product-events';
import { fetchHolderBalance, hasPositiveBalance } from '@/lib/solana/holder-balance';
import {
  buildHolderMessage,
  decodeSignature,
  verifyChallengeToken,
  verifyWalletSignature,
} from '@/lib/solana/holder-proof';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function err(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * Verify the signed challenge, read the live $SALVAZION balance (Token-2022)
 * and activate the holder bonus (2× Free AI limits) when balance > 0.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return err('forbidden', 403);
  const user = await getRequestUser();
  if (!user) return err('auth_required', 401);
  const secret = holderSecret();
  if (!secret) return err('not_configured', 503);
  if (!consumeRateLimit(`holder-verify:${user.id}`, 10, 10 * 60 * 1000)) {
    return err('rate_limited', 429);
  }

  const body = await readJson(req);
  const checked = verifyChallengeToken(body.token, secret);
  if (!checked.ok) return err(checked.error, 400);
  const p = checked.payload;
  if (p.userId !== user.id) return err('wrong_account', 403);
  if (p.domain !== requestHost(req)) return err('wrong_domain', 400);
  if (typeof body.wallet === 'string' && body.wallet.trim() !== p.wallet) {
    return err('wallet_mismatch', 400);
  }

  const signature = decodeSignature(body.signature);
  if (!signature || !verifyWalletSignature(buildHolderMessage(p), signature, p.wallet)) {
    return err('invalid_signature', 401);
  }

  try {
    if (!(await burnNonce(p.nonce, user.id, p.wallet))) return err('replay', 409);
    const other = await findLinkByWallet(p.wallet);
    if (other && other.userId !== user.id) return err('wallet_taken', 409);

    let balance;
    try {
      balance = await fetchHolderBalance(p.wallet);
    } catch (e) {
      console.warn('[holder/verify] rpc', e instanceof Error ? e.message : e);
      return err('rpc_unavailable', 502);
    }
    const bonusActive = hasPositiveBalance(balance);
    const previous = await getHolderLink(user.id);
    const saved = await upsertVerifiedLink(user.id, p.wallet, balance, bonusActive, previous);
    if (!saved.ok) return err(saved.error, 409);
    clearHolderCache(user.id);

    if (saved.activatedNow) {
      await logProductEvent(
        'bono_activado',
        user.id,
        { wallet: p.wallet, balance_ui: balance.ui, multiplier: SALVAZION_HOLDER_MULTIPLIER },
        req.headers
      );
    }

    const limits = {} as Record<AiFeature, number>;
    for (const f of AI_FEATURES) limits[f] = freeLimitFor(f, bonusActive);
    return NextResponse.json({
      ok: true,
      wallet: p.wallet,
      verifiedAt: saved.link.verifiedAt,
      balance: balance.ui,
      bonusActive,
      activatedNow: saved.activatedNow,
      multiplier: SALVAZION_HOLDER_MULTIPLIER,
      limits,
    });
  } catch (e) {
    if (e instanceof HolderStoreUnavailable) {
      console.warn('[holder/verify] store', e.message);
      return err('not_configured', 503);
    }
    throw e;
  }
}
