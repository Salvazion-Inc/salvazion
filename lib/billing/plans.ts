/**
 * Salvazion freemium catalog.
 * Premium: full access + advanced tools via Stripe (Salvazion, Inc.).
 *
 * Pricing (USD):
 * - Monthly: $49 / month
 * - Annual:  $39 / month equivalent ($468 / year)
 */

export const PREMIUM_PRODUCT_ID =
  process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID || 'prod_UxwcMVMNlKeczI';

export const STRIPE_PRICE_MONTHLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ||
  process.env.STRIPE_PRICE_MONTHLY ||
  'price_1U0WEWHOw5ZkjRlZHXRW0gAX';

export const STRIPE_PRICE_ANNUAL =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL ||
  process.env.STRIPE_PRICE_ANNUAL ||
  'price_1U0WEXHOw5ZkjRlZOwkxysed';

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
    priceUsd: 49,
    interval: 'month' as BillingInterval,
    priceId: STRIPE_PRICE_MONTHLY,
    priceLabel: '$49 / month',
    priceLabelEs: '$49 / mes',
  },
  premium_year: {
    id: 'premium_year' as const,
    name: 'Premium Annual',
    nameEs: 'Premium Anual',
    priceUsd: 468,
    monthlyEquivalent: 39,
    interval: 'year' as BillingInterval,
    priceId: STRIPE_PRICE_ANNUAL,
    priceLabel: '$39 / mo · billed yearly ($468)',
    priceLabelEs: '$39 / mes · facturado anual ($468)',
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
 * Pricing table copy — single source for landing + in-app Premium page.
 * Keep EN/ES lists in lockstep (same order and count).
 */
export const PRICING_TABLE = {
  freeNote: {
    en: 'Forever free to start the journey',
    es: 'Gratis para siempre para empezar el camino',
  },
  premiumNote: {
    en: 'Everything in Free, plus full access and advanced tools',
    es: 'Todo lo de Gratis, más acceso completo y herramientas avanzadas',
  },
  bestValue: {
    en: 'Best value yearly',
    es: 'Mejor valor anual',
  },
  stripeNote: {
    en: 'Secure payments with Stripe (Salvazion, Inc.). Cancel or change plans anytime in the customer portal.',
    es: 'Pagos seguros con Stripe (Salvazion, Inc.). Cancela o cambia de plan cuando quieras en el portal de cliente.',
  },
  /** Free plan bullets (landing + app) */
  freeItems: [
    {
      en: 'Dashboard, daily scores and onboarding',
      es: 'Dashboard, scores diarios y onboarding',
    },
    {
      en: 'Full offline Bible (ES · EN · originals) — read, search and concordance',
      es: 'Biblia completa offline (ES · EN · originales) — lectura, búsqueda y concordancia',
    },
    {
      en: 'Daily rules-based devotional',
      es: 'Devocional diario por reglas',
    },
    {
      en: 'Manual health logs, phone sensors and BLE heart rate',
      es: 'Salud manual, sensores del teléfono y HR Bluetooth',
    },
    {
      en: 'Freedom library browse — books, X articles and YouTube',
      es: 'Biblioteca Freedom — libros, artículos en X y YouTube',
    },
    {
      en: 'Basic Phalanx invites for family and friends',
      es: 'Invitaciones Phalanx básicas para familia y amigos',
    },
    {
      en: 'Solana wallet connect (Jupiter Mobile, Phantom, Solflare)',
      es: 'Billetera Solana (Jupiter Mobile, Phantom, Solflare)',
    },
    {
      en: '$SALVAZION swap via Jupiter — we never hold your keys',
      es: 'Swap $SALVAZION con Jupiter — no custodiamos tus llaves',
    },
    {
      en: 'Profile and basic badges',
      es: 'Perfil y badges básicos',
    },
  ],
} as const;

/** Premium-only capabilities (current product surface) — display copy matches landing */
export const PREMIUM_FEATURE_LIST: {
  id: PremiumFeature;
  en: string;
  es: string;
}[] = [
  {
    id: 'coach_ai',
    en: 'Salvazion AI (chat coach)',
    es: 'Salvazion con IA (chat coach)',
  },
  {
    id: 'coach_tts',
    en: 'Salvazion voice / TTS',
    es: 'Voz de Salvazion / TTS',
  },
  {
    id: 'devotional_ai',
    en: 'Unlimited AI devotionals — Scripture, virtue and BioConservatism',
    es: 'Devocionales IA ilimitados — Escritura, virtud y BioConservadurismo',
  },
  {
    id: 'wearables_cloud',
    en: 'Cloud wearables OAuth (Fitbit, Oura, WHOOP, Garmin)',
    es: 'Wearables en la nube (Fitbit, Oura, WHOOP, Garmin)',
  },
  {
    id: 'health_advanced',
    en: "Advanced health: biomarkers, clinical record, women's health",
    es: 'Salud avanzada: biomarcadores, registro clínico, salud femenina',
  },
  {
    id: 'calendar_advanced',
    en: 'Full calendar and discipline planner',
    es: 'Calendario completo y planificador de disciplina',
  },
  {
    id: 'prayer_advanced',
    en: 'Advanced prayer motives tools',
    es: 'Herramientas avanzadas de motivos de oración',
  },
  {
    id: 'freedom_full',
    en: 'Full Freedom library + swap terminal',
    es: 'Biblioteca Freedom completa + terminal de swap',
  },
  {
    id: 'phalanx_unlimited',
    en: 'Unlimited Phalanx invites and tracking',
    es: 'Invitaciones Phalanx ilimitadas y seguimiento',
  },
];

export function priceIdForInterval(interval: BillingInterval): string {
  return interval === 'year' ? STRIPE_PRICE_ANNUAL : STRIPE_PRICE_MONTHLY;
}

/** Current + legacy Premium price IDs (Stripe prices are immutable). */
const PREMIUM_PRICE_IDS = new Set(
  [
    STRIPE_PRICE_MONTHLY,
    STRIPE_PRICE_ANNUAL,
    // Previous $20 / $15 plans
    'price_1Ty0iyHOw5ZkjRlZMsCZPQWY',
    'price_1Ty0iyHOw5ZkjRlZQBQYbfQ7',
    'price_1Ty0isHOw5ZkjRlZ6t5TRGje',
  ].filter(Boolean)
);

export function isPremiumPriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return false;
  return PREMIUM_PRICE_IDS.has(priceId);
}
