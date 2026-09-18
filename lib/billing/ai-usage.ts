import { Connection, PublicKey } from '@solana/web3.js';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { fetchWalletBalances } from '@/lib/solana/balances';
import { getSolanaRpcUrl } from '@/lib/solana/config';
import { getEntitlementForUser } from './subscription';
import {
  AI_FEATURES,
  FREE_AI_LIMITS,
  SALVAZION_HOLDER_MIN,
  emptyQuotaState,
  freeLimitFor,
  periodResetUtc,
  periodStartUtc,
  type AiFeature,
  type AiQuotaState,
  type AiUsageOverview,
} from './ai-quota';

export type { AiFeature, AiQuotaState, AiUsageOverview } from './ai-quota';

const HOLDER_TTL_MS = 5 * 60 * 1000;
const holderCache = new Map<
  string,
  { at: number; amount: number | null; holder: boolean; wallet: string | null }
>();

export function isSupabasePublicConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getRequestUser(): Promise<{
  id: string;
  email?: string | null;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

async function resolveHolder(userId: string): Promise<{
  holder: boolean;
  amount: number | null;
  wallet: string | null;
}> {
  const cached = holderCache.get(userId);
  if (cached && Date.now() - cached.at < HOLDER_TTL_MS) {
    return {
      holder: cached.holder,
      amount: cached.amount,
      wallet: cached.wallet,
    };
  }

  const admin = createAdminClient();
  let wallet: string | null = null;
  if (admin) {
    try {
      const { data } = await admin
        .from('profiles')
        .select('solana_wallet')
        .eq('id', userId)
        .maybeSingle();
      const raw = data?.solana_wallet;
      wallet = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
    } catch {
      wallet = null;
    }
  }

  let amount: number | null = null;
  if (wallet) {
    try {
      const owner = new PublicKey(wallet);
      const connection = new Connection(getSolanaRpcUrl(), 'confirmed');
      const balances = await fetchWalletBalances(connection, owner);
      amount = balances.salvazion;
    } catch {
      amount = null;
    }
  }

  const holder = typeof amount === 'number' && amount >= SALVAZION_HOLDER_MIN;
  holderCache.set(userId, { at: Date.now(), amount, holder, wallet });
  return { holder, amount, wallet };
}

function buildState(
  feature: AiFeature,
  opts: {
    isPremium: boolean;
    holderBonus: boolean;
    salvazionBalance: number | null;
    used: number;
  }
): AiQuotaState {
  const spec = FREE_AI_LIMITS[feature];
  const start = periodStartUtc(spec.period);
  if (opts.isPremium) {
    return {
      feature,
      allowed: true,
      unlimited: true,
      isPremium: true,
      holderBonus: opts.holderBonus,
      salvazionBalance: opts.salvazionBalance,
      used: opts.used,
      limit: null,
      remaining: null,
      period: spec.period,
      periodStart: start,
      resetAt: null,
    };
  }
  const limit = freeLimitFor(feature, opts.holderBonus);
  const used = Math.max(0, opts.used);
  const remaining = Math.max(0, limit - used);
  return {
    feature,
    allowed: remaining > 0,
    unlimited: false,
    isPremium: false,
    holderBonus: opts.holderBonus,
    salvazionBalance: opts.salvazionBalance,
    used,
    limit,
    remaining,
    period: spec.period,
    periodStart: start,
    resetAt: periodResetUtc(spec.period, start),
  };
}

async function readUsed(
  userId: string,
  feature: AiFeature,
  periodStart: string
): Promise<number | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  try {
    const { data, error } = await admin
      .from('ai_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('period_start', periodStart)
      .maybeSingle();
    if (error) return null;
    const n = data?.count;
    return typeof n === 'number' && Number.isFinite(n) ? n : 0;
  } catch {
    return null;
  }
}

/**
 * Snapshot without incrementing. Missing table → treat used as 0.
 */
export async function peekAiQuota(
  userId: string,
  feature: AiFeature,
  email?: string | null
): Promise<AiQuotaState> {
  const [ent, holder] = await Promise.all([
    getEntitlementForUser(userId, email),
    resolveHolder(userId),
  ]);
  const spec = FREE_AI_LIMITS[feature];
  const start = periodStartUtc(spec.period);
  const used = (await readUsed(userId, feature, start)) ?? 0;
  return buildState(feature, {
    isPremium: ent.isPremium,
    holderBonus: holder.holder,
    salvazionBalance: holder.amount,
    used,
  });
}

export async function getAiUsageOverview(
  userId: string,
  email?: string | null
): Promise<AiUsageOverview> {
  const [ent, holder] = await Promise.all([
    getEntitlementForUser(userId, email),
    resolveHolder(userId),
  ]);
  const features = {} as Record<AiFeature, AiQuotaState>;
  await Promise.all(
    AI_FEATURES.map(async (feature) => {
      const spec = FREE_AI_LIMITS[feature];
      const start = periodStartUtc(spec.period);
      const used = (await readUsed(userId, feature, start)) ?? 0;
      features[feature] = buildState(feature, {
        isPremium: ent.isPremium,
        holderBonus: holder.holder,
        salvazionBalance: holder.amount,
        used,
      });
    })
  );
  return {
    signedIn: true,
    isPremium: ent.isPremium,
    holderBonus: holder.holder,
    salvazionBalance: holder.amount,
    wallet: holder.wallet,
    features,
  };
}

export function unsignedUsageOverview(): AiUsageOverview {
  const features = {} as Record<AiFeature, AiQuotaState>;
  for (const feature of AI_FEATURES) {
    features[feature] = {
      ...emptyQuotaState(feature),
      allowed: false,
    };
  }
  return {
    signedIn: false,
    isPremium: false,
    holderBonus: false,
    salvazionBalance: null,
    wallet: null,
    features,
  };
}

export type ConsumeResult = AiQuotaState & { tracked: boolean };

async function incrementViaRpc(
  userId: string,
  feature: AiFeature,
  periodStart: string,
  limit: number
): Promise<{ allowed: boolean; used: number } | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  try {
    const { data, error } = await admin.rpc('consume_ai_usage', {
      p_user_id: userId,
      p_feature: feature,
      p_period_start: periodStart,
      p_limit: limit,
    });
    if (error || data == null) return null;
    const row = typeof data === 'object' ? (data as Record<string, unknown>) : null;
    if (!row) return null;
    const allowed = row.allowed === true;
    const used = typeof row.used === 'number' ? row.used : Number(row.used);
    if (!Number.isFinite(used)) return null;
    return { allowed, used };
  } catch {
    return null;
  }
}

