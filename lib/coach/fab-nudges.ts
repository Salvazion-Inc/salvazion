/**
 * Short coach "cloud" nudges for the floating Salvazion logo (Coach FAB).
 * Personalized from profile, scores, streaks, daily actions and language.
 * Each nudge is actionable (deep-link + CTA label).
 */

import type { UserProfile } from '@/lib/types';
import type { ComputedScores, Pillar } from '@/lib/scoring/types';

export type FabNudgeTone = 'motivate' | 'nudge' | 'celebrate' | 'focus' | 'premium';

export type FabNudge = {
  id: string;
  text: string;
  tone: FabNudgeTone;
  pillar?: Pillar | 'global';
  /** In-app destination */
  href: string;
  /** Short CTA on the cloud button */
  cta: string;
};

type Lang = 'en' | 'es' | 'pt';

const HREF = {
  dashboard: '/hub/dashboard',
  devotional: '/hub/devotional',
  bible: '/hub/bible',
  health: '/hub/health',
  calendar: '/hub/calendar',
  freedom: '/hub/freedom',
  freedomLearn: '/hub/freedom?tab=learn',
  freedomConnect: '/hub/freedom?tab=connect',
  freedomContribute: '/hub/freedom?tab=contribute',
  badges: '/hub/badges',
  profile: '/hub/profile',
  premium: '/hub/premium',
  coach: '/hub/coach',
} as const;

const FOCUS_LABEL: Record<string, { es: string; en: string }> = {
  fe: { es: 'fe', en: 'faith' },
  familia: { es: 'familia', en: 'family' },
  proposito: { es: 'propósito', en: 'purpose' },
  salud: { es: 'salud', en: 'health' },
  libertad: { es: 'libertad', en: 'freedom' },
  oracion: { es: 'oración', en: 'prayer' },
  liderazgo: { es: 'liderazgo', en: 'leadership' },
  perseverancia: { es: 'perseverancia', en: 'perseverance' },
};

function firstName(profile: Partial<UserProfile> | null | undefined, lang: Lang): string {
  const raw = profile?.name?.trim().split(/\s+/)[0];
  if (raw) return raw;
  return lang === 'es' ? 'hermano' : lang === 'pt' ? 'irmão' : 'friend';
}

function pillarWord(p: Pillar): string {
  if (p === 'salvation') return 'Salvation';
  if (p === 'health') return 'Health';
  return 'Freedom';
}

function pillarHref(p: Pillar): string {
  if (p === 'salvation') return HREF.devotional;
  if (p === 'health') return HREF.health;
  return HREF.freedomLearn;
}

function pillarCta(p: Pillar, es: boolean): string {
  if (p === 'salvation') return es ? 'Abrir Devocional' : 'Open Devotional';
  if (p === 'health') return es ? 'Ir a Health' : 'Go to Health';
  return es ? 'Abrir Freedom' : 'Open Freedom';
}

