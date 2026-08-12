import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { PRIVACY } from '@/lib/legal/privacy';
import { absoluteUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Privacy Policy | Política de Privacidad | Política de Privacidade',
  description: PRIVACY.en.metaDescription,
  alternates: {
    canonical: absoluteUrl('/privacy'),
    languages: {
      en: absoluteUrl('/privacy'),
      es: absoluteUrl('/privacy'),
      pt: absoluteUrl('/privacy'),
      'x-default': absoluteUrl('/privacy'),
    },
  },
  openGraph: {
    title: 'Privacy Policy | Salvazion',
    description: PRIVACY.en.metaDescription,
    url: absoluteUrl('/privacy'),
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      docs={PRIVACY}
      relatedHref="/terms"
      relatedLabelEn="Terms of Service"
      relatedLabelEs="Términos de Servicio"
      relatedLabelPt="Termos de Serviço"
    />
  );
}
