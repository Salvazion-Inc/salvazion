/** Public copy for /partners. PENDING Cristian's approval (9:00 batch) — see PR. */
export const PARTNER_COPY = {
  en: {
    kicker: 'For churches & pastors',
    title: 'Your people are under pressure. Let’s carry it together.',
    lead: 'Salvazion gives your congregation daily tools for faith, health and freedom — built on biblical truth, free to start, and alongside the ministry you already lead.',
    benefits: [
      'Daily devotional, Bible and prayer tools your members can use between Sundays',
      'Practical health and food guidance for families',
      'A free partner account for your church — no exclusivity, no cost to join',
    ],
    formTitle: 'Become a partner in under 5 minutes',
    name: 'Your name', email: 'Email', church: 'Church or ministry', city: 'City / State',
    role: 'Your role', roles: { pastor: 'Pastor', leader: 'Ministry leader', member: 'Church member' },
    password: 'Create a password (8+ characters)',
    terms: 'I accept the Terms and Privacy Policy',
    submit: 'Create partner account',
    note: 'You will verify your email, then we review your church and reach out personally.',
    checkTitle: 'Check your email',
    checkBody: 'We sent a verification link to',
    welcomeTitle: 'Welcome, partner',
    welcomeBody: 'Your account is verified. Our team will review your church and contact you within a few days with resources for your congregation.',
    welcomeCta: 'Go to your hub',
    errTerms: 'Please accept the terms.', errPass: 'Password must be at least 8 characters.', errFields: 'Please fill in all fields.',
  },
  es: {
    kicker: 'Para iglesias y pastores',
    title: 'Tu gente está bajo presión. Llevémoslo juntos.',
    lead: 'Salvazion da a tu congregación herramientas diarias para la fe, la salud y la libertad: basadas en la verdad bíblica, gratis para empezar y junto al ministerio que ya lideras.',
    benefits: [
      'Devocional diario, Biblia y oración para tus miembros entre domingos',
      'Guía práctica de salud y alimentación para las familias',
      'Cuenta de partner gratuita para tu iglesia: sin exclusividad y sin costo',
    ],
    formTitle: 'Hazte partner en menos de 5 minutos',
    name: 'Tu nombre', email: 'Correo', church: 'Iglesia o ministerio', city: 'Ciudad / Estado',
    role: 'Tu rol', roles: { pastor: 'Pastor', leader: 'Líder de ministerio', member: 'Miembro de iglesia' },
    password: 'Crea una contraseña (8+ caracteres)',
    terms: 'Acepto los Términos y la Política de Privacidad',
    submit: 'Crear cuenta de partner',
    note: 'Verificarás tu correo; luego revisamos tu iglesia y te contactamos personalmente.',
    checkTitle: 'Revisa tu correo',
    checkBody: 'Enviamos un enlace de verificación a',
    welcomeTitle: 'Bienvenido, partner',
    welcomeBody: 'Tu cuenta está verificada. Nuestro equipo revisará tu iglesia y te contactará en pocos días con recursos para tu congregación.',
    welcomeCta: 'Ir a tu hub',
    errTerms: 'Acepta los términos.', errPass: 'La contraseña debe tener al menos 8 caracteres.', errFields: 'Completa todos los campos.',
  },
  pt: {
    kicker: 'Para igrejas e pastores',
    title: 'Seu povo está sob pressão. Vamos carregar isso juntos.',
    lead: 'A Salvazion oferece à sua congregação ferramentas diárias de fé, saúde e liberdade — baseadas na verdade bíblica, grátis para começar e ao lado do ministério que você já lidera.',
    benefits: [
      'Devocional diário, Bíblia e oração para seus membros entre os domingos',
      'Orientação prática de saúde e alimentação para as famílias',
      'Conta de parceiro gratuita para sua igreja — sem exclusividade e sem custo',
    ],
    formTitle: 'Seja parceiro em menos de 5 minutos',
    name: 'Seu nome', email: 'E-mail', church: 'Igreja ou ministério', city: 'Cidade / Estado',
    role: 'Sua função', roles: { pastor: 'Pastor', leader: 'Líder de ministério', member: 'Membro da igreja' },
    password: 'Crie uma senha (8+ caracteres)',
    terms: 'Aceito os Termos e a Política de Privacidade',
    submit: 'Criar conta de parceiro',
    note: 'Você vai verificar seu e-mail; depois analisamos sua igreja e entramos em contato pessoalmente.',
    checkTitle: 'Verifique seu e-mail',
    checkBody: 'Enviamos um link de verificação para',
    welcomeTitle: 'Bem-vindo, parceiro',
    welcomeBody: 'Sua conta está verificada. Nossa equipe vai analisar sua igreja e entrar em contato em poucos dias com recursos para sua congregação.',
    welcomeCta: 'Ir para o hub',
    errTerms: 'Aceite os termos.', errPass: 'A senha deve ter pelo menos 8 caracteres.', errFields: 'Preencha todos os campos.',
  },
} as const;

export type PartnerLang = keyof typeof PARTNER_COPY;
export function partnerCopy(lang: string | undefined) {
  return PARTNER_COPY[(lang === 'es' || lang === 'pt' ? lang : 'en') as PartnerLang];
}

export function sendPartnerEvent(event: string, props: Record<string, string | boolean> = {}) {
  try {
    void fetch('/api/partners/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({ event, props }),
    }).catch(() => undefined);
  } catch {
    // ignore
  }
}
