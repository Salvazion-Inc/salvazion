/**
 * Salvazion freemium catalog (client-safe copy + lookup keys).
 * Checkout resolves live Stripe prices by lookup_key on the server.
 * Never import price_ / prod_ IDs here — see lib/billing/price-ids.ts.
 *
 * Pricing (USD):
 * - Monthly: $49 / month
 * - Annual:  $39 / month equivalent ($468 / year)
 */

/** Canonical live prices — Checkout resolves these via lookup_key, never default_price. */
export const STRIPE_LOOKUP_MONTHLY = 'salvazion_premium_monthly_49';
export const STRIPE_LOOKUP_ANNUAL = 'salvazion_premium_annual_39';

/** $49 / month and $468 / year in cents. */
export const CHECKOUT_UNIT_AMOUNT_CENTS = {
  month: 4900,
  year: 46800,
} as const;

export type BillingInterval = 'month' | 'year';

export function lookupKeyForInterval(interval: BillingInterval): string {
  return interval === 'year' ? STRIPE_LOOKUP_ANNUAL : STRIPE_LOOKUP_MONTHLY;
}

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
    namePt: 'Grátis',
    priceLabel: '$0',
    priceLabelEs: '$0',
    priceLabelPt: '$0',
  },
  premium_month: {
    id: 'premium_month' as const,
    name: 'Premium Monthly',
    nameEs: 'Premium Mensual',
    namePt: 'Premium Mensal',
    priceUsd: 49,
    interval: 'month' as BillingInterval,
    priceLabel: '$49 / month',
    priceLabelEs: '$49 / mes',
    priceLabelPt: '$49 / mês',
  },
  premium_year: {
    id: 'premium_year' as const,
    name: 'Premium Annual',
    nameEs: 'Premium Anual',
    namePt: 'Premium Anual',
    priceUsd: 468,
    monthlyEquivalent: 39,
    interval: 'year' as BillingInterval,
    priceLabel: '$468/year',
    priceLabelEs: '$468/año',
    priceLabelPt: '$468/ano',
  },
};

/** Features available without subscription (capability ids) */
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

/**
 * Pricing table copy — single source for landing + Platform Premium page.
 * Keep EN/ES/PT lists in lockstep (same order and count).
 */
export const PRICING_TABLE = {
  freeNote: {
    en: 'Daily limits.',
    es: 'Con límites diarios.',
    pt: 'Com limites diários.',
  },
  premiumNote: {
    en: 'No daily limits.',
    es: 'Sin límites diarios.',
    pt: 'Sem limites diários.',
  },
  freeAside: {
    en: 'No card',
    es: 'Sin tarjeta',
    pt: 'Sem cartão',
  },
  bestValue: {
    en: 'No limits',
    es: 'Sin límites',
    pt: 'Sem limites',
  },
  stripeNote: {
    en: 'Stripe. Cancel anytime.',
    es: 'Stripe. Cancela cuando quieras.',
    pt: 'Stripe. Cancele quando quiser.',
  },
  /** Free plan bullets (landing + Platform). Short, same order in EN/ES/PT. */
  freeItems: [
    {
      en: 'Bible, prayer, devotional',
      es: 'Biblia, oración y devocional',
      pt: 'Bíblia, oração e devocional',
    },
    {
      en: 'Health log',
      es: 'Registro de salud',
      pt: 'Registro de saúde',
    },
    {
      en: 'Score and agenda',
      es: 'Score y agenda',
      pt: 'Score e agenda',
    },
    {
      en: 'Articles and community',
      es: 'Artículos y comunidad',
      pt: 'Artigos e comunidade',
    },
    {
      en: 'Limited AI',
      es: 'IA limitada',
      pt: 'IA limitada',
    },
  ],
} as const;

/** Premium display bullets (landing + Platform). Capability ids stay in PremiumFeature. */
export const PREMIUM_FEATURE_LIST: {
  id: string;
  en: string;
  es: string;
  pt: string;
}[] = [
  {
    id: 'includes_free',
    en: 'Everything in Free',
    es: 'Todo lo de Gratis',
    pt: 'Tudo do Grátis',
  },
  {
    id: 'coach_unlimited',
    en: 'Unlimited AI coach and voice',
    es: 'Coach y voz de IA ilimitados',
    pt: 'Coach e voz de IA ilimitados',
  },
  {
    id: 'devotional_unlimited',
    en: 'Unlimited devotionals',
    es: 'Devocionales ilimitados',
    pt: 'Devocionais ilimitados',
  },
  {
    id: 'body_unlimited',
    en: 'Unlimited body and meal scans',
    es: 'Escaneos de cuerpo y comida ilimitados',
    pt: 'Escaneamentos de corpo e refeição ilimitados',
  },
  {
    id: 'wearables_cloud',
    en: 'Cloud wearables',
    es: 'Wearables en la nube',
    pt: 'Wearables na nuvem',
  },
  {
    id: 'freedom_phalanx',
    en: 'Calendar, prayer, unlimited invites',
    es: 'Calendario, oración, invitaciones ilimitadas',
    pt: 'Calendário, oração, convites ilimitados',
  },
];


