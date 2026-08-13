import { APP_URL, SUPPORT_EMAIL } from '@/lib/config/site';
import type { Language } from '@/lib/types';
import type { LegalDoc } from '@/lib/legal/terms';

const UPDATED_EN = 'August 12, 2026';
const UPDATED_ES = '12 de agosto de 2026';
const UPDATED_PT = '12 de agosto de 2026';

export const PRIVACY: Record<Language, LegalDoc> = {
  en: {
    title: 'Privacy Policy',
    updated: UPDATED_EN,
    metaDescription:
      'How Salvazion, Inc. collects, uses, and protects your personal, health, payment, and AI-related data.',
    sections: [
      {
        heading: '',
        paragraphs: [
          `Salvazion, Inc. (“Salvazion”, “we”) respects your privacy. This policy describes what data we process in the App (${APP_URL}), for what purposes, with whom we share it, and what rights you have. By using the App, you accept this policy together with our Terms of Service at /terms.`,
        ],
      },
      {
        heading: '1. Controller',
        paragraphs: [
          `Data controller: Salvazion, Inc., a Delaware corporation. Registered office: 131 Continental Dr, Suite 305, Newark, DE 19713, USA. Contact: ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '2. Data we may collect',
        intro: 'Depending on how you use the App, we may process:',
        bullets: [
          'Account: email, name, language (English, Spanish, or Brazilian Portuguese), profile photo, onboarding preferences (purpose, city, country, date of birth, spiritual maturity, family, focus areas).',
          'Social sign-in: if you use Google or X, identifiers and profile data the provider shares (for example email, name, photo, X handle), subject to their settings and your consent.',
          'App usage: Salvation / Health / Freedom scores, streaks, badges, Bible reading progress, completed devotionals, calendar and prayer-motive entries, Phalanx invitations you send or accept.',
          'Health: sleep, hydration, meals, sports, fasting, women’s-health logs, clinical notes you enter, phone-sensor or Bluetooth heart-rate metrics, and wearable metrics you enable (Fitbit, Oura, WHOOP, Garmin, HealthKit, Health Connect).',
          'Photos you choose to upload for meal or body-composition estimates.',
          'Location, only if you grant permission (for example outdoor climate or the churches map).',
          'AI conversations: messages you send to the Green Lion coach, and limited profile context needed to personalize devotionals or coaching.',
          'Payments: if you subscribe to Premium, Stripe processes card or wallet details; we receive subscription status, customer id, and limited billing metadata — not your full card number.',
          'Web3 (optional): Solana wallet address if you connect one. We do not custody private keys.',
          'Technical: session cookies (Supabase Auth), device and browser data needed for security, PWA, and native-shell operation.',
        ],
      },
      {
        heading: '3. Purposes',
        bullets: [
          'Create and maintain your account and session.',
          'Personalize devotionals, coach, language, and recommendations by life stage.',
          'Calculate scores, streaks, and badges for the three pillars.',
          'Provide Health features, photo estimates, and sensor or wearable sync only when you use them.',
          'Show nearby map or climate context if you enable location.',
          'Manage Phalanx invitations and links.',
          'Process Premium subscriptions and prevent payment fraud.',
          'Improve security, prevent abuse, and operate the service (hosting, auth, AI, billing).',
          'Comply with legal obligations when applicable.',
        ],
      },
      {
        heading: '4. Legal bases',
        paragraphs: [
          'We process data to perform the contract of App use (these Terms and the service you request), with your consent (for example sensors, camera, location, social login, wearables, and system permissions), and where applicable for legitimate interests in security and product improvement, or legal obligation. Health and photo data are collected only when you use those features.',
        ],
      },
      {
        heading: '5. Processors and providers',
        intro: 'We use providers that process data on our behalf, including:',
        bullets: [
          'Supabase — authentication, database, and storage (with Row Level Security: generally only you access your rows).',
          'Vercel — App hosting.',
          'Stripe — Premium checkout, invoices, and the customer portal, on behalf of Salvazion, Inc.',
          'xAI (Grok) — AI coach, AI devotionals, voice-related generation, and meal or body-photo estimates; necessary prompt and image content is sent to produce the result.',
          'Google / X — only if you choose to continue with Gmail or X; their use is also governed by their policies.',
          'Cloud wearable vendors (Fitbit, Oura, WHOOP, Garmin) — only if you connect them; HealthKit and Health Connect stay on-device except what you choose to sync.',
          'Jupiter / Solana network — if you use swap or wallet; blockchain transactions are public.',
          'Amazon — if you follow a book link; that purchase is between you and Amazon (we may receive an Associates commission).',
          'We do not sell your personal information to third parties for third-party advertising, and we do not use your health photos or coach chats to train public advertising models.',
        ],
      },
      {
        heading: '6. Health, photos, and other sensitive data',
        paragraphs: [
          'Health logs, wearable metrics, women’s-health entries, clinical notes, and meal or body photos can be sensitive. They are collected only when you use those features. We do not use them to diagnose disease. Photo analysis is an educational estimate and can be wrong. You may stop sensors, revoke wearable connections, or delete local data via the App and the device. On native shells, HealthKit / Health Connect require your explicit system permission.',
        ],
      },
      {
        heading: '7. Payments',
        paragraphs: [
          'Premium payments are processed by Stripe. Stripe’s privacy policy applies to the payment data it collects. We keep records of plan, status, and renewal needed to deliver Premium and for accounting or tax obligations.',
        ],
      },
      {
        heading: '8. Retention',
        paragraphs: [
          `We retain data while you keep an account or as needed for the service, security, accounting, and legal obligations. You may request account deletion by contacting ${SUPPORT_EMAIL}. We will delete or anonymize personal data we control within a reasonable time, except records we must keep (for example invoices). Some cache may live on your device (localStorage) until you clear it or uninstall the App. Blockchain records we do not control cannot be erased.`,
        ],
      },
      {
        heading: '9. Security',
        paragraphs: [
          `We apply reasonable measures (HTTPS, database RLS, secure session cookies, limited staff access). No system is 100% invulnerable; report relevant incidents to ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '10. Your rights',
        paragraphs: [
          `Depending on your jurisdiction (including access, rectification, erasure, objection, portability, restriction, and — where applicable — California or GDPR-style rights), you may exercise rights by writing to ${SUPPORT_EMAIL}. You may also revoke sensor, camera, location, or social permissions on the device or at the provider (Google, X, wearable vendor), and manage billing in the Stripe portal.`,
        ],
      },
      {
        heading: '11. Children',
        paragraphs: [
          'The App is not directed at children under 13, and we do not knowingly collect personal data from them. If a guardian believes a minor provided us data, contact us to review and delete it.',
        ],
      },
      {
        heading: '12. International transfers',
        paragraphs: [
          'Salvazion, Inc. is established in the United States. Providers such as Supabase, Vercel, Stripe, and xAI may process data on servers in the United States or other countries. We use recognized providers and standard industry contractual measures where applicable.',
        ],
      },
      {
        heading: '13. Cookies',
        paragraphs: [
          'We use cookies or similar storage essential for authentication, security, language, text size, and theme. We do not rely on third-party ad networks for the core App.',
        ],
      },
      {
        heading: '14. Changes',
        paragraphs: [
          'We may update this policy by publishing the new version on this URL with an updated date. Continued use constitutes acceptance of material changes to the extent permitted by law.',
        ],
      },
      {
        heading: '15. Contact',
        paragraphs: [
          `Privacy and personal data: ${SUPPORT_EMAIL}. Salvazion, Inc., 131 Continental Dr, Suite 305, Newark, DE 19713, USA. Terms: see Terms of Service at /terms.`,
        ],
      },
    ],
  },
  es: {
    title: 'Política de Privacidad',
    updated: UPDATED_ES,
    metaDescription:
      'Cómo Salvazion, Inc. recoge, usa y protege tus datos personales, de salud, de pago y de IA.',
    sections: [
      {
        heading: '',
        paragraphs: [
          `Salvazion, Inc. (“Salvazion”, “nosotros”) respeta tu privacidad. Esta política describe qué datos tratamos en la App (${APP_URL}), con qué fin, con quién los compartimos y qué derechos tienes. Al usar la App, aceptas esta política junto con los Términos de Servicio en /terms.`,
        ],
      },
      {
        heading: '1. Responsable',
        paragraphs: [
          `Responsable del tratamiento: Salvazion, Inc., sociedad de Delaware. Domicilio registrado: 131 Continental Dr, Suite 305, Newark, DE 19713, EE. UU. Contacto: ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '2. Datos que podemos recoger',
        intro: 'Según cómo uses la App, podemos tratar:',
        bullets: [
          'Cuenta: email, nombre, idioma (inglés, español o portugués de Brasil), foto de perfil, preferencias de onboarding (propósito, ciudad, país, fecha de nacimiento, madurez espiritual, familia, focos).',
          'Inicio de sesión social: si usas Google o X, identificadores y datos de perfil que el proveedor comparta (por ejemplo email, nombre, foto, @ de X), según su configuración y tu consentimiento.',
          'Uso de la App: scores Salvation / Health / Freedom, rachas, insignias, progreso de lectura bíblica, devocionales completados, entradas de calendario y motivos de oración, invitaciones Phalanx que envíes o aceptes.',
          'Health: sueño, hidratación, comidas, deportes, ayuno, registros de salud femenina, notas clínicas que ingreses, métricas de sensores del teléfono o frecuencia cardíaca Bluetooth, y métricas de wearables que actives (Fitbit, Oura, WHOOP, Garmin, HealthKit, Health Connect).',
          'Fotos que elijas subir para estimaciones de comida o composición corporal.',
          'Ubicación, solo si concedes el permiso (por ejemplo clima exterior o el mapa de iglesias).',
          'Conversaciones de IA: mensajes que envíes al coach León Verde, y un contexto limitado de perfil para personalizar devocionales o coaching.',
          'Pagos: si te suscribes a Premium, Stripe procesa los datos de tarjeta o billetera; nosotros recibimos estado de suscripción, id de cliente y metadatos limitados de facturación — no el número completo de la tarjeta.',
          'Web3 (opcional): dirección de billetera Solana si la conectas. No custodiamos claves privadas.',
          'Técnicos: cookies de sesión (Supabase Auth), datos de dispositivo y navegador necesarios para seguridad, PWA y el shell nativo.',
        ],
      },
      {
        heading: '3. Finalidades',
        bullets: [
          'Crear y mantener tu cuenta y sesión.',
          'Personalizar devocionales, coach, idioma y recomendaciones por etapa de vida.',
          'Calcular scores, rachas e insignias de los tres pilares.',
          'Ofrecer funciones de Health, estimaciones por foto y sincronización con sensores o wearables solo si las usas.',
          'Mostrar mapa o clima cercano si activas la ubicación.',
          'Gestionar invitaciones y vínculos Phalanx.',
          'Procesar suscripciones Premium y prevenir fraude de pago.',
          'Mejorar seguridad, prevenir abuso y operar el servicio (hosting, auth, IA, facturación).',
          'Cumplir obligaciones legales cuando corresponda.',
        ],
      },
      {
        heading: '4. Base legal',
        paragraphs: [
          'Tratamos datos para ejecutar el contrato de uso de la App (estos Términos y el servicio que solicitas), con tu consentimiento (por ejemplo sensores, cámara, ubicación, login social, wearables y permisos del sistema) y, cuando aplique, por interés legítimo en seguridad y mejora del producto, o por obligación legal. Los datos de salud y fotos se recogen solo cuando usas esas funciones.',
        ],
      },
      {
        heading: '5. Proveedores y encargados',
        intro: 'Usamos proveedores que tratan datos en nuestro nombre, entre otros:',
        bullets: [
          'Supabase — autenticación, base de datos y almacenamiento (con Row Level Security: en general solo tú accedes a tus filas).',
          'Vercel — alojamiento de la App.',
          'Stripe — checkout Premium, facturas y el portal de cliente, en nombre de Salvazion, Inc.',
          'xAI (Grok) — coach con IA, devocionales IA, generación relacionada con voz y estimaciones de fotos de comida o cuerpo; se envía el prompt e imagen necesarios para producir el resultado.',
          'Google / X — solo si eliges continuar con Gmail o X; su uso se rige también por sus políticas.',
          'Proveedores de wearables en la nube (Fitbit, Oura, WHOOP, Garmin) — solo si los conectas; HealthKit y Health Connect permanecen en el dispositivo salvo lo que elijas sincronizar.',
          'Jupiter / red Solana — si usas swap o billetera; las transacciones son públicas en blockchain.',
          'Amazon — si sigues un enlace de libro; esa compra es entre tú y Amazon (podemos recibir una comisión Associates).',
          'No vendemos tu información personal a terceros para publicidad de terceros, ni usamos tus fotos de salud ni los chats del coach para entrenar modelos publicitarios públicos.',
        ],
      },
      {
        heading: '6. Salud, fotos y otros datos sensibles',
        paragraphs: [
          'Los registros de Health, métricas de wearables, salud femenina, notas clínicas y fotos de comida o cuerpo pueden ser sensibles. Solo se recogen cuando usas esas funciones. No los usamos para diagnosticar enfermedades. El análisis de fotos es una estimación educativa y puede equivocarse. Puedes detener sensores, revocar wearables o borrar datos locales desde la App y el dispositivo. En shell nativo, HealthKit / Health Connect requieren tu permiso explícito del sistema.',
        ],
      },
      {
        heading: '7. Pagos',
        paragraphs: [
          'Los pagos Premium los procesa Stripe. La política de privacidad de Stripe aplica a los datos de pago que ella recaba. Conservamos registros de plan, estado y renovación necesarios para entregar Premium y para obligaciones contables o tributarias.',
        ],
      },
      {
        heading: '8. Conservación',
        paragraphs: [
          `Conservamos los datos mientras mantengas la cuenta o sea necesario para el servicio, la seguridad, la contabilidad y las obligaciones legales. Puedes solicitar la eliminación de la cuenta contactando a ${SUPPORT_EMAIL}. Eliminaremos o anonimizaremos los datos personales que controlamos en un plazo razonable, salvo registros que debamos conservar (por ejemplo facturas). Parte del caché puede vivir en tu dispositivo (localStorage) hasta que lo borres o desinstales la App. Los registros de blockchain que no controlamos no se pueden borrar.`,
        ],
      },
      {
        heading: '9. Seguridad',
        paragraphs: [
          `Aplicamos medidas razonables (HTTPS, RLS en base de datos, cookies de sesión seguras, acceso limitado del equipo). Ningún sistema es 100 % invulnerable; notifícanos incidentes relevantes a ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '10. Tus derechos',
        paragraphs: [
          `Según tu jurisdicción (incluido acceso, rectificación, supresión, oposición, portabilidad, limitación y —cuando aplique— derechos tipo California o RGPD), puedes ejercerlos escribiendo a ${SUPPORT_EMAIL}. También puedes revocar permisos de sensores, cámara, ubicación o redes sociales en el dispositivo o en el proveedor (Google, X, wearable), y gestionar la facturación en el portal de Stripe.`,
        ],
      },
      {
        heading: '11. Menores',
        paragraphs: [
          'La App no está dirigida a menores de 13 años y no recabamos a sabiendas sus datos personales. Si un tutor cree que un menor nos ha facilitado datos, contáctanos para revisarlo y eliminarlos.',
        ],
      },
      {
        heading: '12. Transferencias internacionales',
        paragraphs: [
          'Salvazion, Inc. está establecida en Estados Unidos. Proveedores como Supabase, Vercel, Stripe y xAI pueden procesar datos en servidores de Estados Unidos u otros países. Usamos proveedores reconocidos y medidas contractuales habituales de la industria cuando aplica.',
        ],
      },
      {
        heading: '13. Cookies',
        paragraphs: [
          'Usamos cookies o almacenamiento similar esenciales para autenticación, seguridad, idioma, tamaño de texto y tema. No dependemos de redes publicitarias de terceros para el núcleo de la App.',
        ],
      },
      {
        heading: '14. Cambios',
        paragraphs: [
          'Podemos actualizar esta política publicando la nueva versión en esta URL con fecha de actualización. El uso continuado implica aceptación de los cambios materiales en la medida permitida por la ley.',
        ],
      },
      {
        heading: '15. Contacto',
        paragraphs: [
          `Privacidad y datos personales: ${SUPPORT_EMAIL}. Salvazion, Inc., 131 Continental Dr, Suite 305, Newark, DE 19713, EE. UU. Términos: ver Términos de Servicio en /terms.`,
        ],
      },
    ],
  },
  pt: {
    title: 'Política de Privacidade',
    updated: UPDATED_PT,
    metaDescription:
      'Como a Salvazion, Inc. coleta, usa e protege seus dados pessoais, de saúde, de pagamento e de IA.',
    sections: [
      {
        heading: '',
        paragraphs: [
          `A Salvazion, Inc. (“Salvazion”, “nós”) respeita a sua privacidade. Esta política descreve quais dados tratamos no App (${APP_URL}), para quais fins, com quem os compartilhamos e quais direitos você tem. Ao usar o App, você aceita esta política juntamente com os Termos de Serviço em /terms.`,
        ],
      },
      {
        heading: '1. Controlador',
        paragraphs: [
          `Controlador dos dados: Salvazion, Inc., sociedade de Delaware. Sede registrada: 131 Continental Dr, Suite 305, Newark, DE 19713, EUA. Contato: ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '2. Dados que podemos coletar',
        intro: 'Conforme o uso do App, podemos tratar:',
        bullets: [
          'Conta: email, nome, idioma (inglês, espanhol ou português do Brasil), foto de perfil, preferências de onboarding (propósito, cidade, país, data de nascimento, maturidade espiritual, família, focos).',
          'Login social: se você usa Google ou X, identificadores e dados de perfil que o provedor compartilhe (por exemplo email, nome, foto, @ do X), segundo a configuração dele e o seu consentimento.',
          'Uso do App: scores Salvation / Health / Freedom, sequências, insígnias, progresso de leitura bíblica, devocionais concluídos, entradas de calendário e motivos de oração, convites Phalanx que você envie ou aceite.',
          'Health: sono, hidratação, refeições, esportes, jejum, registros de saúde feminina, notas clínicas que você inserir, métricas de sensores do telefone ou frequência cardíaca Bluetooth, e métricas de wearables que você ative (Fitbit, Oura, WHOOP, Garmin, HealthKit, Health Connect).',
          'Fotos que você escolher enviar para estimativas de refeição ou composição corporal.',
          'Localização, só se você conceder permissão (por exemplo clima externo ou o mapa de igrejas).',
          'Conversas de IA: mensagens que você enviar ao coach Leão Verde, e um contexto limitado de perfil para personalizar devocionais ou coaching.',
          'Pagamentos: se você assinar o Premium, a Stripe processa os dados de cartão ou carteira; recebemos status da assinatura, id de cliente e metadados limitados de cobrança — não o número completo do cartão.',
          'Web3 (opcional): endereço de carteira Solana se você conectar uma. Não custodiamos chaves privadas.',
          'Técnicos: cookies de sessão (Supabase Auth), dados de dispositivo e navegador necessários para segurança, PWA e o shell nativo.',
        ],
      },
      {
        heading: '3. Finalidades',
        bullets: [
          'Criar e manter sua conta e sessão.',
          'Personalizar devocionais, coach, idioma e recomendações por etapa de vida.',
          'Calcular scores, sequências e insígnias dos três pilares.',
          'Oferecer funções de Health, estimativas por foto e sincronização com sensores ou wearables só se você as usar.',
          'Mostrar mapa ou clima próximo se você ativar a localização.',
          'Gerenciar convites e vínculos Phalanx.',
          'Processar assinaturas Premium e prevenir fraude de pagamento.',
          'Melhorar a segurança, prevenir abuso e operar o serviço (hosting, auth, IA, cobrança).',
          'Cumprir obrigações legais quando corresponder.',
        ],
      },
      {
        heading: '4. Bases legais',
        paragraphs: [
          'Tratamos dados para executar o contrato de uso do App (estes Termos e o serviço que você solicita), com o seu consentimento (por exemplo sensores, câmera, localização, login social, wearables e permissões do sistema) e, quando aplicável, por interesse legítimo em segurança e melhoria do produto, ou por obrigação legal. Dados de saúde e fotos são coletados só quando você usa essas funções.',
        ],
      },
      {
        heading: '5. Processadores e provedores',
        intro: 'Usamos provedores que tratam dados em nosso nome, entre outros:',
        bullets: [
          'Supabase — autenticação, banco de dados e armazenamento (com Row Level Security: em geral só você acessa suas linhas).',
          'Vercel — hospedagem do App.',
          'Stripe — checkout Premium, faturas e o portal do cliente, em nome da Salvazion, Inc.',
          'xAI (Grok) — coach com IA, devocionais IA, geração relacionada à voz e estimativas de fotos de refeição ou corpo; envia-se o prompt e a imagem necessários para produzir o resultado.',
          'Google / X — só se você escolher continuar com Gmail ou X; o uso também se rege pelas políticas deles.',
          'Fornecedores de wearables na nuvem (Fitbit, Oura, WHOOP, Garmin) — só se você os conectar; HealthKit e Health Connect permanecem no dispositivo, salvo o que você escolher sincronizar.',
          'Jupiter / rede Solana — se você usar swap ou carteira; as transações são públicas na blockchain.',
          'Amazon — se você seguir um link de livro; essa compra é entre você e a Amazon (podemos receber uma comissão Associates).',
          'Não vendemos suas informações pessoais a terceiros para publicidade de terceiros, nem usamos suas fotos de saúde nem os chats do coach para treinar modelos publicitários públicos.',
        ],
      },
      {
        heading: '6. Saúde, fotos e outros dados sensíveis',
        paragraphs: [
          'Registros de Health, métricas de wearables, saúde feminina, notas clínicas e fotos de refeição ou corpo podem ser sensíveis. Só são coletados quando você usa essas funções. Não os usamos para diagnosticar doenças. A análise de fotos é uma estimativa educativa e pode errar. Você pode parar sensores, revogar wearables ou apagar dados locais pelo App e pelo dispositivo. No shell nativo, HealthKit / Health Connect exigem sua permissão explícita do sistema.',
        ],
      },
      {
        heading: '7. Pagamentos',
        paragraphs: [
          'Os pagamentos Premium são processados pela Stripe. A política de privacidade da Stripe aplica-se aos dados de pagamento que ela coleta. Conservamos registros de plano, status e renovação necessários para entregar o Premium e para obrigações contábeis ou tributárias.',
        ],
      },
      {
        heading: '8. Conservação',
        paragraphs: [
          `Conservamos os dados enquanto você mantiver a conta ou for necessário para o serviço, a segurança, a contabilidade e as obrigações legais. Você pode pedir a exclusão da conta escrevendo para ${SUPPORT_EMAIL}. Excluiremos ou anonimizaremos os dados pessoais que controlamos em um prazo razoável, salvo registros que devemos conservar (por exemplo faturas). Parte do cache pode viver no seu dispositivo (localStorage) até você apagá-lo ou desinstalar o App. Registros de blockchain que não controlamos não podem ser apagados.`,
        ],
      },
      {
        heading: '9. Segurança',
        paragraphs: [
          `Aplicamos medidas razoáveis (HTTPS, RLS no banco de dados, cookies de sessão seguros, acesso limitado da equipe). Nenhum sistema é 100% invulnerável; comunique incidentes relevantes a ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '10. Seus direitos',
        paragraphs: [
          `Segundo a sua jurisdição (incluindo acesso, retificação, exclusão, oposição, portabilidade, limitação e — quando aplicável — direitos no estilo da Califórnia ou do RGPD), você pode exercê-los escrevendo para ${SUPPORT_EMAIL}. Também pode revogar permissões de sensores, câmera, localização ou redes sociais no dispositivo ou no provedor (Google, X, wearable), e gerenciar a cobrança no portal da Stripe.`,
        ],
      },
      {
        heading: '11. Menores',
        paragraphs: [
          'O App não é dirigido a menores de 13 anos e não coletamos de propósito os dados pessoais deles. Se um responsável acreditar que um menor nos forneceu dados, entre em contato para revisarmos e excluí-los.',
        ],
      },
      {
        heading: '12. Transferências internacionais',
        paragraphs: [
          'A Salvazion, Inc. está estabelecida nos Estados Unidos. Provedores como Supabase, Vercel, Stripe e xAI podem processar dados em servidores nos Estados Unidos ou em outros países. Usamos provedores reconhecidos e medidas contratuais habituais do setor quando aplicável.',
        ],
      },
      {
        heading: '13. Cookies',
        paragraphs: [
          'Usamos cookies ou armazenamento semelhante essenciais para autenticação, segurança, idioma, tamanho do texto e tema. Não dependemos de redes publicitárias de terceiros para o núcleo do App.',
        ],
      },
      {
        heading: '14. Mudanças',
        paragraphs: [
          'Podemos atualizar esta política publicando a nova versão nesta URL com data atualizada. O uso continuado implica aceitação das mudanças materiais na medida permitida pela lei.',
        ],
      },
      {
        heading: '15. Contato',
        paragraphs: [
          `Privacidade e dados pessoais: ${SUPPORT_EMAIL}. Salvazion, Inc., 131 Continental Dr, Suite 305, Newark, DE 19713, EUA. Termos: veja os Termos de Serviço em /terms.`,
        ],
      },
    ],
  },
};
