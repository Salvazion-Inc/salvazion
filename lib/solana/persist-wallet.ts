/**
 * Persist the linked Solana address on the user's profile
 * so the server can verify $SALVAZION on-chain (holder bonus).
 */
import { createClient } from '@/lib/supabase/client';

export async function persistWalletToProfile(
  address: string | null
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      solana_wallet: address,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('[Salvazion] persist solana_wallet failed', error.message);
    }
  } catch {
    // ignore — column may not exist until supabase/ai-usage.sql is applied
  }
}
