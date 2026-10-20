import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { fetchHolderBalance, hasPositiveBalance } from '@/lib/solana/holder-balance';
import { getHolderLink, updateHolderSnapshot, type HolderLink } from './holder-links';
import { getEntitlementForUser } from './subscription';
import {
  AI_FEATURES,
  FREE_AI_LIMITS,
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

/** auth.users ids only. Anonymous and synthetic keys must never create rows. */
const TRACKABLE_USER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTrackableUserId(userId: string): boolean {
  return TRACKABLE_USER_ID.test(userId);
}

export async function getRequestUser(): Promise<{
  id: string;
  email?: string | null;
  emailConfirmedAt?: string | null;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const email = user.email?.trim() || null;
    const confirmed = user.email_confirmed_at || user.confirmed_at || null;
    // No address (OAuth without email) stays gated until one is confirmed.
    const emailConfirmedAt = email && email.includes('@') ? confirmed : null;
    return { id: user.id, email, emailConfirmedAt };
  } catch {
    return null;
  }
}

/** If the RPC is down, trust a verified snapshot this recent. */
const SNAPSHOT_GRACE_MS = 24 * 60 * 60 * 1000;

export function clearHolderCache(userId: string): void {
  holderCache.delete(userId);
}

/**
 * Verified wallet snapshot (wallet_holder_links, /api/wallet/holder/verify).
 * DEC-20261014-01: a positive balance does not change Free AI limits.
 * The link is still refreshed so the included Premium month can read it.
 * The legacy unverified profiles.solana_wallet is not this link.
 */
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

  let link: HolderLink | null = null;
  try {
    link = await getHolderLink(userId);
  } catch {
    link = null;
  }
  if (!link) {
    holderCache.set(userId, { at: Date.now(), amount: null, holder: false, wallet: null });
    return { holder: false, amount: null, wallet: null };
  }

  let amount: number | null = null;
  let holder = false;
  try {
    const balance = await fetchHolderBalance(link.wallet);
    amount = balance.ui;
    holder = hasPositiveBalance(balance);
    if (balance.raw !== link.balanceRaw || holder !== link.bonusActive) {
      await updateHolderSnapshot(userId, balance, holder);
    }
  } catch {
    const age = Date.now() - Date.parse(link.balanceCheckedAt);
    if (Number.isFinite(age) && age < SNAPSHOT_GRACE_MS) {
      amount = link.balanceUi;
      holder = link.bonusActive && hasPositiveBalance({ raw: link.balanceRaw, ui: link.balanceUi });
    }
  }

  holderCache.set(userId, { at: Date.now(), amount, holder, wallet: link.wallet });
  return { holder, amount, wallet: link.wallet };
}

