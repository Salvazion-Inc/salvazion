import { SEO, absoluteUrl } from '@/lib/seo/config';

/**
 * JSON-LD for Organization, WebSite, SoftwareApplication and founders.
 * Rendered on the public marketing home only.
 */
export default function JsonLd() {
  const graphs = [
    {
      '@type': 'Organization',
      '@id': `${absoluteUrl()}/#organization`,
      name: SEO.siteName,
      legalName: SEO.legalName,
      url: absoluteUrl(),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
        width: 512,
        height: 512,
      },
      image: absoluteUrl(SEO.imageFallback),
      email: SEO.supportEmail,
      description: SEO.description,
      slogan: SEO.tagline,
      sameAs: [SEO.marketingUrl],
      founder: SEO.founders.map((f) => ({
        '@type': 'Person',
        name: f.name,
        jobTitle: f.jobTitle,
        ...(f.sameAs.length ? { sameAs: f.sameAs } : {}),
      })),
    },
    {
      '@type': 'WebSite',
      '@id': `${absoluteUrl()}/#website`,
      url: absoluteUrl(),
      name: SEO.siteName,
      description: SEO.description,
      publisher: { '@id': `${absoluteUrl()}/#organization` },
      inLanguage: ['en', 'es'],
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
        url: absoluteUrl('/logo.png'),
      },
      inLanguage: ['en', 'es'],
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
      image: absoluteUrl('/logo.png'),
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
        'Offline Bible (ES, EN, originals)',
        'Daily devotionals',
        'Health tracking, sensors and wearables',
        'Freedom library and media',
        'Phalanx community invites',
        'Green Lion AI coach (Premium)',
        '$SALVAZION on Solana',
      ],
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
