/**
 * Verified $SALVAZION wallet links (server only, service role).
 * See supabase/holder-verify.sql.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { HolderBalance } from '@/lib/solana/holder-balance';

export type HolderLink = {
  userId: string;
  wallet: string;
  verifiedAt: string;
  balanceRaw: string;
  balanceUi: number;
  balanceCheckedAt: string;
  bonusActive: boolean;
  bonusActivatedAt: string | null;
};

type Row = {
  user_id: string;
  wallet: string;
  verified_at: string;
  balance_raw: string | number;
  balance_ui: string | number;
  balance_checked_at: string;
  bonus_active: boolean;
  bonus_activated_at: string | null;
};

const COLS =
  'user_id, wallet, verified_at, balance_raw, balance_ui, balance_checked_at, bonus_active, bonus_activated_at';

function toLink(r: Row): HolderLink {
  return {
    userId: r.user_id,
    wallet: r.wallet,
    verifiedAt: r.verified_at,
    balanceRaw: String(r.balance_raw ?? '0'),
    balanceUi: Number(r.balance_ui ?? 0),
    balanceCheckedAt: r.balance_checked_at,
    bonusActive: Boolean(r.bonus_active),
    bonusActivatedAt: r.bonus_activated_at,
  };
}

export class HolderStoreUnavailable extends Error {
  constructor(msg = 'holder_store_unavailable') {
    super(msg);
  }
}

export async function getHolderLink(userId: string): Promise<HolderLink | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from('wallet_holder_links')
    .select(COLS)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new HolderStoreUnavailable(error.message);
  return data ? toLink(data as Row) : null;
}

export async function findLinkByWallet(wallet: string): Promise<HolderLink | null> {
  const admin = createAdminClient();
  if (!admin) throw new HolderStoreUnavailable();
  const { data, error } = await admin
    .from('wallet_holder_links')
    .select(COLS)
    .eq('wallet', wallet)
    .maybeSingle();
  if (error) throw new HolderStoreUnavailable(error.message);
  return data ? toLink(data as Row) : null;
}

/** Burn a challenge nonce. false → already used (replay). */
export async function burnNonce(
  nonce: string,
  userId: string,
  wallet: string
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) throw new HolderStoreUnavailable();
  const { error } = await admin
    .from('holder_verify_nonces')
    .insert({ nonce, user_id: userId, wallet });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw new HolderStoreUnavailable(error.message);
}

export type UpsertResult =
  | { ok: true; link: HolderLink; activatedNow: boolean }
  | { ok: false; error: 'wallet_taken' };

/** Create/replace the caller's verified wallet with a fresh balance snapshot. */
export async function upsertVerifiedLink(
  userId: string,
  wallet: string,
  balance: HolderBalance,
  bonusActive: boolean,
  previous: HolderLink | null
): Promise<UpsertResult> {
  const admin = createAdminClient();
  if (!admin) throw new HolderStoreUnavailable();
  const now = new Date().toISOString();
  const activatedNow = bonusActive && !(previous?.bonusActive && previous.wallet === wallet);
  const { data, error } = await admin
    .from('wallet_holder_links')
    .upsert(
      {
        user_id: userId,
        wallet,
        verified_at: now,
        balance_raw: balance.raw,
        balance_ui: balance.ui,
        balance_checked_at: now,
        bonus_active: bonusActive,
        bonus_activated_at: activatedNow ? now : bonusActive ? previous?.bonusActivatedAt ?? now : null,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    )
    .select(COLS)
    .single();
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'wallet_taken' };
    throw new HolderStoreUnavailable(error.message);
  }
  return { ok: true, link: toLink(data as Row), activatedNow };
}

/** Refresh the snapshot after a periodic re-check (best effort). */
export async function updateHolderSnapshot(
  userId: string,
  balance: HolderBalance,
  bonusActive: boolean
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  const now = new Date().toISOString();
  try {
    await admin
      .from('wallet_holder_links')
      .update({
        balance_raw: balance.raw,
        balance_ui: balance.ui,
        balance_checked_at: now,
        bonus_active: bonusActive,
        updated_at: now,
      })
      .eq('user_id', userId);
  } catch {
    // ignore
  }
}

export async function deleteHolderLink(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new HolderStoreUnavailable();
  const { error } = await admin.from('wallet_holder_links').delete().eq('user_id', userId);
  if (error) throw new HolderStoreUnavailable(error.message);
}
