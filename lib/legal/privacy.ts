import { APP_URL, SUPPORT_EMAIL } from '@/lib/config/site';
import type { Language } from '@/lib/types';
import type { LegalDoc } from '@/lib/legal/terms';

const UPDATED_EN = 'July 25, 2026';
const UPDATED_ES = '25 de julio de 2026';

export const PRIVACY: Record<Language, LegalDoc> = {
  en: {
    title: 'Privacy Policy',
    updated: UPDATED_EN,
    metaDescription:
      'How Salvazion collects, uses, and protects your personal and health-related data.',
    sections: [
      {
        heading: '',
        paragraphs: [
          `At Salvazion (“we”) we respect your privacy. This policy describes what data we process in the App (${APP_URL}), for what purposes, and what rights you have. By using the App, you accept this policy.`,
        ],
      },
      {
        heading: '1. Controller',
        paragraphs: [
          `Data controller: Salvazion / product team associated with salvazion.org. Contact: ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '2. Data we may collect',
        bullets: [
          'Account: email, name, language, profile photo, onboarding preferences (purpose, city, country, date of birth, spiritual maturity, family, focus areas).',
          'Social sign-in: if you use Google or X, we receive identifiers and profile data the provider shares (e.g. email, name, photo, X handle), subject to their settings and your consent.',
          'App usage: scoring actions (Salvation / Health / Freedom), streaks, badges, Bible reading progress, completed devotionals.',
          'Health: sleep, hydration, meals, sports, phone sensor or wearable metrics you enable or log manually.',
          'Phalanx: invitations and connections with other users you accept.',
          'Web3 (optional): Solana wallet address if you connect one; we do not custody private keys.',
          'Technical: session cookies (Supabase Auth), device/browser data needed for security and PWA operation.',
        ],
      },
      {
        heading: '3. Purposes',
        bullets: [
          'Create and maintain your account and session.',
          'Personalize devotionals, coach, and recommendations by life stage.',
          'Calculate scores, streaks, and badges for the three pillars.',
          'Provide Health features and sensor/wearable sync only when you use them.',
          'Manage Phalanx invitations and links.',
          'Improve security, prevent abuse, and operate the service (Supabase, Vercel, etc.).',
          'Comply with legal obligations when applicable.',
        ],
      },
      {
        heading: '4. Legal bases',
        paragraphs: [
          'We process data to perform the contract of App use (these terms and the service you request), with your consent (e.g. sensors, social login, system permissions), and where applicable for legitimate interests in security and product improvement, or legal obligation.',
        ],
      },
      {
        heading: '5. Processors and providers',
        intro: 'We may use providers that process data on our behalf, including:',
        bullets: [
          'Supabase — authentication, database, and storage (with Row Level Security: generally only you access your rows).',
          'Vercel — App hosting.',
          'Google / X — only if you choose “Continue with Gmail” or “Continue with X”; their use is also governed by their policies.',
          'AI provider — if you generate AI devotionals; necessary profile context may be sent to personalize text.',
          'Jupiter / Solana network — if you use swap or wallet; blockchain transactions are public.',
        ],
        paragraphs: [
          'We do not sell your personal information to third parties for third-party advertising.',
        ],
      },
      {
        heading: '6. Health and sensitive data',
        paragraphs: [
          'Health data (sleep, activity, etc.) is sensitive. It is collected only when you use those features. We do not use it to diagnose disease. You may stop using sensors or clear local data via App and device options. On native shells, HealthKit / Health Connect require your explicit system permission.',
        ],
      },
      {
        heading: '7. Retention',
        paragraphs: [
          `We retain data while you keep an account or as needed for the service and legal obligations. You may request account deletion by contacting ${SUPPORT_EMAIL}. Some cache may live on your device (localStorage) until you clear it or uninstall the App.`,
        ],
      },
      {
        heading: '8. Security',
        paragraphs: [
          `We apply reasonable measures (HTTPS, database RLS, secure session cookies). No system is 100% invulnerable; report relevant incidents to ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '9. Your rights',
        paragraphs: [
          `Depending on your jurisdiction (e.g. access, rectification, erasure, objection, portability, or restriction), you may exercise rights by writing to ${SUPPORT_EMAIL}. You may also revoke sensor/social permissions on the device or at the provider (Google, X).`,
        ],
      },
      {
        heading: '10. Children',
        paragraphs: [
          'The App is not directed at children without supervision. If a guardian believes a minor provided us data, contact us to review.',
        ],
      },
      {
        heading: '11. International transfers',
        paragraphs: [
          'Providers such as Supabase or Vercel may process data on servers outside your country. We use recognized providers and standard industry contractual measures where applicable.',
        ],
      },
      {
        heading: '12. Cookies',
        paragraphs: [
          'We use cookies or similar storage essential for authentication and preferences (language, text size). We do not rely on third-party ad networks for the core App.',
        ],
      },
      {
        heading: '13. Changes',
        paragraphs: [
          'We may update this policy by publishing the new version on this URL with an updated date. Continued use constitutes acceptance of material changes to the extent permitted by law.',
        ],
      },
      {
        heading: '14. Contact',
        paragraphs: [
          `Privacy and personal data: ${SUPPORT_EMAIL}. Terms: see Terms of Service at /terms.`,
        ],
      },
    ],
  },
  es: {
    title: 'Política de Privacidad',
    updated: UPDATED_ES,
    metaDescription:
      'Cómo Salvazion recoge, usa y protege tus datos personales y de salud.',
    sections: [
      {
        heading: '',
        paragraphs: [
          `En Salvazion (“nosotros”) respetamos tu privacidad. Esta política describe qué datos tratamos en la App (${APP_URL}), con qué fin y qué derechos tienes. Al usar la App, aceptas esta política.`,
        ],
      },
      {
        heading: '1. Responsable',
        paragraphs: [
          `Responsable del tratamiento: Salvazion / equipo del producto asociado al dominio salvazion.org. Contacto: ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '2. Datos que podemos recoger',
        bullets: [
          'Cuenta: email, nombre, idioma, foto de perfil, preferencias de onboarding (propósito, ciudad, país, fecha de nacimiento, madurez espiritual, familia, focos).',
          'Inicio de sesión social: si usas Google o X, recibimos identificadores y datos de perfil que el proveedor comparta (p. ej. email, nombre, foto, @ de X), según su configuración y tu consentimiento.',
          'Uso de la App: acciones de puntuación (Salvation / Health / Freedom), rachas, insignias, progreso de lectura bíblica, devocionales completados.',
          'Health: sueño, hidratación, comidas, deportes, métricas de sensores del teléfono o wearables que tú actives o registres manualmente.',
          'Phalanx: invitaciones y conexiones con otros usuarios que aceptes.',
          'Web3 (opcional): dirección de billetera Solana si la conectas; no custodiamos claves privadas.',
          'Técnicos: cookies de sesión (Supabase Auth), datos de dispositivo/navegador necesarios para seguridad y funcionamiento de la PWA.',
        ],
      },
      {
        heading: '3. Finalidades',
        bullets: [
          'Crear y mantener tu cuenta y sesión.',
          'Personalizar devocionales, coach y recomendaciones por etapa de vida.',
          'Calcular scores, rachas e insignias de los tres pilares.',
          'Ofrecer funciones de Health y sincronización con sensores/wearables solo si las usas.',
          'Gestionar invitaciones y vínculos Phalanx.',
          'Mejorar seguridad, prevenir abuso y operar el servicio (infraestructura Supabase, Vercel, etc.).',
          'Cumplir obligaciones legales cuando corresponda.',
        ],
      },
      {
        heading: '4. Base legal',
        paragraphs: [
          'Tratamos datos para ejecutar el contrato de uso de la App (estos términos y el servicio que solicitas), con tu consentimiento (p. ej. sensores, login social, permisos del sistema) y, cuando aplique, por interés legítimo en seguridad y mejora del producto, o por obligación legal.',
        ],
      },
      {
        heading: '5. Proveedores y encargados',
        intro: 'Podemos usar proveedores que tratan datos en nuestro nombre, entre otros:',
        bullets: [
          'Supabase — autenticación, base de datos y almacenamiento (con Row Level Security: en general solo tú accedes a tus filas).',
          'Vercel — alojamiento de la App.',
          'Google / X — solo si eliges “Continuar con Gmail” o “Continuar con X”; su uso se rige también por sus políticas.',
          'Proveedor de IA — si generas devocionales con IA; se envían datos de perfil necesarios para personalizar el texto.',
          'Jupiter / red Solana — si usas swap o billetera; las transacciones son públicas en blockchain.',
        ],
        paragraphs: [
          'No vendemos tu información personal a terceros para publicidad de terceros.',
        ],
      },
      {
        heading: '6. Datos de salud y sensibles',
        paragraphs: [
          'Los datos de Health (sueño, actividad, etc.) son sensibles. Solo se recogen cuando usas esas funciones. No los usamos para diagnosticar enfermedades. Puedes dejar de usar sensores o borrar datos locales según las opciones de la App y del dispositivo. En shell nativo, HealthKit / Health Connect requieren tu permiso explícito del sistema.',
        ],
      },
      {
        heading: '7. Conservación',
        paragraphs: [
          `Conservamos los datos mientras mantengas la cuenta o sea necesario para el servicio y obligaciones legales. Puedes solicitar eliminación de cuenta contactando a ${SUPPORT_EMAIL}. Parte del caché puede vivir en tu dispositivo (localStorage) hasta que lo borres o desinstales la App.`,
        ],
      },
      {
        heading: '8. Seguridad',
        paragraphs: [
          `Aplicamos medidas razonables (HTTPS, RLS en base de datos, cookies de sesión seguras). Ningún sistema es 100 % invulnerable; notifícanos incidentes relevantes a ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '9. Tus derechos',
        paragraphs: [
          `Según tu jurisdicción (p. ej. derechos de acceso, rectificación, supresión, oposición, portabilidad o limitación), puedes ejercerlos escribiendo a ${SUPPORT_EMAIL}. También puedes revocar permisos de sensores/redes sociales en el dispositivo o en el proveedor (Google, X).`,
        ],
      },
      {
        heading: '10. Menores',
        paragraphs: [
          'La App no está dirigida a menores sin supervisión. Si un tutor cree que un menor nos ha facilitado datos, contáctanos para revisarlo.',
        ],
      },
      {
        heading: '11. Transferencias internacionales',
        paragraphs: [
          'Proveedores como Supabase o Vercel pueden procesar datos en servidores fuera de tu país. Usamos proveedores reconocidos y medidas contractuales habituales de la industria cuando aplica.',
        ],
      },
      {
        heading: '12. Cookies',
        paragraphs: [
          'Usamos cookies o almacenamiento similar esenciales para autenticación y preferencias (idioma, tamaño de texto). No dependemos de redes publicitarias de terceros para el núcleo de la App.',
        ],
      },
      {
        heading: '13. Cambios',
        paragraphs: [
          'Podemos actualizar esta política publicando la nueva versión en esta URL con fecha de actualización. El uso continuado implica aceptación de los cambios materiales en la medida permitida por la ley.',
        ],
      },
      {
        heading: '14. Contacto',
        paragraphs: [
          `Privacidad y datos personales: ${SUPPORT_EMAIL}. Términos: ver Términos de Servicio en /terms.`,
        ],
      },
    ],
  },
};
