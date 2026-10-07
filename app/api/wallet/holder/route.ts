import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, clearHolderCache } from '@/lib/billing/ai-usage';
import { deleteHolderLink, getHolderLink } from '@/lib/billing/holder-links';
import { isSameOrigin } from '@/lib/billing/holder-api';
import { hasPositiveBalance } from '@/lib/solana/holder-balance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Status of the caller's verified $SALVAZION wallet (holder bonus). */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  try {
    const link = await getHolderLink(user.id);
    if (!link) return NextResponse.json({ configured: true, linked: false });
    return NextResponse.json({
      configured: true,
      linked: true,
      wallet: link.wallet,
      verifiedAt: link.verifiedAt,
      balance: link.balanceUi,
      balanceCheckedAt: link.balanceCheckedAt,
      bonusActive:
        link.bonusActive && hasPositiveBalance({ raw: link.balanceRaw, ui: link.balanceUi }),
    });
  } catch {
    return NextResponse.json({ configured: false, linked: false });
  }
}

/** Unlink the verified wallet (frees it; bonus stops). */
export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  try {
    await deleteHolderLink(user.id);
    clearHolderCache(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
