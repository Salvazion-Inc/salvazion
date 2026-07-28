import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { TERMS } from '@/lib/legal/terms';
import { APP_URL } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Terms of Service | Términos de Servicio',
  description: TERMS.en.metaDescription,
  alternates: {
    canonical: `${APP_URL}/terms`,
    languages: {
      en: `${APP_URL}/terms`,
      es: `${APP_URL}/terms`,
    },
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