function buildState(
  feature: AiFeature,
  opts: {
    isPremium: boolean;
    salvazionBalance: number | null;
    used: number;
  }
): AiQuotaState {
  const spec = FREE_AI_LIMITS[feature];
  const start = periodStartUtc(spec.period);
  // DEC-20261014-01: holder status never raises the Free cap or the UI flag.
  if (opts.isPremium) {
    return {
      feature,
      allowed: true,
      unlimited: true,
      isPremium: true,
      holderBonus: false,
      salvazionBalance: opts.salvazionBalance,
      used: opts.used,
      limit: null,
      remaining: null,
      period: spec.period,
      periodStart: start,
      resetAt: null,
    };
  }
  const limit = freeLimitFor(feature);
  const used = Math.max(0, opts.used);
  const remaining = Math.max(0, limit - used);
  return {
    feature,
    allowed: remaining > 0,
    unlimited: false,
    isPremium: false,
    holderBonus: false,
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
        salvazionBalance: holder.amount,
        used,
      });
    })
  );
  return {
    signedIn: true,
    isPremium: ent.isPremium,
    holderBonus: false,
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
  // Stop creating counters for anyone who is not a real account. Existing
  // ai_usage rows stay as they are — this is not a migration.
  if (!isTrackableUserId(userId)) return null;
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
  if (!isTrackableUserId(userId)) return null;
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
  if (!isTrackableUserId(userId)) {
    return {
      ...buildState(feature, {
        isPremium: false,
        salvazionBalance: null,
        used: 0,
      }),
      allowed: false,
      tracked: false,
    };
  }

  const [ent, holder] = await Promise.all([
    getEntitlementForUser(userId, email),
    resolveHolder(userId),
  ]);

  if (ent.isPremium) {
    return {
      ...buildState(feature, {
        isPremium: true,
        salvazionBalance: holder.amount,
        used: 0,
      }),
      tracked: true,
    };
  }

  const spec = FREE_AI_LIMITS[feature];
  const start = periodStartUtc(spec.period);
  const limit = freeLimitFor(feature);

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
        salvazionBalance: holder.amount,
        used,
      }),
      tracked: false,
    };
  }

  return {
    ...buildState(feature, {
      isPremium: false,
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
  if (!isTrackableUserId(userId)) return;
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
  | {
      ok: false;
      status: 401 | 403 | 429;
      error: 'auth_required' | 'email_unverified' | 'quota_exceeded';
      quota?: ConsumeResult;
    };

/**
 * Require a verified account and an available Free/Premium slot.
 * A missing Supabase env allows a non-tracked local pass only outside
 * production and Vercel. That pass does not write a counter.
 */
export async function requireAiQuota(
  feature: AiFeature,
  _lang: 'es' | 'en' | 'pt' = 'es'
): Promise<QuotaGate> {
  const user = await getRequestUser();
  if (!user) {
    // Local dev without Supabase env only. Preview and production never
    // invent a user, and this path does not write an AI counter.
    const allowLocal =
      !isSupabasePublicConfigured() &&
      process.env.NODE_ENV !== 'production' &&
      !process.env.VERCEL;
    if (allowLocal) {
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
  if (!user.emailConfirmedAt) {
    return { ok: false, status: 403, error: 'email_unverified' };
  }
  const quota = await consumeAiQuota(user.id, feature, user.email);
  if (!quota.allowed) {
    return { ok: false, status: 429, error: 'quota_exceeded', quota };
  }
  return { ok: true, user, quota };
}

export function authRequiredMessage(lang: 'es' | 'en' | 'pt'): string {
  if (lang === 'en') return 'Sign in with a verified email to use Salvazion AI on the Free plan.';
  if (lang === 'pt') return 'Entre com um email verificado para usar a IA Salvazion no plano Free.';
  return 'Entra con un email verificado para usar la IA de Salvazion en el plan Free.';
}

export function emailUnverifiedMessage(lang: 'es' | 'en' | 'pt'): string {
  if (lang === 'en') return 'Verify your email to use Salvazion. The Free plan is available after that.';
  if (lang === 'pt') return 'Verifique seu email para usar a Salvazion. O plano Free fica disponível depois disso.';
  return 'Verifica tu email para usar Salvazion. El plan Free queda disponible después.';
}

export function quotaGateMessage(
  gate: Extract<QuotaGate, { ok: false }>,
  lang: 'es' | 'en' | 'pt'
): string {
  if (gate.error === 'email_unverified') return emailUnverifiedMessage(lang);
  if (gate.error === 'quota_exceeded' && gate.quota) return quotaUserMessage(gate.quota, lang);
  return authRequiredMessage(lang);
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
      return `Free AI limit reached ${when} (${state.limit}). Upgrade to Premium — $49/mo for unlimited.`;
    }
    if (lang === 'pt') {
      return `Limite Free de IA atingido ${when} (${state.limit}). Passe para Premium — $49/mês para ilimitado.`;
    }
    return `Cupo Free de IA agotado ${when} (${state.limit}). Mejora a Premium — $49/mes para ilimitado.`;
  }
  const used = state.used;
  const limit = state.limit ?? 0;
  if (lang === 'en') return `${used} / ${limit} Free uses remaining in this period.`;
  if (lang === 'pt') return `${used} / ${limit} usos Free neste período.`;
  return `${used} / ${limit} usos Free en este período.`;
}
