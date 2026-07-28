import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { TERMS } from '@/lib/legal/terms';
import { absoluteUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Terms of Service | Términos de Servicio',
  description: TERMS.en.metaDescription,
  alternates: {
    canonical: absoluteUrl('/terms'),
    languages: {
      en: absoluteUrl('/terms'),
      es: absoluteUrl('/terms'),
      'x-default': absoluteUrl('/terms'),
    },
  },
  openGraph: {
    title: 'Terms of Service | Salvazion',
    description: TERMS.en.metaDescription,
    url: absoluteUrl('/terms'),
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <LegalDocument
      docs={TERMS}
      relatedHref="/privacy"
      relatedLabelEn="Privacy Policy"
      relatedLabelEs="Política de Privacidad"
    />
  );
}
