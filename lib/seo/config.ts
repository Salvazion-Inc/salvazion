/**
 * Central SEO / social metadata for the Salvazion platform (salvazion.org).
 */
import { APP_URL, MARKETING_URL, SUPPORT_EMAIL, WELCOME_URL } from '@/lib/config/site';

/** Official purpose. Keep this sentence exact on the site, the Platform and Welcome. */
export const PURPOSE =
  'Restore Salvation, Health and Freedom to the Human Person created in the image of God';

export const SEO = {
  siteName: 'Salvazion',
  legalName: 'Salvazion, Inc.',
  tagline: PURPOSE,
  /** Browser tab and social title. Full purpose is `tagline`; stay under ~60 chars. */
  title: 'Salvazion | Restore Salvation, Health and Freedom',
  titleTemplate: '%s | Salvazion',
  /**
   * Meta description for Google (~155–160 chars).
   */
  description: `${PURPOSE}. Offline Bible, health and wearables, Freedom library and Community.`,
  /**
   * Slightly longer copy for WhatsApp / iMessage / LinkedIn / X cards.
   */
  ogDescription: `${PURPOSE}. One freemium Platform: offline Bible, devotionals, health and wearables, Freedom library, Community, Salvazion AI and $SALVAZION on Solana. Free to start.`,
  descriptionEs:
    'Restaurar la Salvación, la Salud y la Libertad a la Persona Humana creada a imagen de Dios. Biblia offline, salud, Freedom y Community.',
  ogDescriptionEs:
    'Restaurar la Salvación, la Salud y la Libertad a la Persona Humana creada a imagen de Dios. Una sola Plataforma freemium: Biblia offline, devocional, salud y wearables, biblioteca Freedom, Community, IA Salvazion y $SALVAZION en Solana. Empieza gratis.',
  descriptionPt:
    'Restaurar a Salvação, a Saúde e a Liberdade à Pessoa Humana criada à imagem de Deus. Bíblia offline, saúde, Freedom e Community.',
  ogDescriptionPt:
    'Restaurar a Salvação, a Saúde e a Liberdade à Pessoa Humana criada à imagem de Deus. Uma só Plataforma freemium: Bíblia offline, devocional, saúde e wearables, biblioteca Freedom, Community, IA Salvazion e $SALVAZION na Solana. Comece grátis.',
  keywords: [
    'Salvazion',
    'Salvazion platform',
    'Restore Salvation Health and Freedom',
    'human person created in the image of God',
    'Christian lifestyle platform',
    'offline Bible platform',
    'faith health freedom',
    'BioConservatism',
    'Western Christian Culture',
    'Salvazion Community',
    'SALVAZION token',
    'Salvazion AI',
    'Community',
    'Green Lion Kings',
    'plataforma cristiana',
    'Biblia offline',
    'plataforma cristã',
    'Bíblia offline',
    'Almeida Revista e Corrigida',
  ],
  locale: 'en_US',
  alternateLocale: 'es_ES',
  alternateLocalePt: 'pt_BR',
  /** Absolute URLs for crawlers / social */
  url: APP_URL,
  marketingUrl: MARKETING_URL,
  welcomeUrl: WELCOME_URL,
  supportEmail: SUPPORT_EMAIL,
  xUrl: 'https://x.com/salvazion_',
  xArticlesUrl: 'https://x.com/salvazion_/articles',
  /**
   * Static share card (1200×630). Query busts WhatsApp / iMessage caches
   * after a visual update. Next.js also serves app/opengraph-image.png.
   */
  ogImage: '/og.jpg',
  ogImageVersion: '20260818',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  imageFallback: '/salvazion-logo-green-lion.png',
  logo: '/logo.png',
  ogImageAlt:
    `${PURPOSE}. The platform that restores the human person.`,
  twitterHandle: '@salvazion_',
  category: 'Lifestyle',
  address: {
    streetAddress: '131 Continental Dr, Suite 305',
    addressLocality: 'Newark',
    addressRegion: 'DE',
    postalCode: '19713',
    addressCountry: 'US',
  },
  founders: [
    {
      name: 'Cristian Cortés',
      jobTitle: 'CEO & Founder',
      sameAs: ['https://www.linkedin.com/in/exponential-healthtech/'] as string[],
    },
    {
      name: 'Beatriz Isler',
      jobTitle: 'COO & Founder',
      sameAs: ['https://www.linkedin.com/in/beatriz-isler/'] as string[],
    },
  ],
  sameAs: [
    'https://x.com/salvazion_',
    WELCOME_URL,
  ] as string[],
  knowsAbout: [
    'Salvation',
    'Christian faith',
    'offline Bible',
    'devotionals',
    'health tracking',
    'wearables',
    'BioConservatism',
    'Western Christian Culture',
    'spiritual warfare',
    'economic sovereignty',
    'Solana',
    '$SALVAZION',
  ],
  pricing: {
    free: 0,
    premiumMonthly: 49,
    premiumAnnual: 468,
    currency: 'USD',
  },
} as const;

export function absoluteUrl(path = '/'): string {
  const base = SEO.url.replace(/\/$/, '');
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Cache-busted absolute URL for the social share image */
export function ogImageUrl(): string {
  return `${absoluteUrl(SEO.ogImage).replace(/\/$/, '')}?v=${SEO.ogImageVersion}`;
}

export function ogImageMetadata() {
  return {
    url: ogImageUrl(),
    secureUrl: ogImageUrl(),
    width: SEO.ogImageWidth,
    height: SEO.ogImageHeight,
    alt: SEO.ogImageAlt,
    type: 'image/jpeg' as const,
  };
}
