import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import SalvazionLanding from '@/components/landing/SalvazionLanding';
import { SEO, absoluteUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: {
    absolute: SEO.title,
  },
  description: SEO.description,
  keywords: [...SEO.keywords],
  alternates: {
    canonical: absoluteUrl('/'),
    languages: {
      en: absoluteUrl('/'),
      es: absoluteUrl('/'),
      'x-default': absoluteUrl('/'),
    },
  },
  openGraph: {
    type: 'website',
    locale: SEO.locale,
    alternateLocale: [SEO.alternateLocale],
    url: absoluteUrl('/'),
    siteName: SEO.siteName,
    title: SEO.title,
    description: SEO.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.title,
    description: SEO.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <SalvazionLanding />
    </>
  );
}
