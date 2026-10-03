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
    en: 'Salvation, Health and Freedom today. AI stays on a daily limit.',
    es: 'Salvation, Health y Freedom desde hoy. La IA queda con límite diario.',
    pt: 'Salvation, Health e Freedom desde hoje. A IA fica com limite diário.',
  },
  premiumNote: {
    en: 'No daily limits. Cloud wearables and the full depth of each pillar.',
    es: 'Sin límites diarios. Wearables en la nube y toda la profundidad de cada pilar.',
    pt: 'Sem limites diários. Wearables na nuvem e toda a profundidade de cada pilar.',
  },
  freeAside: {
    en: 'No card',
    es: 'Sin tarjeta',
    pt: 'Sem cartão',
  },
  bestValue: {
    en: 'Full depth',
    es: 'Profundidad total',
    pt: 'Profundidade total',
  },
  stripeNote: {
    en: 'Stripe. Cancel anytime.',
    es: 'Stripe. Cancela cuando quieras.',
    pt: 'Stripe. Cancele quando quiser.',
  },
  /** Free plan bullets (landing + Platform). One explicit value per line, EN/ES/PT lockstep. */
  freeItems: [
    {
      en: 'Salvation: offline Bible in English, Spanish, Portuguese, Hebrew and Greek; prayer by priority; a daily devotion; a Salvation score.',
      es: 'Salvation: Biblia offline en inglés, español, portugués, hebreo y griego; oración por prioridad; devocional diario; score Salvation.',
      pt: 'Salvation: Bíblia offline em inglês, espanhol, português, hebraico e grego; oração por prioridade; devocional diário; score Salvation.',
    },
    {
      en: 'Health: sleep, food, sun and training in one score. The body is a temple, not a machine to upgrade.',
      es: 'Health: sueño, comida, sol y entrenamiento en un score. El cuerpo es templo, no una máquina que mejorar.',
      pt: 'Health: sono, comida, sol e treino num score. O corpo é templo, não uma máquina a melhorar.',
    },
    {
      en: 'Freedom: a library, the Green Lion Kings community, and economic sovereignty on Solana.',
      es: 'Freedom: biblioteca, la comunidad Green Lion Kings y soberanía económica en Solana.',
      pt: 'Freedom: biblioteca, a comunidade Green Lion Kings e soberania econômica na Solana.',
    },
    {
      en: 'One global score and an agenda that orders spirit, body and mind toward your purpose.',
      es: 'Un score global y una agenda que ordenan espíritu, cuerpo y mente hacia tu propósito.',
      pt: 'Um score global e uma agenda que ordenam espírito, corpo e mente para o seu propósito.',
    },
    {
      en: 'Body composition, meals and sleep quality you can measure each day.',
      es: 'Composición corporal, comidas y calidad del sueño que puedes medir cada día.',
      pt: 'Composição corporal, refeições e qualidade do sono que você mede cada dia.',
    },
    {
      en: 'Biomarkers from your devices, saved on the device. Cloud wearables are Premium.',
      es: 'Biomarcadores de tus dispositivos, guardados en el aparato. Los wearables en la nube son Premium.',
      pt: 'Biomarcadores dos seus dispositivos, salvos no aparelho. Wearables na nuvem são Premium.',
    },
    {
      en: 'Original writing that defends Western Christian culture and BioConservatism.',
      es: 'Contenido original que defiende la cultura cristiana occidental y el BioConservadurismo.',
      pt: 'Conteúdo original que defende a cultura cristã ocidental e o BioConservadorismo.',
    },
    {
      en: 'A 360° map of churches and Christian assemblies near your home.',
      es: 'Mapa 360° de iglesias y asambleas cristianas cerca de tu casa.',
      pt: 'Mapa 360° de igrejas e assembleias cristãs perto da sua casa.',
    },
    {
      en: 'Salvazion AI — coach, voice and devotionals — with a daily limit.',
      es: 'Salvazion AI — coach, voz y devocionales — con límite diario.',
      pt: 'Salvazion AI — coach, voz e devocionais — com limite diário.',
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
    en: 'Everything in Free: Bible, prayer, the three hubs, scores, community and the map.',
    es: 'Todo lo de Gratis: Biblia, oración, los tres hubs, scores, comunidad y el mapa.',
    pt: 'Tudo do Grátis: Bíblia, oração, os três hubs, scores, comunidade e o mapa.',
  },
  {
    id: 'coach_unlimited',
    en: 'Unlimited AI coach — a mentor for the journey, with no daily cap.',
    es: 'Coach de IA ilimitado — un mentor para el camino, sin tope diario.',
    pt: 'Coach de IA ilimitado — um mentor para o caminho, sem teto diário.',
  },
  {
    id: 'voice_unlimited',
    en: 'Unlimited AI voice — hear the guidance instead of typing it.',
    es: 'Voz de IA ilimitada — escucha la guía en lugar de escribirla.',
    pt: 'Voz de IA ilimitada — ouça a orientação em vez de digitá-la.',
  },
  {
    id: 'devotional_unlimited',
    en: 'Unlimited AI devotionals — Scripture and virtue every day, not one ration.',
    es: 'Devocionales de IA ilimitados — Escritura y virtud cada día, no una ración.',
    pt: 'Devocionais de IA ilimitados — Escritura e virtude cada dia, não uma ração.',
  },
  {
    id: 'body_unlimited',
    en: 'Unlimited body scans — measure the temple as often as you train.',
    es: 'Escaneos de cuerpo ilimitados — mide el templo tantas veces como entrenes.',
    pt: 'Escaneamentos de corpo ilimitados — meça o templo tantas vezes quanto treinar.',
  },
  {
    id: 'meal_unlimited',
    en: 'Unlimited meal vision — every plate, not a few photos a day.',
    es: 'Visión de comidas ilimitada — cada plato, no unas pocas fotos al día.',
    pt: 'Visão de refeições ilimitada — cada prato, não poucas fotos por dia.',
  },
  {
    id: 'wearables_cloud',
    en: 'Cloud wearables — Fitbit, Oura, WHOOP and Garmin — in one Health hub.',
    es: 'Wearables en la nube — Fitbit, Oura, WHOOP y Garmin — en un solo hub Health.',
    pt: 'Wearables na nuvem — Fitbit, Oura, WHOOP e Garmin — num só hub Health.',
  },
  {
    id: 'health_clinical',
    en: 'Biomarkers, clinical record and women’s health, included.',
    es: 'Biomarcadores, ficha clínica y salud femenina, incluidos.',
    pt: 'Biomarcadores, ficha clínica e saúde feminina, incluídos.',
  },
  {
    id: 'calendar_prayer',
    en: 'Full-year calendar and advanced prayer: priority and a live session.',
    es: 'Calendario de todo el año y oración avanzada: prioridad y sesión en vivo.',
    pt: 'Calendário do ano todo e oração avançada: prioridade e sessão ao vivo.',
  },
  {
    id: 'freedom_phalanx',
    en: 'Full Freedom library, swap, and unlimited invites to the Green Lion Kings.',
    es: 'Biblioteca Freedom completa, swap e invitaciones ilimitadas a los Green Lion Kings.',
    pt: 'Biblioteca Freedom completa, swap e convites ilimitados aos Green Lion Kings.',
  },
];


