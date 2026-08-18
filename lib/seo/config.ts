/**
 * Central SEO / social metadata for the Salvazion app (salvazion.org).
 */
import { APP_URL, MARKETING_URL, SUPPORT_EMAIL, WELCOME_URL } from '@/lib/config/site';

export const SEO = {
  siteName: 'Salvazion',
  legalName: 'Salvazion, Inc.',
  tagline: 'Make Salvation, Health and Freedom Great Again',
  /** Primary HTML title (root + OG) — keep slogan; under ~65 chars */
  title: 'Salvazion | Make Salvation, Health and Freedom Great Again',
  titleTemplate: '%s | Salvazion',
  /**
   * Meta description for Google (~155–160 chars).
   */
  description:
    'The platform that restores the human person. Offline Bible, health & wearables, Freedom library, Phalanx community, Salvazion AI and $SALVAZION on Solana.',
  /**
   * Slightly longer copy for WhatsApp / iMessage / LinkedIn / X cards.
   */
  ogDescription:
    'Make Salvation, Health and Freedom Great Again. One freemium App: offline Bible, devotionals, health & wearables, Freedom library, Phalanx community, Salvazion AI and $SALVAZION on Solana. Free to start.',
  descriptionEs:
    'La plataforma que restaura a la persona humana. Biblia offline, salud y wearables, biblioteca Freedom, comunidad Phalanx, IA Salvazion y $SALVAZION en Solana.',
  ogDescriptionEs:
    'Make Salvation, Health and Freedom Great Again. Una sola App freemium: Biblia offline, devocional, salud y wearables, biblioteca Freedom, comunidad Phalanx, IA Salvazion y $SALVAZION en Solana. Empieza gratis.',
  descriptionPt:
    'A plataforma que restaura a pessoa humana. Bíblia offline, saúde e wearables, biblioteca Freedom, comunidade Phalanx, IA Salvazion e $SALVAZION na Solana.',
  ogDescriptionPt:
    'Make Salvation, Health and Freedom Great Again. Um só App freemium: Bíblia offline, devocional, saúde e wearables, biblioteca Freedom, comunidade Phalanx, IA Salvazion e $SALVAZION na Solana. Comece grátis.',
  keywords: [
    'Salvazion',
    'Salvazion app',
    'Make Salvation Health and Freedom Great Again',
    'Christian lifestyle app',
    'offline Bible app',
    'faith health freedom',
    'BioConservatism',
    'Western Christian Culture',
    'Phalanx community',
    'SALVAZION token',
    'Salvazion AI',
    'Green Lion',
    'app cristiana',
    'Biblia offline',
    'app cristã',
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
    'Salvazion Green Lion — Make Salvation, Health and Freedom Great Again. The platform that restores the human person.',
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
