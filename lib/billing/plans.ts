/**
 * Salvazion freemium catalog.
 * Premium: full access + advanced tools via Stripe (Salvazion, Inc.).
 *
 * Pricing (USD):
 * - Monthly: $20 / month
 * - Annual:  $15 / month equivalent ($180 / year)
 */

export const PREMIUM_PRODUCT_ID =
  process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID || 'prod_UxwcMVMNlKeczI';

export const STRIPE_PRICE_MONTHLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ||
  process.env.STRIPE_PRICE_MONTHLY ||
  'price_1Ty0iyHOw5ZkjRlZMsCZPQWY';

export const STRIPE_PRICE_ANNUAL =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL ||
  process.env.STRIPE_PRICE_ANNUAL ||
  'price_1Ty0iyHOw5ZkjRlZQBQYbfQ7';

export type BillingInterval = 'month' | 'year';

export type PremiumFeature =
  | 'coach_ai'
  | 'coach_tts'
  | 'devotional_ai'
  | 'wearables_cloud'
  | 'health_advanced'
  | 'calendar_advanced'
  | 'prayer_advanced'
  | 'freedom_full'
  | 'phalanx_unlimited';

export const PLAN_COPY = {
  free: {
    id: 'free' as const,
    name: 'Free',
    nameEs: 'Gratis',
    priceLabel: '$0',
    priceLabelEs: '$0',
  },
  premium_month: {
    id: 'premium_month' as const,
    name: 'Premium Monthly',
    nameEs: 'Premium Mensual',
    priceUsd: 20,
    interval: 'month' as BillingInterval,
    priceId: STRIPE_PRICE_MONTHLY,
    priceLabel: '$20 / month',
    priceLabelEs: '$20 / mes',
  },
  premium_year: {
    id: 'premium_year' as const,
    name: 'Premium Annual',
    nameEs: 'Premium Anual',
    priceUsd: 180,
    monthlyEquivalent: 15,
    interval: 'year' as BillingInterval,
    priceId: STRIPE_PRICE_ANNUAL,
    priceLabel: '$15 / mo · billed yearly ($180)',
    priceLabelEs: '$15 / mes · facturado anual ($180)',
  },
};

/** Features available without subscription */
export const FREE_FEATURE_LIST = [
  'account_onboarding',
  'dashboard_scores',
  'bible_reader',
  'devotional_daily_rules',
  'health_manual',
  'freedom_browse_limited',
  'wallet_connect',
  'phalanx_basic',
  'profile_settings',
  'badges_basic',
] as const;

/** Premium-only capabilities (current product surface) */
export const PREMIUM_FEATURE_LIST: {
  id: PremiumFeature;
  en: string;
  es: string;
}[] = [
  {
    id: 'coach_ai',
    en: 'Green Lion AI coach (chat)',
    es: 'Coach León Verde con IA (chat)',
  },
  {
    id: 'coach_tts',
    en: 'Coach voice / TTS',
    es: 'Voz del coach / TTS',
  },
  {
    id: 'devotional_ai',
    en: 'Unlimited AI devotionals',
    es: 'Devocionales IA ilimitados',
  },
  {
    id: 'wearables_cloud',
    en: 'Cloud wearables OAuth (Fitbit, Oura, WHOOP, Garmin)',
    es: 'Wearables en la nube (Fitbit, Oura, WHOOP, Garmin)',
  },
  {
    id: 'health_advanced',
    en: 'Advanced health: biomarkers, clinical record, women\'s health',
    es: 'Salud avanzada: biomarcadores, registro clínico, salud femenina',
  },
  {
    id: 'calendar_advanced',
    en: 'Full calendar & discipline planner',
    es: 'Calendario completo y planificador de disciplina',
  },
  {
    id: 'prayer_advanced',
    en: 'Prayer motives advanced tools',
    es: 'Herramientas avanzadas de motivos de oración',
  },
  {
    id: 'freedom_full',
    en: 'Full Freedom library + swap terminal',
    es: 'Biblioteca Freedom completa + terminal de swap',
  },
  {
    id: 'phalanx_unlimited',
    en: 'Unlimited Phalanx invites & tracking',
    es: 'Invitaciones Phalanx ilimitadas y seguimiento',
  },
];

export function priceIdForInterval(interval: BillingInterval): string {
  return interval === 'year' ? STRIPE_PRICE_ANNUAL : STRIPE_PRICE_MONTHLY;
}

export function isPremiumPriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return false;
  return priceId === STRIPE_PRICE_MONTHLY || priceId === STRIPE_PRICE_ANNUAL;
}