async function incrementFallback(
  userId: string,
  feature: AiFeature,
  periodStart: string,
  limit: number
): Promise<{ allowed: boolean; used: number } | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  try {
    const current = (await readUsed(userId, feature, periodStart)) ?? 0;
    if (current >= limit) return { allowed: false, used: current };
    const next = current + 1;
    const { error } = await admin.from('ai_usage').upsert(
      {
        user_id: userId,
        feature,
        period_start: periodStart,
        count: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,feature,period_start' }
    );
    if (error) return null;
    return { allowed: true, used: next };
  } catch {
    return null;
  }
}

/**
 * Reserve one unit. Premium skips the increment.
 * If the usage table is not applied yet, allow (dev) and mark tracked=false.
 */
export async function consumeAiQuota(
  userId: string,
  feature: AiFeature,
  email?: string | null
): Promise<ConsumeResult> {
  const [ent, holder] = await Promise.all([
    getEntitlementForUser(userId, email),
    resolveHolder(userId),
  ]);

  if (ent.isPremium) {
    return {
      ...buildState(feature, {
        isPremium: true,
        holderBonus: holder.holder,
        salvazionBalance: holder.amount,
        used: 0,
      }),
      tracked: true,
    };
  }

  const spec = FREE_AI_LIMITS[feature];
  const start = periodStartUtc(spec.period);
  const limit = freeLimitFor(feature, holder.holder);

  const viaRpc = await incrementViaRpc(userId, feature, start, limit);
  const bumped = viaRpc ?? (await incrementFallback(userId, feature, start, limit));

  if (!bumped) {
    console.warn(
      '[ai-usage] quota table unavailable — allowing request. Run supabase/ai-usage.sql'
    );
    // Schema not applied — do not block local/dev, but do not pretend it's unlimited.
    const used = 0;
    return {
      ...buildState(feature, {
        isPremium: false,
        holderBonus: holder.holder,
        salvazionBalance: holder.amount,
        used,
      }),
      tracked: false,
    };
  }

  return {
    ...buildState(feature, {
      isPremium: false,
      holderBonus: holder.holder,
      salvazionBalance: holder.amount,
      used: bumped.allowed ? bumped.used : limit,
    }),
    allowed: bumped.allowed,
    tracked: true,
  };
}

