/**
 * Salvazion value proposition journey — in-app onboarding messages.
 * Walks the user through benefits without losing brand DNA.
 */

export type ValueJourneyStepId =
  | 'welcome'
  | 'salvation'
  | 'health'
  | 'freedom'
  | 'phalanx'
  | 'lion'
  | 'articles'
  | 'badges'
  | 'ready';

export interface ValueJourneyStep {
  id: ValueJourneyStepId;
  /** Optional deep link after the step */
  href?: string;
  icon: string;
  titleEs: string;
  titleEn: string;
  titlePt: string;
  bodyEs: string;
  bodyEn: string;
  bodyPt: string;
  benefitEs: string;
  benefitEn: string;
  benefitPt: string;
  ctaEs: string;
  ctaEn: string;
  ctaPt: string;
}

export const VALUE_JOURNEY_STEPS: ValueJourneyStep[] = [
  {
    id: 'welcome',
    icon: '🦁',
    titleEs: 'La plataforma que restaura a la persona humana',
    titleEn: 'The platform that restores the human person',
    titlePt: 'A plataforma que restaura a pessoa humana',
    bodyEs:
      'Salvazion es la plataforma que restaura a la persona humana. Salvación, Salud y Libertad viven juntas en una sola Plataforma: hábitos, scores, comunidad y soberanía económica en Solana.',
    bodyEn:
      'Salvazion is the platform that restores the human person. Salvation, Health and Freedom live together in one Platform: habits, scores, community and economic sovereignty on Solana.',
    bodyPt:
      'A Salvazion é a plataforma que restaura a pessoa humana. Salvação, Saúde e Liberdade vivem juntas em uma só Plataforma: hábitos, scores, comunidade e soberania econômica na Solana.',
    benefitEs: 'Una sola plataforma · tres pilares · disciplina real',
    benefitEn: 'One platform · three pillars · real discipline',
    benefitPt: 'Uma só plataforma · três pilares · disciplina real',
    ctaEs: 'Ver propuestas de valor',
    ctaEn: 'See value propositions',
    ctaPt: 'Ver propostas de valor',
  },
  {
    id: 'salvation',
    href: '/hub/devotional',
    icon: '✝',
    titleEs: 'Salvation — Alma despierta',
    titleEn: 'Salvation — Awakened soul',
    titlePt: 'Salvation — Alma acordada',
    bodyEs:
      'Devocional diario personalizado, Biblia integrada (lectura, búsqueda y concordancia) y motivos de oración. La Palabra primero: no es un “mindfulness” sin cruz.',
    bodyEn:
      'Daily personalized devotional, integrated Bible (read, search, concordance) and prayer motives. The Word first — not cross-less mindfulness.',
    bodyPt:
      'Devocional diário personalizado, Bíblia integrada (leitura, busca e concordância) e motivos de oração. A Palavra primeiro: não é um “mindfulness” sem cruz.',
    benefitEs: 'Constancia espiritual medible · rachas · score Salvation',
    benefitEn: 'Measurable spiritual consistency · streaks · Salvation score',
    benefitPt: 'Constância espiritual mensurável · sequências · score Salvation',
    ctaEs: 'Siguiente: Health',
    ctaEn: 'Next: Health',
    ctaPt: 'Próximo: Health',
  },
  {
    id: 'health',
    href: '/hub/health',
    icon: '🌿',
    titleEs: 'Health — Templo en movimiento',
    titleEn: 'Health — Temple in motion',
    titlePt: 'Health — Templo em movimento',
    bodyEs:
      'Sol, sueño, hidratación, deporte, sensores y wearables. El cuerpo es templo: BioConservadurismo práctico, no cultos de moda.',
    bodyEn:
      'Sun, sleep, hydration, sport, sensors and wearables. The body is a temple: practical BioConservatism, not fad cults.',
    bodyPt:
      'Sol, sono, hidratação, esporte, sensores e wearables. O corpo é templo: BioConservadorismo prático, não cultos da moda.',
    benefitEs: 'Hábitos de salud con score · biomarcadores · disciplina física',
    benefitEn: 'Health habits with score · biomarkers · physical discipline',
    benefitPt: 'Hábitos de saúde com score · biomarcadores · disciplina física',
    ctaEs: 'Siguiente: Freedom',
    ctaEn: 'Next: Freedom',
    ctaPt: 'Próximo: Freedom',
  },
  {
    id: 'freedom',
    href: '/hub/freedom',
    icon: '🦅',
    titleEs: 'Freedom — Mente y legado',
    titleEn: 'Freedom — Mind and legacy',
    titlePt: 'Freedom — Mente e legado',
    bodyEs:
      'Aprende con artículos de @salvazion_ en X, conecta en la vida real y aporta a proyectos. Libertad = carácter + oficio + comunidad, no consumo pasivo.',
    bodyEn:
      'Learn with @salvazion_ X Articles, connect in real life and contribute to projects. Freedom = character + craft + community — not passive consumption.',
    bodyPt:
      'Aprenda com artigos de @salvazion_ no X, conecte na vida real e contribua em projetos. Liberdade = caráter + ofício + comunidade, não consumo passivo.',
    benefitEs: 'Biblioteca long-form · Comunidad · Freedom Score',
    benefitEn: 'Long-form library · Community · Freedom Score',
    benefitPt: 'Biblioteca long-form · Comunidade · Freedom Score',
    ctaEs: 'Siguiente: Comunidad',
    ctaEn: 'Next: Community',
    ctaPt: 'Próximo: Comunidade',
  },
  {
    id: 'phalanx',
    href: '/hub/profile',
    icon: '🛡️',
    titleEs: 'Comunidad — Green Lion Kings',
    titleEn: 'Community — Green Lion Kings',
    titlePt: 'Comunidade — Green Lion Kings',
    bodyEs:
      'Invita familia, hermanos en la fe, amigos y colegas. La comunidad y sus miembros son Green Lion Kings. Nadie pelea solo.',
    bodyEn:
      'Invite family, faith siblings, friends and colleagues. The community and its members are Green Lion Kings. No one fights alone.',
    bodyPt:
      'Convide família, irmãos na fé, amigos e colegas. A comunidade e seus membros são Green Lion Kings. Ninguém luta sozinho.',
    benefitEs: 'Invitaciones · vínculos · crecimiento juntos',
    benefitEn: 'Invites · bonds · grow together',
    benefitPt: 'Convites · vínculos · crescimento juntos',
    ctaEs: 'Siguiente: Salvazion AI',
    ctaEn: 'Next: Salvazion AI',
    ctaPt: 'Próximo: Salvazion AI',
  },
  {
    id: 'lion',
    href: '/hub/coach',
    icon: '🦁',
    titleEs: 'Salvazion AI — propósito y Score',
    titleEn: 'Salvazion AI — purpose and Score',
    titlePt: 'Salvazion AI — propósito e Score',
    bodyEs:
      'Te ayuda a lograr el propósito que escribiste — o a encontrarlo si aún está en blanco. Sube tu Score Global y te motiva a sacar el máximo de la Plataforma. No es un chatbot blando: es un llamado a ser Green Lion King.',
    bodyEn:
      'Helps you achieve the purpose you wrote — or find it if it is still blank. Raises your Global Score and pushes you to get the maximum from the Platform. Not a soft chatbot: a call to become a Green Lion King.',
    bodyPt:
      'Ajuda você a cumprir o propósito que escreveu — ou a encontrá-lo se ainda estiver em branco. Sobe o Score Global e motiva você a tirar o máximo da Plataforma. Não é um chatbot mole: é um chamado a ser Green Lion King.',
    benefitEs: 'Propósito · Score Global · uso máximo de la Plataforma',
    benefitEn: 'Purpose · Global Score · full use of the Platform',
    benefitPt: 'Propósito · Score Global · uso máximo da Plataforma',
    ctaEs: 'Siguiente: Artículos',
    ctaEn: 'Next: Articles',
    ctaPt: 'Próximo: Artigos',
  },
  {
    id: 'articles',
    href: '/hub/freedom',
    icon: '📰',
    titleEs: 'Artículos @salvazion_ en X',
    titleEn: '@salvazion_ Articles on X',
    titlePt: 'Artigos @salvazion_ no X',
    bodyEs:
      'Long-form sobre fe, familia, libertad, tecnología y Cultura Occidental Cristiana. La plataforma te muestra lo que aún no leíste, priorizado por tus intereses.',
    bodyEn:
      'Long-form on faith, family, freedom, technology and Western Christian Culture. The platform shows what you have not read yet, ranked by your interests.',
    bodyPt:
      'Long-form sobre fé, família, liberdade, tecnologia e Cultura Ocidental Cristã. A plataforma mostra o que você ainda não leu, priorizado pelos seus interesses.',
    benefitEs: 'Imagen + título · leer en X · Freedom al completar',
    benefitEn: 'Image + title · read on X · Freedom when completed',
    benefitPt: 'Imagem + título · ler no X · Freedom ao completar',
    ctaEs: 'Siguiente: Insignias',
    ctaEn: 'Next: Badges',
    ctaPt: 'Próximo: Insígnias',
  },
  {
    id: 'badges',
    href: '/hub/badges',
    icon: '⭐',
    titleEs: 'Insignias de virtud',
    titleEn: 'Virtue badges',
    titlePt: 'Insígnias de virtude',
    bodyEs:
      'No son trofeos vacíos de dopamina. Cada insignia marca constancia real: devocional, movimiento, conexiones, rachas y excelencia de la Comunidad.',
    bodyEn:
      'Not empty dopamine trophies. Each badge marks real consistency: devotionals, movement, connections, streaks and Community excellence.',
    bodyPt:
      'Não são troféus vazios de dopamina. Cada insígnia marca constância real: devocional, movimento, conexões, sequências e excelência da Comunidade.',
    benefitEs: 'Memoria de decisiones fieles · progreso visible',
    benefitEn: 'Memory of faithful decisions · visible progress',
    benefitPt: 'Memória de decisões fiéis · progresso visível',
    ctaEs: 'Siguiente: Empezar',
    ctaEn: 'Next: Begin',
    ctaPt: 'Próximo: Começar',
  },
  {
    id: 'ready',
    href: '/hub/dashboard',
    icon: '✓',
    titleEs: 'Make Salvation, Health and Freedom Great Again',
    titleEn: 'Make Salvation, Health and Freedom Great Again',
    titlePt: 'Make Salvation, Health and Freedom Great Again',
    bodyEs:
      'Ya conoces la propuesta. Ahora toca vivirla: un pilar a la vez, un día a la vez, con la Comunidad y Salvazion AI a tu lado.',
    bodyEn:
      'You know the value. Now live it: one pillar at a time, one day at a time — with the Community and Salvazion AI beside you.',
    bodyPt:
      'Você já conhece a proposta. Agora é viver: um pilar de cada vez, um dia de cada vez, com a Comunidade e a Salvazion AI ao lado.',
    benefitEs: 'Dashboard · scores · agenda · swap $SALVAZION',
    benefitEn: 'Dashboard · scores · calendar · $SALVAZION swap',
    benefitPt: 'Dashboard · scores · agenda · swap $SALVAZION',
    ctaEs: 'Entrar al Hub',
    ctaEn: 'Enter the Hub',
    ctaPt: 'Entrar no Hub',
  },
];

export function getValueStepCopy(step: ValueJourneyStep, lang: 'es' | 'en' | 'pt') {
  if (lang === 'en') {
    return { title: step.titleEn, body: step.bodyEn, benefit: step.benefitEn, cta: step.ctaEn };
  }
  if (lang === 'pt') {
    return { title: step.titlePt, body: step.bodyPt, benefit: step.benefitPt, cta: step.ctaPt };
  }
  return { title: step.titleEs, body: step.bodyEs, benefit: step.benefitEs, cta: step.ctaEs };
}
