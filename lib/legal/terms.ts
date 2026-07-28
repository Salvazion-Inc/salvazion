import { APP_URL, SUPPORT_EMAIL } from '@/lib/config/site';
import type { Language } from '@/lib/types';

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  intro?: string;
};

export type LegalDoc = {
  title: string;
  updated: string;
  metaDescription: string;
  sections: LegalSection[];
};

const UPDATED_EN = 'July 25, 2026';
const UPDATED_ES = '25 de julio de 2026';

export const TERMS: Record<Language, LegalDoc> = {
  en: {
    title: 'Terms of Service',
    updated: UPDATED_EN,
    metaDescription:
      'Terms of use for the Salvazion app (Salvation, Health, and Freedom).',
    sections: [
      {
        heading: '',
        paragraphs: [
          `Welcome to Salvazion (“the App”, “we”), available at ${APP_URL}. By creating an account, signing in, or using the App, you agree to these Terms of Service. If you do not agree, do not use the App.`,
        ],
      },
      {
        heading: '1. Service description',
        paragraphs: [
          'Salvazion is a digital application oriented around the pillars Salvation, Health, and Freedom: Bible reading, devotionals, health habits, community (Phalanx), and optional Web3 wallet tools on Solana. The App is formative, motivational, and community-oriented; it does not replace professional medical, legal, financial, or pastoral advice.',
        ],
      },
      {
        heading: '2. Eligibility and account',
        bullets: [
          'You must have legal capacity to accept these terms (generally the age of majority in your jurisdiction, or guardian consent where required).',
          'You may register with email/password, magic link, Google (Gmail), or X (Twitter), depending on enabled providers.',
          'You are responsible for the confidentiality of your account and for activity under it.',
          'You must provide truthful information to the extent the App requests it to personalize your experience.',
        ],
      },
      {
        heading: '3. Acceptable use',
        intro: 'You agree not to:',
        bullets: [
          'Use the App unlawfully, fraudulently, or in ways that violate third-party rights.',
          'Attempt to breach security, gain unauthorized access, scrape abusively, or interfere with the service.',
          'Post or transmit offensive or defamatory content, or content that promotes violence or illegality in community spaces.',
          'Impersonate others or abuse Phalanx invitations.',
        ],
      },
      {
        heading: '4. Spiritual and devotional content',
        paragraphs: [
          'Bible texts, devotionals (including those generated with AI / Grok assistance when configured), and coaching messages are offered as personal and spiritual growth resources. They are not medical, psychological, or legal advice. You remain free to discern and apply what you find useful under your own responsibility.',
        ],
      },
      {
        heading: '5. Health, sensors, and wearables',
        paragraphs: [
          'Health features (sleep, hydration, exercise, phone sensors, wearables, HealthKit / Health Connect, etc.) are estimates and tracking tools. They are not medical devices or diagnoses. Consult a health professional before changing habits, exercise, or diet. Use of sensors and device permissions is voluntary.',
        ],
      },
      {
        heading: '6. Web3, Solana, and $SALVAZION',
        paragraphs: [
          'If you connect a wallet or use swaps (e.g. Jupiter), you act under your own responsibility. Salvazion does not custody funds, is not an exchange, and is not a financial advisor. Blockchain transactions are irreversible and involve risk of loss. Comply with the laws of your jurisdiction regarding crypto assets.',
        ],
      },
      {
        heading: '7. Intellectual property',
        paragraphs: [
          'The Salvazion brand, App design, logos, and proprietary software belong to us or are used under license. Bible translations are used according to their respective rights (e.g. public domain texts or applicable licenses). You may not copy, resell, or exploit the App without authorization, except as permitted by law.',
        ],
      },
      {
        heading: '8. Availability and changes',
        paragraphs: [
          'We may modify, suspend, or discontinue App features, or these terms, effective when published on this page. Continued use after material changes constitutes acceptance. We do not guarantee uninterrupted availability or freedom from errors.',
        ],
      },
      {
        heading: '9. Limitation of liability',
        paragraphs: [
          'To the fullest extent permitted by law, Salvazion and its collaborators are not liable for indirect damages, lost profits, data loss, or damages arising from use or inability to use the App, including AI, health, or Web3 features. The App is provided “as is”.',
        ],
      },
      {
        heading: '10. Termination',
        paragraphs: [
          'You may stop using the App at any time. We may suspend or close accounts that breach these terms or put the service or other users at risk.',
        ],
      },
      {
        heading: '11. Governing law',
        paragraphs: [
          `These terms are interpreted in good faith. If any clause is unenforceable, the remainder remains in force. For disputes, we will first seek an amicable solution by contacting ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '12. Contact',
        paragraphs: [
          `Questions about these terms: ${SUPPORT_EMAIL}. Privacy: see our Privacy Policy at /privacy.`,
        ],
      },
    ],
  },
  es: {
    title: 'Términos de Servicio',
    updated: UPDATED_ES,
    metaDescription:
      'Términos de uso de la aplicación Salvazion (Salvation, Health y Freedom).',
    sections: [
      {
        heading: '',
        paragraphs: [
          `Bienvenido a Salvazion (“la App”, “nosotros”), disponible en ${APP_URL}. Al crear una cuenta, iniciar sesión o usar la App, aceptas estos Términos de Servicio. Si no estás de acuerdo, no uses la App.`,
        ],
      },
      {
        heading: '1. Descripción del servicio',
        paragraphs: [
          'Salvazion es una aplicación digital orientada a los pilares Salvation, Health y Freedom: lectura bíblica, devocionales, hábitos de salud, comunidad (Phalanx) y herramientas opcionales relacionadas con billeteras Web3 en Solana. La App es de naturaleza formativa, motivacional y comunitaria; no sustituye consejo médico, legal, financiero ni pastoral profesional.',
        ],
      },
      {
        heading: '2. Elegibilidad y cuenta',
        bullets: [
          'Debes tener capacidad legal para aceptar estos términos (en general, mayoría de edad en tu jurisdicción, o consentimiento de un tutor cuando aplique).',
          'Puedes registrarte con email/contraseña, enlace mágico, Google (Gmail) o X (Twitter), según los proveedores habilitados.',
          'Eres responsable de la confidencialidad de tu cuenta y de la actividad realizada con ella.',
          'Debes proporcionar información veraz en la medida en que la App la solicite para personalizar la experiencia.',
        ],
      },
      {
        heading: '3. Uso aceptable',
        intro: 'Te comprometes a no:',
        bullets: [
          'Usar la App de forma ilegal, fraudulenta o que viole derechos de terceros.',
          'Intentar vulnerar seguridad, acceso no autorizado, scraping abusivo o interferir con el servicio.',
          'Publicar o transmitir contenido ofensivo, difamatorio, o que promueva violencia o ilegalidad en espacios de comunidad.',
          'Suplantar identidad o abusar de invitaciones Phalanx.',
        ],
      },
      {
        heading: '4. Contenido espiritual y devocional',
        paragraphs: [
          'Textos bíblicos, devocionales (incluidos los generados con asistencia de IA / Grok cuando esté configurado) y mensajes de coaching se ofrecen como recursos de crecimiento personal y espiritual. No constituyen consejo médico, psicológico ni legal. Eres libre de discernir y aplicar lo que consideres útil bajo tu propia responsabilidad.',
        ],
      },
      {
        heading: '5. Salud, sensores y wearables',
        paragraphs: [
          'Las funciones de Health (sueño, hidratación, ejercicio, sensores del teléfono, wearables, HealthKit / Health Connect, etc.) son estimaciones y herramientas de seguimiento. No son dispositivos médicos ni diagnósticos. Consulta a un profesional de la salud antes de cambiar hábitos, ejercicio o alimentación. El uso de sensores y permisos del dispositivo es voluntario.',
        ],
      },
      {
        heading: '6. Web3, Solana y $SALVAZION',
        paragraphs: [
          'Si conectas una billetera o usas swaps (p. ej. Jupiter), actúas bajo tu propia responsabilidad. Salvazion no custodia fondos, no es un exchange ni un asesor financiero. Las transacciones en blockchain son irreversibles y conllevan riesgo de pérdida. Cumple la normativa de tu jurisdicción respecto a criptoactivos.',
        ],
      },
      {
        heading: '7. Propiedad intelectual',
        paragraphs: [
          'La marca Salvazion, el diseño de la App, logotipos y software propio nos pertenecen o se usan bajo licencia. Las traducciones bíblicas se usan conforme a sus respectivos derechos (p. ej. textos de dominio público o licencias aplicables). No puedes copiar, revender o explotar la App sin autorización, salvo lo permitido por la ley.',
        ],
      },
      {
        heading: '8. Disponibilidad y cambios',
        paragraphs: [
          'Podemos modificar, suspender o discontinuar funciones de la App, o estos términos, con efecto al publicarlos en esta página. El uso continuado tras cambios relevantes implica aceptación. No garantizamos disponibilidad ininterrumpida ni ausencia de errores.',
        ],
      },
      {
        heading: '9. Limitación de responsabilidad',
        paragraphs: [
          'En la medida permitida por la ley, Salvazion y sus colaboradores no serán responsables por daños indirectos, lucros cesantes, pérdida de datos o daños derivados del uso o la imposibilidad de uso de la App, incluido el uso de IA, salud o Web3. La App se ofrece “tal cual” (“as is”).',
        ],
      },
      {
        heading: '10. Terminación',
        paragraphs: [
          'Puedes dejar de usar la App en cualquier momento. Podemos suspender o cerrar cuentas que incumplan estos términos o pongan en riesgo el servicio u otros usuarios.',
        ],
      },
      {
        heading: '11. Ley aplicable',
        paragraphs: [
          `Estos términos se interpretan de buena fe. Si alguna cláusula no fuera exigible, el resto permanecerá en vigor. Para disputas, se buscará primero una solución amistosa contactando a ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '12. Contacto',
        paragraphs: [
          `Preguntas sobre estos términos: ${SUPPORT_EMAIL}. Privacidad: ver Política de Privacidad en /privacy.`,
        ],
      },
    ],
  },
};
