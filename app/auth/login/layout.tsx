import type { Metadata } from 'next';
import { SEO, absoluteUrl, ogImageMetadata } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Sign in | Entrar al Hub',
  description:
    'Sign in to Salvazion Hub — Salvation, Health and Freedom in one Platform. Gmail, X or email. Inicia sesión en el Hub de Salvazion.',
  alternates: {
    canonical: absoluteUrl('/auth/login'),
  },
  openGraph: {
    title: 'Sign in to Salvazion',
    description:
      'Enter the Hub — Bible, devotionals, health, Freedom, community and $SALVAZION.',
    url: absoluteUrl('/auth/login'),
    type: 'website',
    images: [ogImageMetadata()],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign in to Salvazion',
    description:
      'Enter the Hub — Bible, devotionals, health, Freedom, community and $SALVAZION.',
    images: [ogImageMetadata()],
    creator: SEO.twitterHandle,
    site: SEO.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
