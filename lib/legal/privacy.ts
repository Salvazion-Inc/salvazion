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
  pt: {
    title: 'Política de Privacidade',
    updated: '25 de julho de 2026',
    metaDescription:
      'Como a Salvazion coleta, usa e protege seus dados pessoais e de saúde.',
    sections: [
      {
        heading: '',
        paragraphs: [
          `Na Salvazion (“nós”) respeitamos a sua privacidade. Esta política descreve quais dados tratamos no App (${APP_URL}), para quais fins e quais direitos você tem. Ao usar o App, você aceita esta política.`,
        ],
      },
      {
        heading: '1. Controlador',
        paragraphs: [
          `Controlador dos dados: Salvazion / equipe do produto associada a salvazion.org. Contato: ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '2. Dados que podemos coletar',
        bullets: [
          'Conta: email, nome, idioma, foto de perfil, preferências de onboarding (propósito, cidade, país, data de nascimento, maturidade espiritual, família, focos).',
          'Login social: se você usa Google ou X, recebemos identificadores e dados de perfil que o provedor compartilhe (p. ex. email, nome, foto, @ do X), segundo a configuração dele e o seu consentimento.',
          'Uso do App: ações de pontuação (Salvation / Health / Freedom), sequências, insígnias, progresso de leitura bíblica, devocionais concluídos.',
          'Health: sono, hidratação, refeições, esportes, métricas de sensores do telefone ou wearables que você ative ou registre manualmente.',
          'Phalanx: convites e conexões com outros usuários que você aceite.',
          'Web3 (opcional): endereço de carteira Solana se você conectar uma; não custodiamos chaves privadas.',
          'Técnicos: cookies de sessão (Supabase Auth), dados de dispositivo/navegador necessários para segurança e funcionamento do PWA.',
        ],
      },
      {
        heading: '3. Finalidades',
        bullets: [
          'Criar e manter sua conta e sessão.',
          'Personalizar devocionais, coach e recomendações por etapa de vida.',
          'Calcular scores, sequências e insígnias dos três pilares.',
          'Oferecer funções de Health e sincronização com sensores/wearables só se você as usar.',
          'Gerenciar convites e vínculos Phalanx.',
          'Melhorar a segurança, prevenir abuso e operar o serviço (infraestrutura Supabase, Vercel etc.).',
          'Cumprir obrigações legais quando corresponder.',
        ],
      },
      {
        heading: '4. Bases legais',
        paragraphs: [
          'Tratamos dados para executar o contrato de uso do App (estes termos e o serviço que você solicita), com o seu consentimento (p. ex. sensores, login social, permissões do sistema) e, quando aplicável, por interesse legítimo em segurança e melhoria do produto, ou por obrigação legal.',
        ],
      },
      {
        heading: '5. Processadores e provedores',
        intro: 'Podemos usar provedores que tratam dados em nosso nome, entre outros:',
        bullets: [
          'Supabase — autenticação, banco de dados e armazenamento (com Row Level Security: em geral só você acessa suas linhas).',
          'Vercel — hospedagem do App.',
          'Google / X — só se você escolher “Continuar com Gmail” ou “Continuar com X”; o uso também se rege pelas políticas deles.',
          'Provedor de IA — se você gerar devocionais com IA; enviam-se dados de perfil necessários para personalizar o texto.',
          'Jupiter / rede Solana — se você usar swap ou carteira; as transações são públicas na blockchain.',
        ],
        paragraphs: [
          'Não vendemos suas informações pessoais a terceiros para publicidade de terceiros.',
        ],
      },
      {
        heading: '6. Dados de saúde e sensíveis',
        paragraphs: [
          'Os dados de Health (sono, atividade etc.) são sensíveis. Só são coletados quando você usa essas funções. Não os usamos para diagnosticar doenças. Você pode deixar de usar sensores ou apagar dados locais segundo as opções do App e do dispositivo. No shell nativo, HealthKit / Health Connect exigem sua permissão explícita do sistema.',
        ],
      },
      {
        heading: '7. Conservação',
        paragraphs: [
          `Conservamos os dados enquanto você mantiver a conta ou for necessário para o serviço e obrigações legais. Você pode pedir a exclusão da conta escrevendo para ${SUPPORT_EMAIL}. Parte do cache pode viver no seu dispositivo (localStorage) até você apagá-lo ou desinstalar o App.`,
        ],
      },
      {
        heading: '8. Segurança',
        paragraphs: [
          `Aplicamos medidas razoáveis (HTTPS, RLS no banco de dados, cookies de sessão seguros). Nenhum sistema é 100% invulnerável; comunique incidentes relevantes a ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '9. Seus direitos',
        paragraphs: [
          `Segundo a sua jurisdição (p. ex. acesso, retificação, exclusão, oposição, portabilidade ou limitação), você pode exercê-los escrevendo para ${SUPPORT_EMAIL}. Também pode revogar permissões de sensores/redes sociais no dispositivo ou no provedor (Google, X).`,
        ],
      },
      {
        heading: '10. Menores',
        paragraphs: [
          'O App não é dirigido a menores sem supervisão. Se um responsável acreditar que um menor nos forneceu dados, entre em contato para revisarmos.',
        ],
      },
      {
        heading: '11. Transferências internacionais',
        paragraphs: [
          'Provedores como Supabase ou Vercel podem processar dados em servidores fora do seu país. Usamos provedores reconhecidos e medidas contratuais habituais do setor quando aplicável.',
        ],
      },
      {
        heading: '12. Cookies',
        paragraphs: [
          'Usamos cookies ou armazenamento semelhante essenciais para autenticação e preferências (idioma, tamanho do texto). Não dependemos de redes publicitárias de terceiros para o núcleo do App.',
        ],
      },
      {
        heading: '13. Mudanças',
        paragraphs: [
          'Podemos atualizar esta política publicando a nova versão nesta URL com data atualizada. O uso continuado implica aceitação das mudanças materiais na medida permitida pela lei.',
        ],
      },
      {
        heading: '14. Contato',
        paragraphs: [
          `Privacidade e dados pessoais: ${SUPPORT_EMAIL}. Termos: veja os Termos de Serviço em /terms.`,
        ],
      },
    ],
  },
};
