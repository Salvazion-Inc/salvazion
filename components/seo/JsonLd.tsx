import { SEO, absoluteUrl, ogImageUrl } from '@/lib/seo/config';
import { X_ARTICLES } from '@/lib/freedom/x-articles';

/**
 * JSON-LD for Organization, WebSite, SoftwareApplication, Blog and founders.
 * Rendered on the public marketing home only.
 */
export default function JsonLd() {
  /** Blog ItemList — titles + X URLs for SEO (capped for payload size) */
  const blogItems = X_ARTICLES.slice(0, 100).map((a, i) => ({
    '@type': 'ListItem' as const,
    position: i + 1,
    item: {
      '@type': 'BlogPosting' as const,
      headline: a.title,
      url: a.url,
      image: a.image,
      datePublished: a.createdAt || undefined,
      description: a.preview?.slice(0, 200),
      author: {
        '@type': 'Person' as const,
        name: 'Salvazion',
        url: SEO.xUrl,
      },
      publisher: { '@id': `${absoluteUrl()}/#organization` },
      keywords: `Salvazion, ${a.pillar}, Salvation, Health, Freedom`,
      about: a.pillar,
      inLanguage: 'en',
    },
  }));

  const graphs = [
    {
      '@type': 'Organization',
      '@id': `${absoluteUrl()}/#organization`,
      name: SEO.siteName,
      legalName: SEO.legalName,
      url: absoluteUrl(),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(SEO.logo),
        width: 512,
        height: 512,
      },
      image: [ogImageUrl(), absoluteUrl(SEO.imageFallback)],
      email: SEO.supportEmail,
      description: SEO.description,
      slogan: SEO.tagline,
      sameAs: SEO.sameAs,
      knowsAbout: SEO.knowsAbout,
      areaServed: 'Worldwide',
      address: {
        '@type': 'PostalAddress',
        ...SEO.address,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: SEO.supportEmail,
        contactType: 'customer support',
        availableLanguage: ['English', 'Spanish', 'Portuguese'],
      },
      founder: SEO.founders.map((f) => ({
        '@type': 'Person',
        name: f.name,
        jobTitle: f.jobTitle,
        ...(f.sameAs.length ? { sameAs: f.sameAs } : {}),
        worksFor: { '@id': `${absoluteUrl()}/#organization` },
      })),
    },
    {
      '@type': 'WebSite',
      '@id': `${absoluteUrl()}/#website`,
      url: absoluteUrl(),
      name: SEO.siteName,
      alternateName: ['Salvazion Platform', 'Green Lion Kings'],
      description: SEO.description,
      publisher: { '@id': `${absoluteUrl()}/#organization` },
      inLanguage: ['en', 'es', 'pt'],
    },
    {
      '@type': 'WebPage',
      '@id': `${absoluteUrl()}/#webpage`,
      url: absoluteUrl(),
      name: SEO.title,
      description: SEO.description,
      isPartOf: { '@id': `${absoluteUrl()}/#website` },
      about: { '@id': `${absoluteUrl()}/#organization` },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: ogImageUrl(),
        width: SEO.ogImageWidth,
        height: SEO.ogImageHeight,
      },
      inLanguage: ['en', 'es', 'pt'],
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['#hero-heading', '#app h2'],
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${absoluteUrl()}/#app`,
      name: SEO.siteName,
      applicationCategory: 'LifestyleApplication',
      applicationSubCategory: 'HealthApplication',
      operatingSystem: 'Web, iOS (PWA), Android (PWA)',
      description: SEO.description,
      url: absoluteUrl(),
      image: [ogImageUrl(), absoluteUrl(SEO.logo)],
      screenshot: ogImageUrl(),
      isAccessibleForFree: true,
      inLanguage: ['en', 'es', 'pt'],
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: String(SEO.pricing.free),
          priceCurrency: SEO.pricing.currency,
          availability: 'https://schema.org/InStock',
          url: absoluteUrl('/auth/signup'),
        },
        {
          '@type': 'Offer',
          name: 'Premium Monthly',
          price: String(SEO.pricing.premiumMonthly),
          priceCurrency: SEO.pricing.currency,
          availability: 'https://schema.org/InStock',
          url: absoluteUrl('/hub/premium'),
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: String(SEO.pricing.premiumMonthly),
            priceCurrency: SEO.pricing.currency,
            billingDuration: 'P1M',
          },
        },
        {
          '@type': 'Offer',
          name: 'Premium Annual',
          price: String(SEO.pricing.premiumAnnual),
          priceCurrency: SEO.pricing.currency,
          availability: 'https://schema.org/InStock',
          url: absoluteUrl('/hub/premium'),
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: String(SEO.pricing.premiumAnnual),
            priceCurrency: SEO.pricing.currency,
            billingDuration: 'P1Y',
          },
        },
      ],
      publisher: { '@id': `${absoluteUrl()}/#organization` },
      featureList: [
        'The platform that restores the human person',
        'Offline Bible (ES, EN, PT, originals)',
        'Daily devotionals',
        'Health tracking, sensors and wearables',
        'Freedom library, churches map and media',
        'Community of Green Lion Kings',
        'Salvazion AI — purpose, Global Score and Platform coach',
        '$SALVAZION on Solana',
        'Salvazion Blog — X Articles on Salvation, Health and Freedom',
      ],
    },
    {
      '@type': 'Blog',
      '@id': `${absoluteUrl()}/#blog`,
      name: 'Salvazion Blog',
      description:
        'Long-form articles from @salvazion_ on Salvation, Health and Freedom — faith, family, body, sovereignty and Western Christian Culture. Read on X.',
      url: `${absoluteUrl()}/#blog`,
      inLanguage: ['en', 'es', 'pt'],
      publisher: { '@id': `${absoluteUrl()}/#organization` },
      author: {
        '@type': 'Organization',
        name: SEO.siteName,
        url: SEO.xUrl,
      },
      blogPost: blogItems.map((li) => li.item),
      numberOfItems: X_ARTICLES.length,
      keywords: [
        'Salvazion',
        'Salvation',
        'Health',
        'Freedom',
        'X Articles',
        '@salvazion_',
        'Western Christian Culture',
        'BioConservatism',
      ],
    },
    {
      '@type': 'ItemList',
      '@id': `${absoluteUrl()}/#blog-itemlist`,
      name: 'Salvazion Articles on X',
      description:
        'Catalog of Salvazion long-form articles linked to X, organized by Salvation, Health and Freedom.',
      numberOfItems: X_ARTICLES.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: blogItems,
    },
  ];

  const payload = {
    '@context': 'https://schema.org',
    '@graph': graphs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
