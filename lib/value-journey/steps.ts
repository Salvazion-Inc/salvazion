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
  bodyEs: string;
  bodyEn: string;
  benefitEs: string;
  benefitEn: string;
  ctaEs: string;
  ctaEn: string;
}

export const VALUE_JOURNEY_STEPS: ValueJourneyStep[] = [
  {
    id: 'welcome',
    icon: '🦁',
    titleEs: 'Bienvenido a la Phalanx',
    titleEn: 'Welcome to the Phalanx',
    bodyEs:
      'Salvazion no es entretenimiento vacío. Es una app de virtud digital: fe, salud y libertad con disciplina real, al servicio de familias y de la Cultura Occidental Cristiana.',
    bodyEn:
      'Salvazion is not empty entertainment. It is a digital virtue app: faith, health and freedom with real discipline — for families and Western Christian Culture.',
    benefitEs: 'Un sistema integral · tres pilares · un León que te empuja a la excelencia',
    benefitEn: 'One integral system · three pillars · a Lion that pushes you toward excellence',
    ctaEs: 'Ver propuestas de valor',
    ctaEn: 'See value propositions',
  },
  {
    id: 'salvation',
    href: '/hub/devotional',
    icon: '✝',
    titleEs: 'Salvation — Alma despierta',
    titleEn: 'Salvation — Awakened soul',
    bodyEs:
      'Devocional diario personalizado, Biblia integrada (lectura, búsqueda y concordancia) y motivos de oración. La Palabra primero: no es un “mindfulness” sin cruz.',
    bodyEn:
      'Daily personalized devotional, integrated Bible (read, search, concordance) and prayer motives. The Word first — not cross-less mindfulness.',
    benefitEs: 'Constancia espiritual medible · rachas · score Salvation',
    benefitEn: 'Measurable spiritual consistency · streaks · Salvation score',
    ctaEs: 'Siguiente: Health',
    ctaEn: 'Next: Health',
  },
  {
    id: 'health',
    href: '/hub/health',
    icon: '🌿',
    titleEs: 'Health — Templo en movimiento',
    titleEn: 'Health — Temple in motion',
    bodyEs:
      'Sol, sueño, hidratación, deporte, sensores y wearables. El cuerpo es templo: BioConservadurismo práctico, no cultos de moda.',
    bodyEn:
      'Sun, sleep, hydration, sport, sensors and wearables. The body is a temple: practical BioConservatism, not fad cults.',
    benefitEs: 'Hábitos de salud con score · biomarcadores · disciplina física',
    benefitEn: 'Health habits with score · biomarkers · physical discipline',
    ctaEs: 'Siguiente: Freedom',
    ctaEn: 'Next: Freedom',
  },
  {
    id: 'freedom',
    href: '/hub/freedom',
    icon: '🦅',
    titleEs: 'Freedom — Mente y legado',
    titleEn: 'Freedom — Mind and legacy',
    bodyEs:
      'Aprende con artículos de @salvazion_ en X, conecta en la vida real y aporta a proyectos. Libertad = carácter + oficio + comunidad, no consumo pasivo.',
    bodyEn:
      'Learn with @salvazion_ X Articles, connect in real life and contribute to projects. Freedom = character + craft + community — not passive consumption.',
    benefitEs: 'Biblioteca long-form · Phalanx · Freedom Score',
    benefitEn: 'Long-form library · Phalanx · Freedom Score',
    ctaEs: 'Siguiente: Phalanx',
    ctaEn: 'Next: Phalanx',
  },
  {
    id: 'phalanx',
    href: '/hub/profile',
    icon: '🛡️',
    titleEs: 'Phalanx — Nadie pelea solo',
    titleEn: 'Phalanx — No one fights alone',
    bodyEs:
      'Invita familia, hermanos en la fe, amigos y colegas. La civilización se defiende en casa y en red: tu círculo es tu primera línea.',
    bodyEn:
      'Invite family, faith siblings, friends and colleagues. Civilization is defended at home and in network: your circle is your front line.',
    benefitEs: 'Invitaciones · vínculos · crecimiento juntos',
    benefitEn: 'Invites · bonds · grow together',
    ctaEs: 'Siguiente: León Verde',
    ctaEn: 'Next: Green Lion',
  },
  {
    id: 'lion',
    href: '/hub/coach',
    icon: '🦁',
    titleEs: 'El León Verde — Coach de virtud',
    titleEn: 'The Green Lion — Virtue coach',
    bodyEs:
      'Tu coach de virtud y desarrollo integral. Te disciplina con firmeza y esperanza: no es un chatbot blando; es un llamado a ser Green Lion King.',
    bodyEn:
      'Your coach for virtue and integral growth. Firm and hopeful discipline — not a soft chatbot; a call to become a Green Lion King.',
    benefitEs: 'Guía diaria · voz · retos alineados a tus pilares',
    benefitEn: 'Daily guidance · voice · challenges aligned to your pillars',
    ctaEs: 'Siguiente: Artículos',
    ctaEn: 'Next: Articles',
  },
  {
    id: 'articles',
    href: '/hub/freedom',
    icon: '📰',
    titleEs: 'Artículos @salvazion_ en X',
    titleEn: '@salvazion_ Articles on X',
    bodyEs:
      'Long-form sobre fe, familia, libertad, tecnología y Cultura Occidental Cristiana. La app te muestra lo que aún no leíste, priorizado por tus intereses.',
    bodyEn:
      'Long-form on faith, family, freedom, technology and Western Christian Culture. The app shows what you have not read yet, ranked by your interests.',
    benefitEs: 'Imagen + título · leer en X · Freedom al completar',
    benefitEn: 'Image + title · read on X · Freedom when completed',
    ctaEs: 'Siguiente: Insignias',
    ctaEn: 'Next: Badges',
  },
  {
    id: 'badges',
    href: '/hub/badges',
    icon: '⭐',
    titleEs: 'Insignias de virtud',
    titleEn: 'Virtue badges',
    bodyEs:
      'No son trofeos vacíos de dopamina. Cada insignia marca constancia real: devocional, movimiento, conexiones, rachas y excelencia de la Phalanx.',
    bodyEn:
      'Not empty dopamine trophies. Each badge marks real consistency: devotionals, movement, connections, streaks and Phalanx excellence.',
    benefitEs: 'Memoria de decisiones fieles · progreso visible',
    benefitEn: 'Memory of faithful decisions · visible progress',
    ctaEs: 'Siguiente: Empezar',
    ctaEn: 'Next: Begin',
  },
  {
    id: 'ready',
    href: '/hub/dashboard',
    icon: '✓',
    titleEs: 'Make Salvation, Health and Freedom Great Again',
    titleEn: 'Make Salvation, Health and Freedom Great Again',
    bodyEs:
      'Ya conoces la propuesta. Ahora toca vivirla: un pilar a la vez, un día a la vez, con tu Phalanx y el León a tu lado.',
    bodyEn:
      'You know the value. Now live it: one pillar at a time, one day at a time — with your Phalanx and the Lion beside you.',
    benefitEs: 'Dashboard · scores · agenda · swap $SALVAZION',
    benefitEn: 'Dashboard · scores · calendar · $SALVAZION swap',
    ctaEs: 'Entrar al Hub',
    ctaEn: 'Enter the Hub',
  },
];

export function getValueStepCopy(step: ValueJourneyStep, lang: 'es' | 'en') {
  return {
    title: lang === 'en' ? step.titleEn : step.titleEs,
    body: lang === 'en' ? step.bodyEn : step.bodyEs,
    benefit: lang === 'en' ? step.benefitEn : step.benefitEs,
    cta: lang === 'en' ? step.ctaEn : step.ctaEs,
  };
}
