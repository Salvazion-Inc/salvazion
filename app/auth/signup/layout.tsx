import type { Metadata } from 'next';
import { SEO, absoluteUrl, ogImageMetadata } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Create free account | Crear cuenta gratis',
  description:
    'Join Salvazion free — offline Bible, devotionals, health scores, Freedom library and Solana. Upgrade to Premium anytime. Únete gratis a Salvazion.',
  alternates: {
    canonical: absoluteUrl('/auth/signup'),
  },
  openGraph: {
    title: 'Create your free Salvazion account',
    description:
      'Start free: Salvation · Health · Freedom. Premium unlocks AI coach, AI devotionals and cloud wearables.',
    url: absoluteUrl('/auth/signup'),
    type: 'website',
    images: [ogImageMetadata()],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create your free Salvazion account',
    description:
      'Start free: Salvation · Health · Freedom. Premium unlocks AI coach, AI devotionals and cloud wearables.',
    images: [ogImageMetadata()],
    creator: SEO.twitterHandle,
    site: SEO.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
