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
    en: 'All 10 of Free, plus 9 Premium depths. $49 / month — less than one hour with a trainer, a dietitian or a spiritual director.',
    es: 'Los 10 de Gratis, más 9 profundidades Premium. $49 / mes — menos que una hora con un entrenador, un nutricionista o un director espiritual.',
    pt: 'Os 10 do Grátis, mais 9 profundidades Premium. $49 / mês — menos que uma hora com um treinador, um nutricionista ou um diretor espiritual.',
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
  /** Free plan bullets (landing + Platform). */
  freeItems: [
    {
      en: '3 Hubs with a global score to achieve your purpose.',
      es: '3 Hubs con un score global para lograr tu propósito.',
      pt: '3 Hubs com um score global para cumprir o teu propósito.',
    },
    {
      en: 'Advanced agenda for integral development (Spiritual, Physical and Mental).',
      es: 'Agenda avanzada para tu desarrollo integral (Espiritual, Físico y Mental).',
      pt: 'Agenda avançada para o teu desenvolvimento integral (Espiritual, Físico e Mental).',
    },
    {
      en: 'Offline Bible in English, Spanish, Portuguese and originals (Hebrew and Greek).',
      es: 'Biblia offline en inglés, español, portugués y originales (hebreo y griego).',
      pt: 'Bíblia offline em inglês, espanhol, português e originais (hebraico e grego).',
    },
    {
      en: 'Prayer motives and personalized devotionals.',
      es: 'Motivos de oración y devocionales personalizados.',
      pt: 'Motivos de oração e devocionais personalizados.',
    },
    {
      en: 'Body composition, food and sleep-quality analysis.',
      es: 'Análisis de composición corporal, alimentos y calidad del sueño.',
      pt: 'Análise de composição corporal, alimentos e qualidade do sono.',
    },
    {
      en: 'Sync with devices and wearables for biomarkers.',
      es: 'Sincronización con dispositivos y wearables para biomarcadores.',
      pt: 'Sincronização com dispositivos e wearables para biomarcadores.',
    },
    {
      en: 'Original content that defends Western Christian culture and BioConservatism.',
      es: 'Contenido original que defiende la cultura cristiano-occidental y el BioConservadurismo.',
      pt: 'Conteúdo original que defende a cultura cristã-ocidental e o BioConservadorismo.',
    },
    {
      en: 'Connect with a global community (Green Lion Kings) that defends these values.',
      es: 'Conecta con una comunidad global (Green Lion Kings) que defiende estos valores.',
      pt: 'Conecta com uma comunidade global (Green Lion Kings) que defende estes valores.',
    },
    {
      en: '360° drone map of churches and Christian assemblies near your home.',
      es: 'Mapa dron 360° con iglesias y asambleas cristianas cerca de tu hogar.',
      pt: 'Mapa drone 360° com igrejas e assembleias cristãs perto da tua casa.',
    },
    {
      en: 'Salvazion AI that motivates you and helps you on this journey.',
      es: 'Salvazion AI que te motiva y te ayuda en este viaje.',
      pt: 'Salvazion AI que te motiva e te ajuda nesta jornada.',
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
    en: 'Everything in Free — all 10 keys of the Platform, without dropping a pillar.',
    es: 'Todo lo de Gratis — las 10 claves de la Plataforma, sin soltar un pilar.',
    pt: 'Tudo do Grátis — as 10 chaves da Plataforma, sem largar um pilar.',
  },
  {
    id: 'coach_unlimited',
    en: 'Unlimited Salvazion AI coach — a daily virtue mentor that does not clock out. One hour with a life coach costs more than a month here.',
    es: 'Coach Salvazion AI ilimitado — un mentor de virtud cada día, que no cierra el consultorio. Una hora con un life coach vale más que un mes aquí.',
    pt: 'Coach Salvazion AI ilimitado — um mentor de virtude todos os dias, que não fecha o consultório. Uma hora com um life coach vale mais que um mês aqui.',
  },
  {
    id: 'voice_unlimited',
    en: 'Unlimited Salvazion AI voice — listen, do not type your soul into a void.',
    es: 'Voz Salvazion AI ilimitada — escucha; no escribas el alma en el vacío.',
    pt: 'Voz Salvazion AI ilimitada — ouça; não escreva a alma no vazio.',
  },
  {
    id: 'devotional_unlimited',
    en: 'Unlimited AI devotionals — Scripture, virtue and BioConservatism every day, not a one-a-day taste.',
    es: 'Devocionales IA ilimitados — Escritura, virtud y BioConservadurismo cada día, no una ración.',
    pt: 'Devocionais IA ilimitados — Escritura, virtude e BioConservadorismo todos os dias, não uma ração.',
  },
  {
    id: 'body_unlimited',
    en: 'Unlimited body-composition analysis — measure the temple as often as you train, not twice a week.',
    es: 'Composición corporal ilimitada — mide el templo tantas veces como entrenes, no dos veces por semana.',
    pt: 'Composição corporal ilimitada — meça o templo tantas vezes quanto treinar, não duas vezes por semana.',
  },
  {
    id: 'meal_unlimited',
    en: 'Unlimited meal vision — every plate, not a three-photo ceiling. A dietitian visit is already more than $49.',
    es: 'Visión de comida ilimitada — cada plato, no un tope de tres fotos. Una consulta de nutrición ya supera los $49.',
    pt: 'Visão de refeição ilimitada — cada prato, não um teto de três fotos. Uma consulta de nutrição já supera os $49.',
  },
  {
    id: 'wearables_cloud',
    en: 'Cloud wearables (Fitbit, Oura, WHOOP, Garmin) in one Hub — those memberships alone can rival $49.',
    es: 'Wearables en la nube (Fitbit, Oura, WHOOP, Garmin) en un solo Hub — esas membresías solas pueden igualar los $49.',
    pt: 'Wearables na nuvem (Fitbit, Oura, WHOOP, Garmin) num só Hub — essas assinaturas sozinhas podem igualar os $49.',
  },
  {
    id: 'health_clinical',
    en: 'Biomarkers, clinical record and women’s health without a cap — depth another health app would charge extra for.',
    es: 'Biomarcadores, ficha clínica y salud femenina sin tope — profundidad que otra app de salud cobraría aparte.',
    pt: 'Biomarcadores, ficha clínica e saúde feminina sem teto — profundidade que outro app de saúde cobraria à parte.',
  },
  {
    id: 'calendar_prayer',
    en: 'Full-year calendar plus advanced prayer (priority and session) — a spiritual director’s desk, without the hourly rate.',
    es: 'Calendario de todo el año más oración avanzada (prioridad y sesión) — el escritorio de un director espiritual, sin tarifa por hora.',
    pt: 'Calendário do ano todo mais oração avançada (prioridade e sessão) — a mesa de um diretor espiritual, sem tarifa por hora.',
  },
  {
    id: 'freedom_phalanx',
    en: 'Full Freedom library, communities, swap terminal and unlimited Phalanx — formation, sovereignty and a circle with no invite cap.',
    es: 'Biblioteca Freedom completa, comunidades, terminal de swap y Phalanx ilimitada — formación, soberanía y un círculo sin tope de invitaciones.',
    pt: 'Biblioteca Freedom completa, comunidades, terminal de swap e Phalanx ilimitada — formação, soberania e um círculo sem teto de convites.',
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
