import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo/config';

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
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
