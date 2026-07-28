import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { PRIVACY } from '@/lib/legal/privacy';
import { APP_URL } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Privacy Policy | Política de Privacidad',
  description: PRIVACY.en.metaDescription,
  alternates: {
    canonical: `${APP_URL}/privacy`,
    languages: {
      en: `${APP_URL}/privacy`,
      es: `${APP_URL}/privacy`,
    },
  },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      docs={PRIVACY}
      relatedHref="/terms"
      relatedLabelEn="Terms of Service"
      relatedLabelEs="Términos de Servicio"
    />
  );
}
