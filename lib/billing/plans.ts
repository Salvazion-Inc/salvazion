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
 * Pricing table copy — single source for landing + Platform Premium page.
 * Keep EN/ES/PT lists in lockstep (same order and count).
 */
export const PRICING_TABLE = {
  freeNote: {
    en: 'Ten keys of the Platform — spirit, body and liberty in one journey.',
    es: 'Diez claves de la Plataforma — espíritu, cuerpo y libertad en un solo viaje.',
    pt: 'Dez chaves da Plataforma — espírito, corpo e liberdade numa só jornada.',
  },
  premiumNote: {
    en: 'All 10 of Free, plus 9 depths. $49/mo — less than one coaching hour.',
    es: 'Los 10 de Gratis, más 9 profundidades. $49/mes — menos que una hora de coaching.',
    pt: 'Os 10 do Grátis, mais 9 profundidades. $49/mês — menos que uma hora de coaching.',
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
  /** Free plan bullets (landing + Platform). Paired in length with Premium. */
  freeItems: [
    {
      en: '3 Hubs and a global score to achieve your purpose in Salvation, Health and Freedom.',
      es: '3 Hubs y un score global para lograr tu propósito en Salvation, Health y Freedom.',
      pt: '3 Hubs e um score global para cumprir o teu propósito em Salvation, Health e Freedom.',
    },
    {
      en: 'Advanced agenda for integral development: Spiritual, Physical and Mental.',
      es: 'Agenda avanzada para tu desarrollo integral: Espiritual, Físico y Mental.',
      pt: 'Agenda avançada para o teu desenvolvimento integral: Espiritual, Físico e Mental.',
    },
    {
      en: 'Offline Bible in English, Spanish, Portuguese and originals (Hebrew and Greek).',
      es: 'Biblia offline en inglés, español, portugués y originales (hebreo y griego).',
      pt: 'Bíblia offline em inglês, espanhol, português e originais (hebraico e grego).',
    },
    {
      en: 'Prayer motives and personalized devotionals to keep the Word first.',
      es: 'Motivos de oración y devocionales personalizados para poner la Palabra primero.',
      pt: 'Motivos de oração e devocionais personalizados para pôr a Palavra primeiro.',
    },
    {
      en: 'Body composition, food and sleep-quality analysis for the temple.',
      es: 'Análisis de composición corporal, alimentos y calidad del sueño para el templo.',
      pt: 'Análise de composição corporal, alimentos e qualidade do sono para o templo.',
    },
    {
      en: 'Sync with devices and wearables to read your biomarkers each day.',
      es: 'Sincronización con dispositivos y wearables para leer tus biomarcadores.',
      pt: 'Sincronização com dispositivos e wearables para ler os teus biomarcadores.',
    },
    {
      en: 'Original content that defends Western Christian culture and BioConservatism.',
      es: 'Contenido original que defiende la cultura cristiano-occidental y el BioConservadurismo.',
      pt: 'Conteúdo original que defende a cultura cristã-ocidental e o BioConservadorismo.',
    },
    {
      en: 'A global community (Green Lion Kings) that defends these same values.',
      es: 'Una comunidad global (Green Lion Kings) que defiende estos mismos valores.',
      pt: 'Uma comunidade global (Green Lion Kings) que defende estes mesmos valores.',
    },
    {
      en: '360° drone map of churches and Christian assemblies near your home.',
      es: 'Mapa dron 360° con iglesias y asambleas cristianas cerca de tu hogar.',
      pt: 'Mapa drone 360° com igrejas e assembleias cristãs perto da tua casa.',
    },
    {
      en: 'Salvazion AI that motivates you and helps you walk this journey.',
      es: 'Salvazion AI que te motiva y te ayuda a recorrer este viaje.',
      pt: 'Salvazion AI que te motiva e te ajuda a percorrer esta jornada.',
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
    en: 'Everything in Free — all 10 keys of the Platform, no pillar left behind.',
    es: 'Todo lo de Gratis — las 10 claves de la Plataforma, sin soltar un pilar.',
    pt: 'Tudo do Grátis — as 10 chaves da Plataforma, sem largar um pilar.',
  },
  {
    id: 'coach_unlimited',
    en: 'Unlimited Salvazion AI coach — a virtue mentor that never clocks out.',
    es: 'Coach Salvazion AI ilimitado — un mentor de virtud que no cierra el consultorio.',
    pt: 'Coach Salvazion AI ilimitado — um mentor de virtude que não fecha o consultório.',
  },
  {
    id: 'voice_unlimited',
    en: 'Unlimited Salvazion AI voice — listen; do not type your soul into a void.',
    es: 'Voz Salvazion AI ilimitada — escucha; no escribas el alma en el vacío.',
    pt: 'Voz Salvazion AI ilimitada — ouça; não escreva a alma no vazio.',
  },
  {
    id: 'devotional_unlimited',
    en: 'Unlimited AI devotionals — Scripture and virtue every day, not a ration.',
    es: 'Devocionales IA ilimitados — Escritura y virtud cada día, no una ración.',
    pt: 'Devocionais IA ilimitados — Escritura e virtude todos os dias, não uma ração.',
  },
  {
    id: 'body_unlimited',
    en: 'Unlimited body-composition analysis — measure the temple as you train.',
    es: 'Composición corporal ilimitada — mide el templo tantas veces como entrenes.',
    pt: 'Composição corporal ilimitada — meça o templo tantas vezes quanto treinar.',
  },
  {
    id: 'meal_unlimited',
    en: 'Unlimited meal vision — every plate, not a three-photo ceiling.',
    es: 'Visión de comida ilimitada — cada plato, no un tope de tres fotos.',
    pt: 'Visão de refeição ilimitada — cada prato, não um teto de três fotos.',
  },
  {
    id: 'wearables_cloud',
    en: 'Cloud wearables (Fitbit, Oura, WHOOP, Garmin) together in one Hub.',
    es: 'Wearables en la nube (Fitbit, Oura, WHOOP, Garmin) juntos en un Hub.',
    pt: 'Wearables na nuvem (Fitbit, Oura, WHOOP, Garmin) juntos num só Hub.',
  },
  {
    id: 'health_clinical',
    en: 'Biomarkers, clinical record and women’s health with no extra fee.',
    es: 'Biomarcadores, ficha clínica y salud femenina, sin un cobro aparte.',
    pt: 'Biomarcadores, ficha clínica e saúde feminina, sem cobrança extra.',
  },
  {
    id: 'calendar_prayer',
    en: 'Full-year calendar plus advanced prayer: priority and live session.',
    es: 'Calendario de todo el año más oración avanzada: prioridad y sesión.',
    pt: 'Calendário do ano todo mais oração avançada: prioridade e sessão.',
  },
  {
    id: 'freedom_phalanx',
    en: 'Full Freedom library, swap terminal and unlimited Phalanx invites.',
    es: 'Biblioteca Freedom completa, terminal de swap y Phalanx ilimitada.',
    pt: 'Biblioteca Freedom completa, terminal de swap e Phalanx ilimitada.',
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