export async function refundAiQuota(
  userId: string,
  feature: AiFeature
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  const spec = FREE_AI_LIMITS[feature];
  const start = periodStartUtc(spec.period);
  try {
    const used = (await readUsed(userId, feature, start)) ?? 0;
    if (used <= 0) return;
    await admin
      .from('ai_usage')
      .update({ count: used - 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('period_start', start);
  } catch {
    // ignore
  }
}

export type QuotaGate =
  | { ok: true; user: { id: string; email?: string | null }; quota: ConsumeResult }
  | { ok: false; status: 401 | 429; error: 'auth_required' | 'quota_exceeded'; quota?: ConsumeResult };

/**
 * Require a signed-in user and an available Free/Premium slot.
 * When Supabase public env is missing (local without backend), allow.
 */
export async function requireAiQuota(
  feature: AiFeature,
  _lang: 'es' | 'en' | 'pt' = 'es'
): Promise<QuotaGate> {
  const user = await getRequestUser();
  if (!user) {
    if (!isSupabasePublicConfigured()) {
      return {
        ok: true,
        user: { id: 'local-dev' },
        quota: {
          ...emptyQuotaState(feature, { isPremium: true }),
          tracked: false,
        },
      };
    }
    return { ok: false, status: 401, error: 'auth_required' };
  }
  const quota = await consumeAiQuota(user.id, feature, user.email);
  if (!quota.allowed) {
    return { ok: false, status: 429, error: 'quota_exceeded', quota };
  }
  return { ok: true, user, quota };
}

export function authRequiredMessage(lang: 'es' | 'en' | 'pt'): string {
  if (lang === 'en') return 'Sign in to use Salvazion AI on the Free plan.';
  if (lang === 'pt') return 'Entre na conta para usar a IA Salvazion no plano Free.';
  return 'Inicia sesión para usar la IA de Salvazion en el plan Free.';
}

export function quotaUserMessage(
  state: AiQuotaState,
  lang: 'es' | 'en' | 'pt'
): string {
  if (state.unlimited) {
    return lang === 'en'
      ? 'Unlimited with Premium.'
      : lang === 'pt'
        ? 'Ilimitado no Premium.'
        : 'Ilimitado con Premium.';
  }
  if (!state.allowed) {
    const when =
      state.period === 'week'
        ? lang === 'en'
          ? 'this week'
          : lang === 'pt'
            ? 'esta semana'
            : 'esta semana'
        : lang === 'en'
          ? 'today'
          : lang === 'pt'
            ? 'hoje'
            : 'hoy';
    if (lang === 'en') {
      return `Free AI limit reached ${when} (${state.limit}). Upgrade to Premium — $49/mo for unlimited. $SALVAZION only doubles the Free cap.`;
    }
    if (lang === 'pt') {
      return `Limite Free de IA atingido ${when} (${state.limit}). Passe para Premium — $49/mês para ilimitado. $SALVAZION só dobra a cota Free.`;
    }
    return `Cupo Free de IA agotado ${when} (${state.limit}). Mejora a Premium — $49/mes para ilimitado. $SALVAZION solo duplica el cupo Free.`;
  }
  const used = state.used;
  const limit = state.limit ?? 0;
  if (lang === 'en') return `${used} / ${limit} Free uses remaining in this period.`;
  if (lang === 'pt') return `${used} / ${limit} usos Free neste período.`;
  return `${used} / ${limit} usos Free en este período.`;
}
