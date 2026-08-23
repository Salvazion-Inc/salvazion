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

const UPDATED_EN = 'August 23, 2026';
const UPDATED_ES = '23 de agosto de 2026';
const UPDATED_PT = '23 de agosto de 2026';

const ENTITY =
  'Salvazion, Inc., a Delaware corporation, with registered office at 131 Continental Dr, Suite 305, Newark, DE 19713, USA';

export const TERMS: Record<Language, LegalDoc> = {
  en: {
    title: 'Terms of Service',
    updated: UPDATED_EN,
    metaDescription:
      'Terms of use for Salvazion (Salvation, Health, and Freedom), operated by Salvazion, Inc.',
    sections: [
      {
        heading: '',
        paragraphs: [
          `These Terms of Service (“Terms”) are a contract between you and ${ENTITY} (“Salvazion”, “the Platform”, “we”). The Platform is available at ${APP_URL} as a website, progressive web application (PWA), and native iOS / Android shells. By creating an account, signing in, or using the Platform, you agree to these Terms and to our Privacy Policy at /privacy. If you do not agree, do not use the Platform.`,
        ],
      },
      {
        heading: '1. Service description',
        paragraphs: [
          'Salvazion is a freemium digital platform organized around three pillars — Salvation, Health, and Freedom — to help you grow in faith, steward the body, and practice responsible liberty. The Platform is formative, motivational, and community-oriented. It does not replace professional medical, psychological, legal, financial, tax, or pastoral advice.',
          'Depending on your plan and device, the Platform may include:',
        ],
        bullets: [
          'Salvation: offline Bible (English King James, Spanish Reina Valera 1909, Portuguese Almeida historic text labeled ARC, plus Hebrew and Greek originals), daily devotionals, prayer motives, discipline calendar, and spiritual scores.',
          'Health: manual logs (sleep, hydration, meals, sports), phone sensors, Bluetooth heart rate, optional meal or body photos, women’s health and clinical-record tools, and optional wearable sync.',
          'Freedom: curated books, long-form articles on X, YouTube channels, a churches map, Phalanx community invitations, and optional Solana wallet tools including $SALVAZION swaps.',
          'Salvazion AI coach, voice playback, and AI-assisted devotionals on Premium.',
          'Scores, streaks, badges, profile, and language (English, Spanish, Brazilian Portuguese).',
        ],
      },
      {
        heading: '2. Eligibility and account',
        bullets: [
          'You must have legal capacity to accept these Terms (generally the age of majority in your jurisdiction). The Platform is not directed to children under 13. If you are between 13 and the age of majority, you may use the Platform only with a parent or guardian who accepts these Terms.',
          'You may register with email and password, a magic link, Google, or X, depending on enabled providers.',
          'You are responsible for the confidentiality of your account and for activity under it. Notify us at ' +
            SUPPORT_EMAIL +
            ' if you suspect unauthorized use.',
          'You must provide truthful information to the extent the Platform requests it to personalize your experience.',
          'We may refuse, suspend, or close an account that is incomplete, abusive, or created to evade these Terms.',
        ],
      },
      {
        heading: '3. Acceptable use',
        intro: 'You agree not to:',
        bullets: [
          'Use the Platform unlawfully, fraudulently, or in ways that violate third-party rights.',
          'Attempt to breach security, gain unauthorized access, scrape abusively, reverse engineer, or interfere with the service.',
          'Post or transmit offensive or defamatory content, or content that promotes violence or illegality, in community spaces.',
          'Impersonate others or abuse Phalanx invitations.',
          'Upload photos or health data of another person without their permission.',
          'Use AI features to generate unlawful, harassing, or deceptive content.',
        ],
      },
      {
        heading: '4. Spiritual, AI, and coaching content',
        paragraphs: [
          'Bible texts, devotionals (rules-based or generated with AI assistance), coaching messages, and voice playback are offered as personal and spiritual growth resources. They are not medical, psychological, legal, or pastoral counsel and may contain errors. You remain free to discern and apply what you find useful under your own responsibility.',
          'Premium AI features are powered by xAI (Grok). Prompts, limited profile context, and images you submit for analysis may be sent to that provider solely to generate the response. Do not submit secrets, other people’s personal data, or content you are not allowed to share.',
        ],
      },
      {
        heading: '5. Health, sensors, photos, and wearables',
        paragraphs: [
          'Health features — including sleep, hydration, meals, exercise, phone sensors, GPS when you enable it (for example outdoor climate or a churches map), Bluetooth heart rate, meal or body-composition photos, women’s health modules, clinical notes, and HealthKit / Health Connect / cloud wearables (Fitbit, Oura, WHOOP, Garmin) — are estimates and tracking tools. They are not medical devices, diagnoses, treatments, or clinical advice.',
          'Consult a qualified health professional before changing habits, exercise, fasting, or diet. Use of sensors, camera, location, and device permissions is voluntary. Photo analysis produces educational estimates only and can be wrong.',
        ],
      },
      {
        heading: '6. Freedom library and third-party content',
        paragraphs: [
          'Books, X articles, YouTube channels, maps, and similar Freedom materials are curated pointers to third-party works. Opening them takes you to Amazon, X, YouTube, maps, or other sites governed by their own terms. Some book links may be Amazon Associates links; we may earn a commission if you buy, at no extra cost to you. We do not control and are not responsible for third-party content, availability, or policies.',
        ],
      },
      {
        heading: '7. Plans, Premium, and payments',
        paragraphs: [
          'The Platform is freemium. A Free plan lets you start. Salvazion Premium unlocks advanced tools (including the AI coach and voice, AI devotionals, cloud wearables, advanced health and calendar, full Freedom convenience, and unlimited Phalanx invites) as described in the Platform at the time of purchase.',
          'Current published prices are USD $49 per month or USD $468 per year (equivalent to $39 per month billed annually). Prices, features, and taxes may change; the amount charged is the price shown at checkout.',
          'Payments are processed by Stripe on behalf of Salvazion, Inc. We do not store full card numbers. You authorize recurring charges until you cancel. You may cancel or change plans anytime in the Stripe customer portal from the Platform. Cancellation stops future renewals; fees already paid are generally not refunded except where required by law. If a payment fails, we may downgrade the account to Free.',
        ],
      },
      {
        heading: '8. Web3, Solana, and $SALVAZION',
        paragraphs: [
          'If you connect a wallet (for example Jupiter Mobile, Phantom, or Solflare) or use swaps, you act under your own responsibility. Salvazion does not custody funds or private keys, is not an exchange or broker, and is not a financial, investment, or tax advisor. Blockchain transactions are public, irreversible, and involve risk of total loss. $SALVAZION is a utility token on Solana, not equity in Salvazion, Inc. and not a promise of profit. Comply with the laws of your jurisdiction regarding crypto assets.',
        ],
      },
      {
        heading: '9. Intellectual property',
        paragraphs: [
          'The Salvazion name and logo, the Green Lion Kings community identity, Platform design, software, scores, and original editorial content belong to Salvazion, Inc. or are used under license. You receive a limited, revocable, non-transferable license to use the Platform for personal, non-commercial purposes.',
          'Bible translations are used according to their rights: King James Version (public domain); Reina Valera 1909 (public domain — not Reina-Valera 1960, which we do not redistribute); Almeida historic text (public-domain Almeida lineage, presented in the Platform as ARC); Westminster Leningrad Codex (Hebrew) and Textus Receptus (Greek). You may not copy, resell, or exploit the Platform or its datasets beyond what those licenses and applicable law allow.',
        ],
      },
      {
        heading: '10. Availability and changes',
        paragraphs: [
          'We may modify, suspend, or discontinue Platform features, prices, or these Terms, effective when published on this page. Material changes will show a new “Last updated” date. Continued use after material changes constitutes acceptance. We do not guarantee uninterrupted availability, error-free operation, or that AI, sensors, or third-party services will remain available.',
        ],
      },
      {
        heading: '11. Limitation of liability',
        paragraphs: [
          'The Platform is provided “as is” and “as available”. To the fullest extent permitted by law, Salvazion, Inc. and its directors, officers, and collaborators are not liable for indirect, incidental, special, consequential, or punitive damages, lost profits, data loss, or damages arising from use or inability to use the Platform, including AI, health, location, photo, billing, or Web3 features. Our aggregate liability for claims relating to the Platform will not exceed the greater of (a) the amounts you paid us for Premium in the three months before the claim or (b) USD $50, except where liability cannot be limited.',
        ],
      },
      {
        heading: '12. Termination',
        paragraphs: [
          'You may stop using the Platform at any time and request account deletion as described in the Privacy Policy. We may suspend or close accounts that breach these Terms or put the service or other users at risk. Sections that by nature should survive (including intellectual property, Web3 risk, limitation of liability, and governing law) remain in force after termination.',
        ],
      },
      {
        heading: '13. Governing law',
        paragraphs: [
          `These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law rules, except that mandatory consumer protections of your country of residence still apply where they cannot be waived. If any clause is unenforceable, the remainder remains in force. For disputes, first contact ${SUPPORT_EMAIL} and we will seek an amicable solution.`,
        ],
      },
      {
        heading: '14. Contact',
        paragraphs: [
          `Questions about these Terms: ${SUPPORT_EMAIL}. Salvazion, Inc., 131 Continental Dr, Suite 305, Newark, DE 19713, USA. Privacy: see our Privacy Policy at /privacy.`,
        ],
      },
    ],
  },
  es: {
    title: 'Términos de Servicio',
    updated: UPDATED_ES,
    metaDescription:
      'Términos de uso de Salvazion (Salvation, Health y Freedom), operada por Salvazion, Inc.',
    sections: [
      {
        heading: '',
        paragraphs: [
          `Estos Términos de Servicio (“Términos”) son un contrato entre tú y Salvazion, Inc., una sociedad de Delaware, con domicilio registrado en 131 Continental Dr, Suite 305, Newark, DE 19713, EE. UU. (“Salvazion”, “la Plataforma”, “nosotros”). La Plataforma está disponible en ${APP_URL} como sitio web, aplicación web progresiva y shells nativos iOS / Android. Al crear una cuenta, iniciar sesión o usar la Plataforma, aceptas estos Términos y la Política de Privacidad en /privacy. Si no estás de acuerdo, no uses la Plataforma.`,
        ],
      },
      {
        heading: '1. Descripción del servicio',
        paragraphs: [
          'Salvazion es una plataforma digital freemium organizada en tres pilares — Salvation, Health y Freedom — para crecer en la fe, cuidar el cuerpo y practicar una libertad responsable. La Plataforma es formativa, motivacional y comunitaria. No sustituye consejo médico, psicológico, legal, financiero, tributario ni pastoral profesional.',
          'Según tu plan y dispositivo, la Plataforma puede incluir:',
        ],
        bullets: [
          'Salvation: Biblia offline (King James en inglés, Reina Valera 1909 en español, texto histórico Almeida rotulado ARC en portugués, más originales en hebreo y griego), devocional diario, motivos de oración, calendario de disciplina y scores espirituales.',
          'Health: registros manuales (sueño, hidratación, comidas, deportes), sensores del teléfono, frecuencia cardíaca Bluetooth, fotos opcionales de comida o composición corporal, salud femenina y ficha clínica, y sincronización opcional con wearables.',
          'Freedom: libros curados, artículos long-form en X, canales de YouTube, mapa de iglesias, invitaciones a la comunidad Phalanx y herramientas opcionales de billetera Solana, incluido el swap de $SALVAZION.',
          'Salvazion AI (coach), voz y devocionales asistidos por IA en Premium.',
          'Scores, rachas, insignias, perfil e idiomas (inglés, español y portugués de Brasil).',
        ],
      },
      {
        heading: '2. Elegibilidad y cuenta',
        bullets: [
          'Debes tener capacidad legal para aceptar estos Términos (en general, mayoría de edad en tu jurisdicción). La Plataforma no está dirigida a menores de 13 años. Si tienes entre 13 años y la mayoría de edad, solo puedes usarla con un padre o tutor que acepte estos Términos.',
          'Puedes registrarte con email y contraseña, enlace mágico, Google o X, según los proveedores habilitados.',
          'Eres responsable de la confidencialidad de tu cuenta y de la actividad realizada con ella. Avísanos en ' +
            SUPPORT_EMAIL +
            ' si sospechas un uso no autorizado.',
          'Debes proporcionar información veraz en la medida en que la Plataforma la solicite para personalizar la experiencia.',
          'Podemos rechazar, suspender o cerrar una cuenta incompleta, abusiva o creada para evadir estos Términos.',
        ],
      },
      {
        heading: '3. Uso aceptable',
        intro: 'Te comprometes a no:',
        bullets: [
          'Usar la Plataforma de forma ilegal, fraudulenta o que viole derechos de terceros.',
          'Intentar vulnerar la seguridad, obtener acceso no autorizado, hacer scraping abusivo, ingeniería inversa o interferir con el servicio.',
          'Publicar o transmitir contenido ofensivo, difamatorio, o que promueva violencia o ilegalidad en espacios de comunidad.',
          'Suplantar identidad o abusar de invitaciones Phalanx.',
          'Subir fotos o datos de salud de otra persona sin su permiso.',
          'Usar las funciones de IA para generar contenido ilegal, acosador o engañoso.',
        ],
      },
      {
        heading: '4. Contenido espiritual, IA y coaching',
        paragraphs: [
          'Los textos bíblicos, devocionales (por reglas o con asistencia de IA), mensajes de coaching y la voz se ofrecen como recursos de crecimiento personal y espiritual. No constituyen consejo médico, psicológico, legal ni pastoral y pueden contener errores. Eres libre de discernir y aplicar lo que consideres útil bajo tu propia responsabilidad.',
          'Las funciones de IA Premium las provee xAI (Grok). Los prompts, un contexto limitado de perfil y las imágenes que envíes para análisis pueden transmitirse a ese proveedor solo para generar la respuesta. No envíes secretos, datos personales de terceros ni contenido que no puedas compartir.',
        ],
      },
      {
        heading: '5. Salud, sensores, fotos y wearables',
        paragraphs: [
          'Las funciones de Health — sueño, hidratación, comidas, ejercicio, sensores del teléfono, GPS si lo activas (por ejemplo clima exterior o mapa de iglesias), frecuencia cardíaca Bluetooth, fotos de comida o composición corporal, salud femenina, notas clínicas y HealthKit / Health Connect / wearables en la nube (Fitbit, Oura, WHOOP, Garmin) — son estimaciones y herramientas de seguimiento. No son dispositivos médicos, diagnósticos, tratamientos ni consejo clínico.',
          'Consulta a un profesional de la salud antes de cambiar hábitos, ejercicio, ayuno o alimentación. El uso de sensores, cámara, ubicación y permisos del dispositivo es voluntario. El análisis de fotos produce solo estimaciones educativas y puede equivocarse.',
        ],
      },
      {
        heading: '6. Biblioteca Freedom y contenido de terceros',
        paragraphs: [
          'Libros, artículos en X, canales de YouTube, mapas y materiales similares de Freedom son punteros curados a obras de terceros. Al abrirlos sales hacia Amazon, X, YouTube, mapas u otros sitios regidos por sus propios términos. Algunos enlaces de libros pueden ser de Amazon Associates; podemos recibir una comisión si compras, sin costo extra para ti. No controlamos ni respondemos por el contenido, la disponibilidad ni las políticas de terceros.',
        ],
      },
      {
        heading: '7. Planes, Premium y pagos',
        paragraphs: [
          'La Plataforma es freemium. El plan Gratis te permite empezar. Salvazion Premium desbloquea herramientas avanzadas (incluido el coach con IA y voz, devocionales IA, wearables en la nube, salud y calendario avanzados, conveniencia completa de Freedom e invitaciones Phalanx ilimitadas), según se describa en la Plataforma al comprar.',
          'Los precios publicados actuales son USD $49 al mes o USD $468 al año (equivalente a $39 al mes facturado anualmente). Precios, funciones e impuestos pueden cambiar; el cargo es el precio mostrado en el checkout.',
          'Los pagos los procesa Stripe en nombre de Salvazion, Inc. No almacenamos el número completo de la tarjeta. Autorizas cargos recurrentes hasta que canceles. Puedes cancelar o cambiar de plan cuando quieras en el portal de cliente de Stripe desde la Plataforma. La cancelación detiene las renovaciones futuras; los importes ya pagados no se reembolsan salvo cuando la ley lo exija. Si un pago falla, podemos bajar la cuenta a Gratis.',
        ],
      },
      {
        heading: '8. Web3, Solana y $SALVAZION',
        paragraphs: [
          'Si conectas una billetera (por ejemplo Jupiter Mobile, Phantom o Solflare) o usas swaps, actúas bajo tu propia responsabilidad. Salvazion no custodia fondos ni claves privadas, no es un exchange ni un bróker, y no es un asesor financiero, de inversión ni tributario. Las transacciones en blockchain son públicas, irreversibles y conllevan riesgo de pérdida total. $SALVAZION es un token de utilidad en Solana, no es capital de Salvazion, Inc. ni una promesa de ganancia. Cumple la normativa de tu jurisdicción respecto a criptoactivos.',
        ],
      },
      {
        heading: '9. Propiedad intelectual',
        paragraphs: [
          'El nombre y el logo Salvazion, la identidad de la comunidad Green Lion Kings, el diseño de la Plataforma, software, scores y el contenido editorial propio pertenecen a Salvazion, Inc. o se usan bajo licencia. Recibes una licencia limitada, revocable y no transferible para usar la Plataforma con fines personales y no comerciales.',
          'Las traducciones bíblicas se usan conforme a sus derechos: King James Version (dominio público); Reina Valera 1909 (dominio público — no Reina-Valera 1960, que no redistribuimos); texto histórico Almeida (linaje de dominio público, presentado en la Plataforma como ARC); Westminster Leningrad Codex (hebreo) y Textus Receptus (griego). No puedes copiar, revender ni explotar la Plataforma o sus conjuntos de datos más allá de lo que esas licencias y la ley permitan.',
        ],
      },
      {
        heading: '10. Disponibilidad y cambios',
        paragraphs: [
          'Podemos modificar, suspender o discontinuar funciones, precios o estos Términos, con efecto al publicarlos en esta página. Los cambios materiales mostrarán una nueva fecha de “Última actualización”. El uso continuado tras cambios relevantes implica aceptación. No garantizamos disponibilidad ininterrumpida, ausencia de errores, ni que la IA, los sensores o los servicios de terceros sigan disponibles.',
        ],
      },
      {
        heading: '11. Limitación de responsabilidad',
        paragraphs: [
          'La Plataforma se ofrece “tal cual” y “según disponibilidad”. En la medida permitida por la ley, Salvazion, Inc. y sus directores, oficiales y colaboradores no serán responsables por daños indirectos, incidentales, especiales, consecuenciales o punitivos, lucros cesantes, pérdida de datos o daños derivados del uso o la imposibilidad de uso de la Plataforma, incluidas las funciones de IA, salud, ubicación, fotos, facturación o Web3. Nuestra responsabilidad agregada por reclamaciones relativas a la Plataforma no excederá el mayor entre (a) lo que nos pagaste por Premium en los tres meses anteriores a la reclamación o (b) USD $50, salvo donde la responsabilidad no pueda limitarse.',
        ],
      },
      {
        heading: '12. Terminación',
        paragraphs: [
          'Puedes dejar de usar la Plataforma en cualquier momento y solicitar la eliminación de la cuenta según la Política de Privacidad. Podemos suspender o cerrar cuentas que incumplan estos Términos o pongan en riesgo el servicio u otros usuarios. Las cláusulas que por su naturaleza deban sobrevivir (incluida la propiedad intelectual, el riesgo Web3, la limitación de responsabilidad y la ley aplicable) siguen vigentes tras la terminación.',
        ],
      },
      {
        heading: '13. Ley aplicable',
        paragraphs: [
          `Estos Términos se rigen por las leyes del Estado de Delaware, EE. UU., sin aplicar normas de conflicto de leyes, salvo las protecciones imperativas de consumo de tu país de residencia cuando no puedan renunciarse. Si alguna cláusula no fuera exigible, el resto permanecerá en vigor. Para disputas, contacta primero a ${SUPPORT_EMAIL} y buscaremos una solución amistosa.`,
        ],
      },
      {
        heading: '14. Contacto',
        paragraphs: [
          `Preguntas sobre estos Términos: ${SUPPORT_EMAIL}. Salvazion, Inc., 131 Continental Dr, Suite 305, Newark, DE 19713, EE. UU. Privacidad: ver Política de Privacidad en /privacy.`,
        ],
      },
    ],
  },
  pt: {
    title: 'Termos de Serviço',
    updated: UPDATED_PT,
    metaDescription:
      'Termos de uso da Salvazion (Salvation, Health e Freedom), operada pela Salvazion, Inc.',
    sections: [
      {
        heading: '',
        paragraphs: [
          `Estes Termos de Serviço (“Termos”) são um contrato entre você e a Salvazion, Inc., uma sociedade de Delaware, com sede registrada em 131 Continental Dr, Suite 305, Newark, DE 19713, EUA (“Salvazion”, “a Plataforma”, “nós”). A Plataforma está disponível em ${APP_URL} como site, aplicativo web progressivo e shells nativos iOS / Android. Ao criar uma conta, entrar ou usar a Plataforma, você aceita estes Termos e a Política de Privacidade em /privacy. Se não concordar, não use a Plataforma.`,
        ],
      },
      {
        heading: '1. Descrição do serviço',
        paragraphs: [
          'A Salvazion é uma plataforma digital freemium organizada em três pilares — Salvation, Health e Freedom — para crescer na fé, cuidar do corpo e praticar uma liberdade responsável. A Plataforma é formativa, motivacional e comunitária. Não substitui aconselhamento médico, psicológico, jurídico, financeiro, tributário nem pastoral profissional.',
          'Conforme o seu plano e dispositivo, a Plataforma pode incluir:',
        ],
        bullets: [
          'Salvation: Bíblia offline (King James em inglês, Reina Valera 1909 em espanhol, texto histórico Almeida rotulado ARC em português, mais originais em hebraico e grego), devocional diário, motivos de oração, calendário de disciplina e scores espirituais.',
          'Health: registros manuais (sono, hidratação, refeições, esportes), sensores do telefone, frequência cardíaca Bluetooth, fotos opcionais de refeição ou composição corporal, saúde feminina e ficha clínica, e sincronização opcional com wearables.',
          'Freedom: livros curados, artigos long-form no X, canais do YouTube, mapa de igrejas, convites da comunidade Phalanx e ferramentas opcionais de carteira Solana, inclusive swap de $SALVAZION.',
          'Salvazion AI (coach), voz e devocionais assistidos por IA no Premium.',
          'Scores, sequências, insígnias, perfil e idiomas (inglês, espanhol e português do Brasil).',
        ],
      },
      {
        heading: '2. Elegibilidade e conta',
        bullets: [
          'Você deve ter capacidade legal para aceitar estes Termos (em geral, maioridade na sua jurisdição). A Plataforma não é dirigida a menores de 13 anos. Se você tem entre 13 anos e a maioridade, só pode usá-la com um pai ou responsável que aceite estes Termos.',
          'Você pode se registrar com email e senha, link mágico, Google ou X, conforme os provedores habilitados.',
          'Você é responsável pela confidencialidade da sua conta e pela atividade feita com ela. Avise-nos em ' +
            SUPPORT_EMAIL +
            ' se suspeitar de uso não autorizado.',
          'Deve fornecer informações verdadeiras na medida em que a Plataforma as peça para personalizar a experiência.',
          'Podemos recusar, suspender ou encerrar uma conta incompleta, abusiva ou criada para contornar estes Termos.',
        ],
      },
      {
        heading: '3. Uso aceitável',
        intro: 'Você se compromete a não:',
        bullets: [
          'Usar a Plataforma de forma ilegal, fraudulenta ou que viole direitos de terceiros.',
          'Tentar violar a segurança, obter acesso não autorizado, fazer scraping abusivo, engenharia reversa ou interferir no serviço.',
          'Publicar ou transmitir conteúdo ofensivo, difamatório, ou que promova violência ou ilegalidade em espaços da comunidade.',
          'Falsificar identidade ou abusar de convites Phalanx.',
          'Enviar fotos ou dados de saúde de outra pessoa sem a permissão dela.',
          'Usar as funções de IA para gerar conteúdo ilegal, assediador ou enganoso.',
        ],
      },
      {
        heading: '4. Conteúdo espiritual, IA e coaching',
        paragraphs: [
          'Textos bíblicos, devocionais (por regras ou com assistência de IA), mensagens de coaching e a voz são oferecidos como recursos de crescimento pessoal e espiritual. Não constituem aconselhamento médico, psicológico, jurídico nem pastoral e podem conter erros. Você permanece livre para discernir e aplicar o que considerar útil, sob sua própria responsabilidade.',
          'As funções de IA Premium são fornecidas pela xAI (Grok). Prompts, um contexto limitado de perfil e as imagens que você enviar para análise podem ser transmitidos a esse provedor apenas para gerar a resposta. Não envie segredos, dados pessoais de terceiros nem conteúdo que você não possa compartilhar.',
        ],
      },
      {
        heading: '5. Saúde, sensores, fotos e wearables',
        paragraphs: [
          'As funções de Health — sono, hidratação, refeições, exercício, sensores do telefone, GPS se você ativar (por exemplo clima externo ou mapa de igrejas), frequência cardíaca Bluetooth, fotos de refeição ou composição corporal, saúde feminina, notas clínicas e HealthKit / Health Connect / wearables na nuvem (Fitbit, Oura, WHOOP, Garmin) — são estimativas e ferramentas de acompanhamento. Não são dispositivos médicos, diagnósticos, tratamentos nem aconselhamento clínico.',
          'Consulte um profissional de saúde antes de mudar hábitos, exercício, jejum ou alimentação. O uso de sensores, câmera, localização e permissões do dispositivo é voluntário. A análise de fotos produz apenas estimativas educativas e pode errar.',
        ],
      },
      {
        heading: '6. Biblioteca Freedom e conteúdo de terceiros',
        paragraphs: [
          'Livros, artigos no X, canais do YouTube, mapas e materiais semelhantes de Freedom são ponteiros curados para obras de terceiros. Ao abri-los, você sai para Amazon, X, YouTube, mapas ou outros sites regidos pelos termos deles. Alguns links de livros podem ser Amazon Associates; podemos receber uma comissão se você comprar, sem custo extra para você. Não controlamos nem respondemos pelo conteúdo, disponibilidade ou políticas de terceiros.',
        ],
      },
      {
        heading: '7. Planos, Premium e pagamentos',
        paragraphs: [
          'A Plataforma é freemium. O plano Grátis permite começar. O Salvazion Premium desbloqueia ferramentas avançadas (incluindo o coach com IA e voz, devocionais IA, wearables na nuvem, saúde e calendário avançados, conveniência completa de Freedom e convites Phalanx ilimitados), conforme descrito na Plataforma no momento da compra.',
          'Os preços publicados atuais são USD $49 por mês ou USD $468 por ano (equivalente a $39 por mês cobrado anualmente). Preços, funções e impostos podem mudar; o valor cobrado é o preço mostrado no checkout.',
          'Os pagamentos são processados pela Stripe em nome da Salvazion, Inc. Não armazenamos o número completo do cartão. Você autoriza cobranças recorrentes até cancelar. Pode cancelar ou mudar de plano a qualquer momento no portal do cliente da Stripe a partir da Plataforma. O cancelamento interrompe as renovações futuras; valores já pagos em geral não são reembolsados, salvo quando a lei exigir. Se um pagamento falhar, podemos rebaixar a conta para Grátis.',
        ],
      },
      {
        heading: '8. Web3, Solana e $SALVAZION',
        paragraphs: [
          'Se você conectar uma carteira (por exemplo Jupiter Mobile, Phantom ou Solflare) ou usar swaps, age sob sua própria responsabilidade. A Salvazion não custodia fundos nem chaves privadas, não é uma exchange nem uma corretora, e não é uma assessora financeira, de investimento nem tributária. Transações em blockchain são públicas, irreversíveis e envolvem risco de perda total. $SALVAZION é um token de utilidade na Solana, não é participação na Salvazion, Inc. nem uma promessa de lucro. Cumpra a legislação da sua jurisdição sobre criptoativos.',
        ],
      },
      {
        heading: '9. Propriedade intelectual',
        paragraphs: [
          'O nome e o logo Salvazion, a identidade da comunidade Green Lion Kings, o design da Plataforma, software, scores e o conteúdo editorial próprio pertencem à Salvazion, Inc. ou são usados sob licença. Você recebe uma licença limitada, revogável e intransferível para usar a Plataforma para fins pessoais e não comerciais.',
          'As traduções bíblicas são usadas conforme os respectivos direitos: King James Version (domínio público); Reina Valera 1909 (domínio público — não Reina-Valera 1960, que não redistribuímos); texto histórico Almeida (linhagem de domínio público, apresentado na Plataforma como ARC); Westminster Leningrad Codex (hebraico) e Textus Receptus (grego). Você não pode copiar, revender ou explorar a Plataforma ou seus conjuntos de dados além do que essas licenças e a lei permitirem.',
        ],
      },
      {
        heading: '10. Disponibilidade e mudanças',
        paragraphs: [
          'Podemos modificar, suspender ou descontinuar funções, preços ou estes Termos, com efeito ao publicá-los nesta página. Mudanças materiais mostrarão uma nova data de “Última atualização”. O uso continuado após mudanças relevantes implica aceitação. Não garantimos disponibilidade ininterrupta, ausência de erros, nem que a IA, os sensores ou os serviços de terceiros continuem disponíveis.',
        ],
      },
      {
        heading: '11. Limitação de responsabilidade',
        paragraphs: [
          'A Plataforma é oferecida “no estado em que se encontra” e “conforme disponibilidade”. Na medida permitida pela lei, a Salvazion, Inc. e seus diretores, oficiais e colaboradores não serão responsáveis por danos indiretos, incidentais, especiais, consequenciais ou punitivos, lucros cessantes, perda de dados ou danos decorrentes do uso ou da impossibilidade de uso da Plataforma, incluindo IA, saúde, localização, fotos, cobrança ou Web3. Nossa responsabilidade agregada por reclamações relativas à Plataforma não excederá o maior entre (a) o que você nos pagou de Premium nos três meses anteriores à reclamação ou (b) USD $50, salvo onde a responsabilidade não possa ser limitada.',
        ],
      },
      {
        heading: '12. Encerramento',
        paragraphs: [
          'Você pode deixar de usar a Plataforma a qualquer momento e pedir a exclusão da conta conforme a Política de Privacidade. Podemos suspender ou encerrar contas que violem estes Termos ou coloquem o serviço ou outros usuários em risco. As cláusulas que por natureza devam sobreviver (incluindo propriedade intelectual, risco Web3, limitação de responsabilidade e lei aplicável) permanecem em vigor após o encerramento.',
        ],
      },
      {
        heading: '13. Lei aplicável',
        paragraphs: [
          `Estes Termos regem-se pelas leis do Estado de Delaware, EUA, sem aplicar normas de conflito de leis, salvo as proteções imperativas de consumo do seu país de residência quando não puderem ser renunciadas. Se alguma cláusula não for exigível, o restante permanece em vigor. Para disputas, contate primeiro ${SUPPORT_EMAIL} e buscaremos uma solução amigável.`,
        ],
      },
      {
        heading: '14. Contato',
        paragraphs: [
          `Dúvidas sobre estes Termos: ${SUPPORT_EMAIL}. Salvazion, Inc., 131 Continental Dr, Suite 305, Newark, DE 19713, EUA. Privacidade: veja a Política de Privacidade em /privacy.`,
        ],
      },
    ],
  },
};
