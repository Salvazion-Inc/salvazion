/**
 * Free vs Premium AI catalog (Grok / xAI).
 * Free = limited. Premium = unlimited.
 * Holding $SALVAZION (on-chain) doubles Free limits.
 */

export type AiFeature =
  | 'coach_chat'
  | 'coach_tts'
  | 'devotional_ai'
  | 'vision_body'
  | 'vision_meal';

export type QuotaPeriod = 'day' | 'week';

export type AiFeatureQuota = {
  period: QuotaPeriod;
  limit: number;
};

export const AI_FEATURES: AiFeature[] = [
  'coach_chat',
  'coach_tts',
  'devotional_ai',
  'vision_body',
  'vision_meal',
];

/** Base Free limits. Premium ignores these. */
export const FREE_AI_LIMITS: Record<AiFeature, AiFeatureQuota> = {
  coach_chat: { period: 'day', limit: 5 },
  coach_tts: { period: 'day', limit: 3 },
  devotional_ai: { period: 'day', limit: 1 },
  vision_body: { period: 'week', limit: 2 },
  vision_meal: { period: 'day', limit: 3 },
};

/** Any verified on-chain $SALVAZION > 0 doubles Free AI limits. */
export const SALVAZION_HOLDER_MIN = 1;
export const SALVAZION_HOLDER_MULTIPLIER = 2;

export function isAiFeature(value: unknown): value is AiFeature {
  return typeof value === 'string' && (AI_FEATURES as string[]).includes(value);
}

export function periodStartUtc(period: QuotaPeriod, now = new Date()): string {
  if (period === 'day') return now.toISOString().slice(0, 10);
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const weekday = d.getUTCDay(); // 0 Sun … 6 Sat
  const diff = weekday === 0 ? 6 : weekday - 1; // Monday-start ISO week
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function periodResetUtc(period: QuotaPeriod, start: string): string {
  const d = new Date(`${start}T00:00:00.000Z`);
  if (period === 'day') d.setUTCDate(d.getUTCDate() + 1);
  else d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString();
}

export function freeLimitFor(
  feature: AiFeature,
  holderBonus: boolean
): number {
  const base = FREE_AI_LIMITS[feature].limit;
  return holderBonus ? base * SALVAZION_HOLDER_MULTIPLIER : base;
}

export type AiQuotaState = {
  feature: AiFeature;
  allowed: boolean;
  unlimited: boolean;
  isPremium: boolean;
  holderBonus: boolean;
  salvazionBalance: number | null;
  used: number;
  limit: number | null;
  remaining: number | null;
  period: QuotaPeriod | null;
  periodStart: string | null;
  resetAt: string | null;
};

export type AiUsageOverview = {
  signedIn: boolean;
  isPremium: boolean;
  holderBonus: boolean;
  salvazionBalance: number | null;
  wallet: string | null;
  features: Record<AiFeature, AiQuotaState>;
};

export function emptyQuotaState(
  feature: AiFeature,
  opts?: { holderBonus?: boolean; isPremium?: boolean }
): AiQuotaState {
  const isPremium = Boolean(opts?.isPremium);
  const holderBonus = Boolean(opts?.holderBonus);
  const spec = FREE_AI_LIMITS[feature];
  const start = periodStartUtc(spec.period);
  if (isPremium) {
    return {
      feature,
      allowed: true,
      unlimited: true,
      isPremium: true,
      holderBonus,
      salvazionBalance: null,
      used: 0,
      limit: null,
      remaining: null,
      period: spec.period,
      periodStart: start,
      resetAt: null,
    };
  }
  const limit = freeLimitFor(feature, holderBonus);
  return {
    feature,
    allowed: true,
    unlimited: false,
    isPremium: false,
    holderBonus,
    salvazionBalance: null,
    used: 0,
    limit,
    remaining: limit,
    period: spec.period,
    periodStart: start,
    resetAt: periodResetUtc(spec.period, start),
  };
}