function hourBucket(d = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

function coachOrPremium(isPremium: boolean): string {
  return isPremium ? HREF.coach : HREF.premium;
}

/**
 * Build a rotating pool of short cloud messages (1–2 lines) with CTAs.
 */
export function buildFabNudges(
  profile: Partial<UserProfile> | null | undefined,
  scores: ComputedScores | null | undefined,
  lang: Lang,
  isPremium: boolean
): FabNudge[] {
  const es = lang === 'es';
  const name = firstName(profile, lang);
  const out: FabNudge[] = [];
  const push = (n: FabNudge) => {
    if (n.text && n.text.length <= 120 && n.href && n.cta) out.push(n);
  };

  const s = scores;
  const global = s ? Math.round(s.global) : null;
  const salvation = s ? Math.round(s.salvation) : null;
  const health = s ? Math.round(s.health) : null;
  const freedom = s ? Math.round(s.freedom) : null;
  const actions = s?.todayActions || [];
  const streaks = s?.streaks;

  const didDevotional = actions.some((a) => a.type === 'devotional_complete');
  const didBible = actions.some(
    (a) => a.type === 'bible_chapter' || a.type === 'bible_study_15min'
  );
  const didPray = actions.some((a) => a.type === 'pray_5min');
  const didMovement = actions.some(
    (a) => a.type === 'hit_15min' || a.type === 'outdoor_sun_20min'
  );
  const didHydration = actions.some((a) => a.type === 'hydration_daily');
  const didLearn = actions.some(
    (a) => a.type.startsWith('learn_') || a.type === 'debate_participate'
  );
  const didConnect = actions.some((a) => a.type === 'connect_real');

  const pillars: { key: Pillar; value: number; streak: number }[] = s
    ? [
        { key: 'salvation', value: s.salvation, streak: streaks?.salvation ?? 0 },
        { key: 'health', value: s.health, streak: streaks?.health ?? 0 },
        { key: 'freedom', value: s.freedom, streak: streaks?.freedom ?? 0 },
      ]
    : [];
  pillars.sort((a, b) => a.value - b.value);
  const weakest = pillars[0];
  const strongest = pillars[pillars.length - 1];

  const focus = (profile?.currentFocus || []).filter(Boolean);
  const focusKey = focus[0];
  const focusLabel =
    focusKey && FOCUS_LABEL[focusKey]
      ? es
        ? FOCUS_LABEL[focusKey].es
        : FOCUS_LABEL[focusKey].en
      : null;

  const bucket = hourBucket();
  const family =
    profile?.familyStatus === 'married' ||
    profile?.familyStatus === 'parent' ||
    profile?.familyStatus === 'family';

  const coachHref = coachOrPremium(isPremium);

  // —— Time of day ——
  if (bucket === 'morning') {
    push({
      id: 'tod-morning',
      tone: 'motivate',
      text: es
        ? `${name}, un día firme empieza con Dios. ¿Devocional?`
        : `${name}, a strong day starts with God. Devotional?`,
      pillar: 'salvation',
      href: HREF.devotional,
      cta: es ? 'Hacer Devocional' : 'Do Devotional',
    });
  } else if (bucket === 'afternoon') {
    push({
      id: 'tod-afternoon',
      tone: 'nudge',
      text: es
        ? `${name}, mediodía: mueve el cuerpo o rehidrátate.`
        : `${name}, midday: move your body or rehydrate.`,
      pillar: 'health',
      href: HREF.health,
      cta: es ? 'Abrir Health' : 'Open Health',
    });
  } else if (bucket === 'evening') {
    push({
      id: 'tod-evening',
      tone: 'motivate',
      text: es
        ? `${name}, cierra el día con constancia, no con prisa.`
        : `${name}, close the day with consistency, not rush.`,
      href: HREF.calendar,
      cta: es ? 'Ver agenda' : 'Open agenda',
    });
  } else {
    push({
      id: 'tod-night',
      tone: 'motivate',
      text: es
        ? `${name}, el descanso también es disciplina. Duerme bien.`
        : `${name}, rest is discipline too. Sleep well.`,
      pillar: 'health',
      href: HREF.calendar,
      cta: es ? 'Planificar sueño' : 'Plan sleep',
    });
  }

  // —— Scores ——
  if (global != null) {
    if (global >= 80) {
      push({
        id: 'score-high',
        tone: 'celebrate',
        text: es
          ? `¡${name}! Score ${global}. El León te ve firme hoy.`
          : `${name}! Score ${global}. The Lion sees you steady today.`,
        pillar: 'global',
        href: HREF.badges,
        cta: es ? 'Ver insignias' : 'See badges',
      });
    } else if (global < 35) {
      push({
        id: 'score-low',
        tone: 'nudge',
        text: es
          ? `${name}, score ${global}. Un paso pequeño hoy basta.`
          : `${name}, score ${global}. One small step today is enough.`,
        pillar: 'global',
        href: HREF.dashboard,
        cta: es ? 'Ir al Hub' : 'Go to Hub',
      });
    } else {
      push({
        id: 'score-mid',
        tone: 'motivate',
        text: es
          ? `Score ${global}. Vas en camino, ${name}. No aflojes.`
          : `Score ${global}. You're on the way, ${name}. Keep going.`,
        pillar: 'global',
        href: HREF.dashboard,
        cta: es ? 'Ver scores' : 'See scores',
      });
    }
  }

  if (weakest && weakest.value < 40) {
    const p = pillarWord(weakest.key);
    push({
      id: 'weak-pillar',
      tone: 'nudge',
      text: es
        ? `${p} en ${Math.round(weakest.value)}. Es tu oportunidad de crecer.`
        : `${p} at ${Math.round(weakest.value)}. Your chance to grow.`,
      pillar: weakest.key,
      href: pillarHref(weakest.key),
      cta: pillarCta(weakest.key, es),
    });
  }

  if (strongest && strongest.streak >= 3) {
    const p = pillarWord(strongest.key);
    push({
      id: 'streak-strong',
      tone: 'celebrate',
      text: es
        ? `Racha ${p}: ${strongest.streak} días. ¡Protégela, ${name}!`
        : `${p} streak: ${strongest.streak} days. Guard it, ${name}!`,
      pillar: strongest.key,
      href: pillarHref(strongest.key),
      cta: es ? 'Seguir la racha' : 'Keep the streak',
    });
  }

  // —— Missing daily actions ——
  if (!didDevotional) {
    push({
      id: 'act-devo',
      tone: 'nudge',
      text: es
        ? `${name}, el León te espera en el Devocional de hoy.`
        : `${name}, the Lion waits in today's Devotional.`,
      pillar: 'salvation',
      href: HREF.devotional,
      cta: es ? 'Hacer Devocional' : 'Do Devotional',
    });
  }
  if (!didBible && !didDevotional) {
    push({
      id: 'act-bible',
      tone: 'focus',
      text: es
        ? `Un capítulo de la Biblia alinea el día. ¿Leemos?`
        : `One Bible chapter aligns the day. Shall we read?`,
      pillar: 'salvation',
      href: HREF.bible,
      cta: es ? 'Abrir Biblia' : 'Open Bible',
    });
  }
  if (!didPray) {
    push({
      id: 'act-pray',
      tone: 'focus',
      text: es
        ? `5 minutos de oración. Fe primero, ${name}.`
        : `5 minutes of prayer. Faith first, ${name}.`,
      pillar: 'salvation',
      href: HREF.devotional,
      cta: es ? 'Orar ahora' : 'Pray now',
    });
  }
  if (!didMovement) {
    push({
      id: 'act-move',
      tone: 'nudge',
      text: es
        ? `Tu cuerpo es templo. 15 min de movimiento hoy.`
        : `Your body is a temple. 15 min of movement today.`,
      pillar: 'health',
      href: HREF.health,
      cta: es ? 'Registrar movimiento' : 'Log movement',
    });
  }
  if (!didHydration) {
    push({
      id: 'act-hydro',
      tone: 'nudge',
      text: es
        ? `Hidratación: un vaso ahora cuenta para Health.`
        : `Hydration: one glass now counts for Health.`,
      pillar: 'health',
      href: HREF.health,
      cta: es ? 'Ir a hidratación' : 'Log hydration',
    });
  }
  if (!didLearn) {
    push({
      id: 'act-learn',
      tone: 'nudge',
      text: es
        ? `Freedom crece con un artículo o video corto.`
        : `Freedom grows with one short article or video.`,
      pillar: 'freedom',
      href: HREF.freedomLearn,
      cta: es ? 'Leer artículos' : 'Read articles',
    });
  }
  if (!didConnect && family) {
    push({
      id: 'act-family',
      tone: 'focus',
      text: es
        ? `${name}, conecta con tu familia o Phalanx hoy.`
        : `${name}, connect with family or Phalanx today.`,
      pillar: 'freedom',
      href: HREF.freedomConnect,
      cta: es ? 'Conectar' : 'Connect',
    });
  }

  // —— Focus / goals ——
  if (focusLabel) {
    let href: string = HREF.dashboard;
    let cta = es ? 'Actuar ahora' : 'Act now';
    if (focusKey === 'fe' || focusKey === 'oracion') {
      href = HREF.devotional;
      cta = es ? 'Devocional' : 'Devotional';
    } else if (focusKey === 'salud') {
      href = HREF.health;
      cta = es ? 'Abrir Health' : 'Open Health';
    } else if (focusKey === 'libertad' || focusKey === 'proposito' || focusKey === 'liderazgo') {
      href = HREF.freedomLearn;
      cta = es ? 'Abrir Freedom' : 'Open Freedom';
    } else if (focusKey === 'familia') {
      href = HREF.freedomConnect;
      cta = es ? 'Conectar' : 'Connect';
    } else if (focusKey === 'perseverancia') {
      href = HREF.calendar;
      cta = es ? 'Ver agenda' : 'Open agenda';
    }
    push({
      id: 'focus-main',
      tone: 'focus',
      text: es
        ? `Tu foco es ${focusLabel}. Un acto concreto hoy.`
        : `Your focus is ${focusLabel}. One concrete act today.`,
      href,
      cta,
    });
  }
  if (focus.includes('libertad') || focus.includes('proposito')) {
    push({
      id: 'focus-freedom',
      tone: 'motivate',
      text: es
        ? `Libertad con virtud: aprende y aporta, no solo consumas.`
        : `Freedom with virtue: learn and contribute, don't only consume.`,
      pillar: 'freedom',
      href: HREF.freedomContribute,
      cta: es ? 'Aportar' : 'Contribute',
    });
  }
  if (focus.includes('salud')) {
    push({
      id: 'focus-health',
      tone: 'motivate',
      text: es
        ? `Salud es disciplina diaria. Sueño, agua, movimiento.`
        : `Health is daily discipline. Sleep, water, movement.`,
      pillar: 'health',
      href: HREF.health,
      cta: es ? 'Abrir Health' : 'Open Health',
    });
  }
  if (focus.includes('fe') || focus.includes('oracion')) {
    push({
      id: 'focus-faith',
      tone: 'motivate',
      text: es
        ? `Fe y oración no se delegan. El León camina contigo.`
        : `Faith and prayer can't be outsourced. The Lion walks with you.`,
      pillar: 'salvation',
      href: HREF.devotional,
      cta: es ? 'Orar / Devocional' : 'Pray / Devotional',
    });
  }

  // —— Pillar-specific scores ——
  if (salvation != null && salvation >= 70) {
    push({
      id: 'sal-good',
      tone: 'celebrate',
      text: es
        ? `Salvation ${salvation}. Espíritu firme hoy, ${name}.`
        : `Salvation ${salvation}. Spirit steady today, ${name}.`,
      pillar: 'salvation',
      href: HREF.bible,
      cta: es ? 'Seguir en Biblia' : 'Keep reading Bible',
    });
  }
  if (health != null && health < 30) {
    push({
      id: 'hea-low',
      tone: 'nudge',
      text: es
        ? `Health ${health}. El cuerpo pide atención real.`
        : `Health ${health}. The body needs real attention.`,
      pillar: 'health',
      href: HREF.health,
      cta: es ? 'Cuidar el cuerpo' : 'Care for body',
    });
  }
  if (freedom != null && freedom < 30) {
    push({
      id: 'fre-low',
      tone: 'nudge',
      text: es
        ? `Freedom ${freedom}. Lee, conecta o aporta algo útil.`
        : `Freedom ${freedom}. Read, connect, or contribute something useful.`,
      pillar: 'freedom',
      href: HREF.freedomLearn,
      cta: es ? 'Abrir Freedom' : 'Open Freedom',
    });
  }

  // —— Purpose ——
  if (profile?.purpose?.trim()) {
    const purposeShort = profile.purpose.trim().slice(0, 36);
    push({
      id: 'purpose',
      tone: 'focus',
      text: es
        ? `Tu propósito: “${purposeShort}${profile.purpose.length > 36 ? '…' : ''}”. Un paso hoy.`
        : `Your purpose: “${purposeShort}${profile.purpose.length > 36 ? '…' : ''}”. One step today.`,
      href: HREF.dashboard,
      cta: es ? 'Un paso hoy' : 'One step today',
    });
  }

  // —— Premium / coach ——
  if (!isPremium) {
    push({
      id: 'prem-ai',
      tone: 'premium',
      text: es
        ? `Habla con Salvazion AI en Premium. El León te guía.`
        : `Talk with Salvazion AI on Premium. The Lion guides you.`,
      href: HREF.premium,
      cta: es ? 'Ver Premium' : 'See Premium',
    });
    push({
      id: 'prem-voice',
      tone: 'premium',
      text: es
        ? `Voz del León y herramientas avanzadas → Premium.`
        : `Lion voice and advanced tools → Premium.`,
      href: HREF.premium,
      cta: es ? 'Mejorar plan' : 'Upgrade plan',
    });
  } else {
    push({
      id: 'prem-active',
      tone: 'motivate',
      text: es
        ? `${name}, Premium activo. Usa al León: habla y actúa.`
        : `${name}, Premium active. Use the Lion: talk and act.`,
      href: HREF.coach,
      cta: es ? 'Hablar con el León' : 'Talk to the Lion',
    });
  }

  // —— Always-on ——
  push({
    id: 'always-1',
    tone: 'motivate',
    text: es
      ? `Virtud + constancia. Salvation · Health · Freedom.`
      : `Virtue + consistency. Salvation · Health · Freedom.`,
    href: HREF.dashboard,
    cta: es ? 'Ver Hub' : 'Open Hub',
  });
  push({
    id: 'always-2',
    tone: 'motivate',
    text: es
      ? `${name}, no eres espectador. Eres León Verde.`
      : `${name}, you're not a spectator. You're a Green Lion.`,
    href: coachHref,
    cta: isPremium
      ? es
        ? 'Hablar ahora'
        : 'Talk now'
      : es
        ? 'Activar León'
        : 'Unlock Lion',
  });
  push({
    id: 'always-3',
    tone: 'motivate',
    text: es
      ? `La phalanx se construye un día a la vez.`
      : `The phalanx is built one day at a time.`,
    href: HREF.freedomConnect,
    cta: es ? 'Invitar / conectar' : 'Invite / connect',
  });

  const seen = new Set<string>();
  const unique = out.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  const seed =
    (typeof Date !== 'undefined' ? new Date().getHours() * 7 + new Date().getMinutes() : 0) %
    Math.max(unique.length, 1);
  return [...unique.slice(seed), ...unique.slice(0, seed)];
}
