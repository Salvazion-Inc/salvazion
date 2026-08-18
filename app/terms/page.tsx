import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { TERMS } from '@/lib/legal/terms';
import { absoluteUrl, ogImageMetadata } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Terms of Service | Términos de Servicio | Termos de Serviço',
  description: TERMS.en.metaDescription,
  alternates: {
    canonical: absoluteUrl('/terms'),
    languages: {
      en: absoluteUrl('/terms'),
      es: absoluteUrl('/terms'),
      pt: absoluteUrl('/terms'),
      'x-default': absoluteUrl('/terms'),
    },
  },
  openGraph: {
    title: 'Terms of Service | Salvazion',
    description: TERMS.en.metaDescription,
    url: absoluteUrl('/terms'),
    type: 'website',
    images: [ogImageMetadata()],
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
      relatedLabelPt="Política de Privacidade"
    />
  );
}
