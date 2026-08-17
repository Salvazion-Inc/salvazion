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
    priceId: STRIPE_PRICE_MONTHLY,
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
    priceId: STRIPE_PRICE_ANNUAL,
    priceLabel: '$39 / mo · billed yearly ($468)',
    priceLabelEs: '$39 / mes · facturado anual ($468)',
    priceLabelPt: '$39 / mês · cobrado anual ($468)',
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
    en: 'Forever free — the full platform to start. Limited Salvazion AI + $SALVAZION holder bonus',
    es: 'Gratis para siempre — la plataforma completa para empezar. IA Salvazion limitada + bonus si tienes $SALVAZION',
    pt: 'Grátis para sempre — a plataforma completa para começar. IA Salvazion limitada + bônus se você tem $SALVAZION',
  },
  premiumNote: {
    en: 'Everything in Free, plus unlimited Salvazion AI and advanced tools',
    es: 'Todo lo de Gratis, más IA Salvazion ilimitada y herramientas avanzadas',
    pt: 'Tudo do Grátis, mais IA Salvazion ilimitada e ferramentas avançadas',
  },
  bestValue: {
    en: 'Best value yearly',
    es: 'Mejor valor anual',
    pt: 'Melhor valor anual',
  },
  stripeNote: {
    en: 'Secure payments with Stripe (Salvazion, Inc.). Cancel or change plans anytime in the customer portal.',
    es: 'Pagos seguros con Stripe (Salvazion, Inc.). Cancela o cambia de plan cuando quieras en el portal de cliente.',
    pt: 'Pagamentos seguros com Stripe (Salvazion, Inc.). Cancele ou mude de plano quando quiser no portal do cliente.',
  },
  /** Free plan bullets (landing + app) */
  freeItems: [
    {
      en: 'Dashboard, daily scores and onboarding',
      es: 'Dashboard, scores diarios y onboarding',
      pt: 'Dashboard, scores diários e onboarding',
    },
    {
      en: 'Daily agenda — Salvation, Health and Freedom in one day',
      es: 'Agenda diaria — Salvation, Health y Freedom en un solo día',
      pt: 'Agenda diária — Salvation, Health e Freedom em um só dia',
    },
    {
      en: 'Full offline Bible (ES · EN · PT · originals) — read, search and concordance',
      es: 'Biblia completa offline (ES · EN · PT · originales) — lectura, búsqueda y concordancia',
      pt: 'Bíblia completa offline (ES · EN · PT · originais) — leitura, busca e concordância',
    },
    {
      en: 'AI coach: 5 messages / day · AI devotionals: 1 / day',
      es: 'Coach IA: 5 mensajes / día · Devocionales IA: 1 / día',
      pt: 'Coach IA: 5 mensagens / dia · Devocionais IA: 1 / dia',
    },
    {
      en: 'Cineanthropometry: 2 / week · meal photo AI: 3 / day',
      es: 'Cineantropometría: 2 / semana · foto de comida IA: 3 / día',
      pt: 'Cineantropometria: 2 / semana · foto de refeição IA: 3 / dia',
    },
    {
      en: 'Hold $SALVAZION on-chain → 2× Free AI limits',
      es: 'Mantén $SALVAZION on-chain → 2× cupos Free de IA',
      pt: 'Mantenha $SALVAZION on-chain → 2× limites Free de IA',
    },
    {
      en: 'Manual health logs, phone sensors and BLE heart rate',
      es: 'Salud manual, sensores del teléfono y HR Bluetooth',
      pt: 'Saúde manual, sensores do telefone e FC Bluetooth',
    },
    {
      en: 'Freedom library — books, X articles, YouTube and churches map',
      es: 'Biblioteca Freedom — libros, artículos en X, YouTube y mapa de iglesias',
      pt: 'Biblioteca Freedom — livros, artigos no X, YouTube e mapa de igrejas',
    },
    {
      en: 'Basic Phalanx invites for family and friends',
      es: 'Invitaciones Phalanx básicas para familia y amigos',
      pt: 'Convites Phalanx básicos para família e amigos',
    },
    {
      en: 'Solana wallet connect (Jupiter Mobile, Phantom, Solflare)',
      es: 'Billetera Solana (Jupiter Mobile, Phantom, Solflare)',
      pt: 'Carteira Solana (Jupiter Mobile, Phantom, Solflare)',
    },
    {
      en: '$SALVAZION swap via Jupiter — we never hold your keys',
      es: 'Swap $SALVAZION con Jupiter — no custodiamos tus llaves',
      pt: 'Swap $SALVAZION com Jupiter — não custodiamos suas chaves',
    },
    {
      en: 'Profile and basic badges',
      es: 'Perfil y badges básicos',
      pt: 'Perfil e insígnias básicas',
    },
  ],
} as const;

/** Premium-only capabilities (current product surface) — display copy matches landing */
export const PREMIUM_FEATURE_LIST: {
  id: PremiumFeature;
  en: string;
  es: string;
  pt: string;
}[] = [
  {
    id: 'coach_ai',
    en: 'Unlimited Salvazion AI coach',
    es: 'Coach Salvazion IA ilimitado',
    pt: 'Coach Salvazion IA ilimitado',
  },
  {
    id: 'coach_tts',
    en: 'Unlimited Salvazion voice / TTS',
    es: 'Voz de Salvazion / TTS ilimitada',
    pt: 'Voz da Salvazion / TTS ilimitada',
  },
  {
    id: 'devotional_ai',
    en: 'Unlimited AI devotionals — Scripture, virtue and BioConservatism',
    es: 'Devocionales IA ilimitados — Escritura, virtud y BioConservadurismo',
    pt: 'Devocionais IA ilimitados — Escritura, virtude e BioConservadorismo',
  },
  {
    id: 'wearables_cloud',
    en: 'Cloud wearables OAuth (Fitbit, Oura, WHOOP, Garmin)',
    es: 'Wearables en la nube (Fitbit, Oura, WHOOP, Garmin)',
    pt: 'Wearables na nuvem (Fitbit, Oura, WHOOP, Garmin)',
  },
  {
    id: 'health_advanced',
    en: "Unlimited cineanthropometry + meal vision, biomarkers, clinical, women's health",
    es: 'Cineantropometría y visión de comida ilimitadas, biomarcadores, clínico, salud femenina',
    pt: 'Cineantropometria e visão de refeição ilimitadas, biomarcadores, clínico, saúde feminina',
  },
  {
    id: 'calendar_advanced',
    en: 'Full calendar and discipline planner',
    es: 'Calendario completo y planificador de disciplina',
    pt: 'Calendário completo e planejador de disciplina',
  },
  {
    id: 'prayer_advanced',
    en: 'Advanced prayer motives tools',
    es: 'Herramientas avanzadas de motivos de oración',
    pt: 'Ferramentas avançadas de motivos de oração',
  },
  {
    id: 'freedom_full',
    en: 'Full Freedom library, communities and swap terminal',
    es: 'Biblioteca Freedom completa, comunidades y terminal de swap',
    pt: 'Biblioteca Freedom completa, comunidades e terminal de swap',
  },
  {
    id: 'phalanx_unlimited',
    en: 'Unlimited Phalanx invites and tracking',
    es: 'Invitaciones Phalanx ilimitadas y seguimiento',
    pt: 'Convites Phalanx ilimitados e acompanhamento',
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
