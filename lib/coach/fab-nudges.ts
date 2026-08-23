/**
 * Short coach "cloud" nudges for the floating Salvazion logo (Coach FAB).
 * Personalized from profile, scores, streaks, daily actions and language.
 * Each nudge is actionable (deep-link + CTA label).
 */

import type { UserProfile } from '@/lib/types';
import type { ComputedScores, Pillar } from '@/lib/scoring/types';
import { tx3 } from '@/lib/i18n/locale';

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

const FOCUS_LABEL: Record<string, { es: string; en: string; pt: string }> = {
  fe: { es: 'fe', en: 'faith', pt: 'fé' },
  familia: { es: 'familia', en: 'family', pt: 'família' },
  proposito: { es: 'propósito', en: 'purpose', pt: 'propósito' },
  salud: { es: 'salud', en: 'health', pt: 'saúde' },
  libertad: { es: 'libertad', en: 'freedom', pt: 'liberdade' },
  oracion: { es: 'oración', en: 'prayer', pt: 'oração' },
  liderazgo: { es: 'liderazgo', en: 'leadership', pt: 'liderança' },
  perseverancia: { es: 'perseverancia', en: 'perseverance', pt: 'perseverança' },
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

function pillarCta(p: Pillar, lang: Lang): string {
  if (p === 'salvation') return tx3(lang, 'Open Devotional', 'Abrir Devocional', 'Abrir Devocional');
  if (p === 'health') return tx3(lang, 'Go to Health', 'Ir a Health', 'Ir a Health');
  return tx3(lang, 'Open Freedom', 'Abrir Freedom', 'Abrir Freedom');
}

function hourBucket(d = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

function coachOrPremium(_isPremium: boolean): string {
  return HREF.coach;
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
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
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
      ? tx(FOCUS_LABEL[focusKey].en, FOCUS_LABEL[focusKey].es, FOCUS_LABEL[focusKey].pt)
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
      text: tx(
        `${name}, a strong day starts with God. Devotional?`,
        `${name}, un día firme empieza con Dios. ¿Devocional?`,
        `${name}, um dia firme começa com Deus. Devocional?`
      ),
      pillar: 'salvation',
      href: HREF.devotional,
      cta: tx('Do Devotional', 'Hacer Devocional', 'Fazer Devocional'),
    });
  } else if (bucket === 'afternoon') {
    push({
      id: 'tod-afternoon',
      tone: 'nudge',
      text: tx(
        `${name}, midday: move your body or rehydrate.`,
        `${name}, mediodía: mueve el cuerpo o rehidrátate.`,
        `${name}, meio-dia: mova o corpo ou rehydrate.`
      ),
      pillar: 'health',
      href: HREF.health,
      cta: tx('Open Health', 'Abrir Health', 'Abrir Health'),
    });
  } else if (bucket === 'evening') {
    push({
      id: 'tod-evening',
      tone: 'motivate',
      text: tx(
        `${name}, close the day with consistency, not rush.`,
        `${name}, cierra el día con constancia, no con prisa.`,
        `${name}, feche o dia com constância, não com pressa.`
      ),
      href: HREF.calendar,
      cta: tx('Open agenda', 'Ver agenda', 'Ver agenda'),
    });
  } else {
    push({
      id: 'tod-night',
      tone: 'motivate',
      text: tx(
        `${name}, rest is discipline too. Sleep well.`,
        `${name}, el descanso también es disciplina. Duerme bien.`,
        `${name}, o descanso também é disciplina. Durma bem.`
      ),
      pillar: 'health',
      href: HREF.calendar,
      cta: tx('Plan sleep', 'Planificar sueño', 'Planejar sono'),
    });
  }

  // —— Scores ——
  if (global != null) {
    if (global >= 80) {
      push({
        id: 'score-high',
        tone: 'celebrate',
        text: tx(
          `${name}! Score ${global}. The Lion sees you steady today.`,
          `¡${name}! Score ${global}. El León te ve firme hoy.`,
          `${name}! Score ${global}. O Leão te vê firme hoje.`
        ),
        pillar: 'global',
        href: HREF.badges,
        cta: tx('See badges', 'Ver insignias', 'Ver insígnias'),
      });
    } else if (global < 35) {
      push({
        id: 'score-low',
        tone: 'nudge',
        text: tx(
          `${name}, score ${global}. One small step today is enough.`,
          `${name}, score ${global}. Un paso pequeño hoy basta.`,
          `${name}, score ${global}. Um passo pequeno hoje basta.`
        ),
        pillar: 'global',
        href: HREF.dashboard,
        cta: tx('Go to Hub', 'Ir al Hub', 'Ir ao Hub'),
      });
    } else {
      push({
        id: 'score-mid',
        tone: 'motivate',
        text: tx(
          `Score ${global}. You're on the way, ${name}. Keep going.`,
          `Score ${global}. Vas en camino, ${name}. No aflojes.`,
          `Score ${global}. Você está no caminho, ${name}. Não afrouxe.`
        ),
        pillar: 'global',
        href: HREF.dashboard,
        cta: tx('See scores', 'Ver scores', 'Ver scores'),
      });
    }
  }

  if (weakest && weakest.value < 40) {
    const p = pillarWord(weakest.key);
    push({
      id: 'weak-pillar',
      tone: 'nudge',
      text: tx(
        `${p} at ${Math.round(weakest.value)}. Your chance to grow.`,
        `${p} en ${Math.round(weakest.value)}. Es tu oportunidad de crecer.`,
        `${p} em ${Math.round(weakest.value)}. É a sua chance de crescer.`
      ),
      pillar: weakest.key,
      href: pillarHref(weakest.key),
      cta: pillarCta(weakest.key, lang),
    });
  }

  if (strongest && strongest.streak >= 3) {
    const p = pillarWord(strongest.key);
    push({
      id: 'streak-strong',
      tone: 'celebrate',
      text: tx(
        `${p} streak: ${strongest.streak} days. Guard it, ${name}!`,
        `Racha ${p}: ${strongest.streak} días. ¡Protégela, ${name}!`,
        `Sequência ${p}: ${strongest.streak} dias. Proteja-a, ${name}!`
      ),
      pillar: strongest.key,
      href: pillarHref(strongest.key),
      cta: tx('Keep the streak', 'Seguir la racha', 'Seguir a sequência'),
    });
  }

  // —— Missing daily actions ——
  if (!didDevotional) {
    push({
      id: 'act-devo',
      tone: 'nudge',
      text: tx(
        `${name}, the Lion waits in today's Devotional.`,
        `${name}, el León te espera en el Devocional de hoy.`,
        `${name}, o Leão te espera no Devocional de hoje.`
      ),
      pillar: 'salvation',
      href: HREF.devotional,
      cta: tx('Do Devotional', 'Hacer Devocional', 'Fazer Devocional'),
    });
  }
  if (!didBible && !didDevotional) {
    push({
      id: 'act-bible',
      tone: 'focus',
      text: tx(
        `One Bible chapter aligns the day. Shall we read?`,
        `Un capítulo de la Biblia alinea el día. ¿Leemos?`,
        `Um capítulo da Bíblia alinha o dia. Vamos ler?`
      ),
      pillar: 'salvation',
      href: HREF.bible,
      cta: tx('Open Bible', 'Abrir Biblia', 'Abrir Bíblia'),
    });
  }
  if (!didPray) {
    push({
      id: 'act-pray',
      tone: 'focus',
      text: tx(
        `5 minutes of prayer. Faith first, ${name}.`,
        `5 minutos de oración. Fe primero, ${name}.`,
        `5 minutos de oração. Fé primeiro, ${name}.`
      ),
      pillar: 'salvation',
      href: HREF.devotional,
      cta: tx('Pray now', 'Orar ahora', 'Orar agora'),
    });
  }
  if (!didMovement) {
    push({
      id: 'act-move',
      tone: 'nudge',
      text: tx(
        `Your body is a temple. 15 min of movement today.`,
        `Tu cuerpo es templo. 15 min de movimiento hoy.`,
        `O seu corpo é templo. 15 min de movimento hoje.`
      ),
      pillar: 'health',
      href: HREF.health,
      cta: tx('Log movement', 'Registrar movimiento', 'Registrar movimento'),
    });
  }
  if (!didHydration) {
    push({
      id: 'act-hydro',
      tone: 'nudge',
      text: tx(
        `Hydration: one glass now counts for Health.`,
        `Hidratación: un vaso ahora cuenta para Health.`,
        `Hidratação: um copo agora conta para Health.`
      ),
      pillar: 'health',
      href: HREF.health,
      cta: tx('Log hydration', 'Ir a hidratación', 'Ir à hidratação'),
    });
  }
  if (!didLearn) {
    push({
      id: 'act-learn',
      tone: 'nudge',
      text: tx(
        `Freedom grows with one short article or video.`,
        `Freedom crece con un artículo o video corto.`,
        `Freedom cresce com um artigo ou vídeo curto.`
      ),
      pillar: 'freedom',
      href: HREF.freedomLearn,
      cta: tx('Read articles', 'Leer artículos', 'Ler artigos'),
    });
  }
  if (!didConnect && family) {
    push({
      id: 'act-family',
      tone: 'focus',
      text: tx(
        `${name}, connect with family or Phalanx today.`,
        `${name}, conecta con tu familia o Phalanx hoy.`,
        `${name}, conecte-se com a família ou a Phalanx hoje.`
      ),
      pillar: 'freedom',
      href: HREF.freedomConnect,
      cta: tx('Connect', 'Conectar', 'Conectar'),
    });
  }

  // —— Focus / goals ——
  if (focusLabel) {
    let href: string = HREF.dashboard;
    let cta = tx('Act now', 'Actuar ahora', 'Agir agora');
    if (focusKey === 'fe' || focusKey === 'oracion') {
      href = HREF.devotional;
      cta = tx('Devotional', 'Devocional', 'Devocional');
    } else if (focusKey === 'salud') {
      href = HREF.health;
      cta = tx('Open Health', 'Abrir Health', 'Abrir Health');
    } else if (focusKey === 'libertad' || focusKey === 'proposito' || focusKey === 'liderazgo') {
      href = HREF.freedomLearn;
      cta = tx('Open Freedom', 'Abrir Freedom', 'Abrir Freedom');
    } else if (focusKey === 'familia') {
      href = HREF.freedomConnect;
      cta = tx('Connect', 'Conectar', 'Conectar');
    } else if (focusKey === 'perseverancia') {
      href = HREF.calendar;
      cta = tx('Open agenda', 'Ver agenda', 'Ver agenda');
    }
    push({
      id: 'focus-main',
      tone: 'focus',
      text: tx(
        `Your focus is ${focusLabel}. One concrete act today.`,
        `Tu foco es ${focusLabel}. Un acto concreto hoy.`,
        `O seu foco é ${focusLabel}. Um ato concreto hoje.`
      ),
      href,
      cta,
    });
  }
  if (focus.includes('libertad') || focus.includes('proposito')) {
    push({
      id: 'focus-freedom',
      tone: 'motivate',
      text: tx(
        `Freedom with virtue: learn and contribute, don't only consume.`,
        `Libertad con virtud: aprende y aporta, no solo consumas.`,
        `Liberdade com virtude: aprenda e contribua, não só consuma.`
      ),
      pillar: 'freedom',
      href: HREF.freedomContribute,
      cta: tx('Contribute', 'Aportar', 'Contribuir'),
    });
  }
  if (focus.includes('salud')) {
    push({
      id: 'focus-health',
      tone: 'motivate',
      text: tx(
        `Health is daily discipline. Sleep, water, movement.`,
        `Salud es disciplina diaria. Sueño, agua, movimiento.`,
        `Saúde é disciplina diária. Sono, água, movimento.`
      ),
      pillar: 'health',
      href: HREF.health,
      cta: tx('Open Health', 'Abrir Health', 'Abrir Health'),
    });
  }
  if (focus.includes('fe') || focus.includes('oracion')) {
    push({
      id: 'focus-faith',
      tone: 'motivate',
      text: tx(
        `Faith and prayer can't be outsourced. The Lion walks with you.`,
        `Fe y oración no se delegan. El León camina contigo.`,
        `Fé e oração não se delegam. O Leão caminha com você.`
      ),
      pillar: 'salvation',
      href: HREF.devotional,
      cta: tx('Pray / Devotional', 'Orar / Devocional', 'Orar / Devocional'),
    });
  }

  // —— Pillar-specific scores ——
  if (salvation != null && salvation >= 70) {
    push({
      id: 'sal-good',
      tone: 'celebrate',
      text: tx(
        `Salvation ${salvation}. Spirit steady today, ${name}.`,
        `Salvation ${salvation}. Espíritu firme hoy, ${name}.`,
        `Salvation ${salvation}. Espírito firme hoje, ${name}.`
      ),
      pillar: 'salvation',
      href: HREF.bible,
      cta: tx('Keep reading Bible', 'Seguir en Biblia', 'Continuar na Bíblia'),
    });
  }
  if (health != null && health < 30) {
    push({
      id: 'hea-low',
      tone: 'nudge',
      text: tx(
        `Health ${health}. The body needs real attention.`,
        `Health ${health}. El cuerpo pide atención real.`,
        `Health ${health}. O corpo pede atenção real.`
      ),
      pillar: 'health',
      href: HREF.health,
      cta: tx('Care for body', 'Cuidar el cuerpo', 'Cuidar do corpo'),
    });
  }
  if (freedom != null && freedom < 30) {
    push({
      id: 'fre-low',
      tone: 'nudge',
      text: tx(
        `Freedom ${freedom}. Read, connect, or contribute something useful.`,
        `Freedom ${freedom}. Lee, conecta o aporta algo útil.`,
        `Freedom ${freedom}. Leia, conecte ou contribua com algo útil.`
      ),
      pillar: 'freedom',
      href: HREF.freedomLearn,
      cta: tx('Open Freedom', 'Abrir Freedom', 'Abrir Freedom'),
    });
  }

  // —— Purpose ——
  if (profile?.purpose?.trim()) {
    const purposeShort = profile.purpose.trim().slice(0, 36);
    push({
      id: 'purpose',
      tone: 'focus',
      text: tx(
        `Your purpose: “${purposeShort}${profile.purpose.length > 36 ? '…' : ''}”. One step today.`,
        `Tu propósito: “${purposeShort}${profile.purpose.length > 36 ? '…' : ''}”. Un paso hoy.`,
        `O seu propósito: “${purposeShort}${profile.purpose.length > 36 ? '…' : ''}”. Um passo hoje.`
      ),
      href: HREF.dashboard,
      cta: tx('One step today', 'Un paso hoy', 'Um passo hoje'),
    });
  }

  // —— Premium / coach ——
  if (!isPremium) {
    push({
      id: 'prem-ai',
      tone: 'premium',
      text: tx(
        `Free includes limited AI. Talk with the Lion today.`,
        `Free incluye IA limitada. Habla con el León hoy.`,
        `O Free inclui IA limitada. Fale com o Leão hoje.`
      ),
      href: HREF.coach,
      cta: tx('Talk now', 'Hablar ahora', 'Falar agora'),
    });
    push({
      id: 'prem-voice',
      tone: 'premium',
      text: tx(
        `Unlimited AI + Lion voice → Premium.`,
        `IA ilimitada + voz del León → Premium.`,
        `IA ilimitada + voz do Leão → Premium.`
      ),
      href: HREF.premium,
      cta: tx('Upgrade plan', 'Mejorar plan', 'Melhorar plano'),
    });
  } else {
    push({
      id: 'prem-active',
      tone: 'motivate',
      text: tx(
        `${name}, Premium active. Use the Lion: talk and act.`,
        `${name}, Premium activo. Usa al León: habla y actúa.`,
        `${name}, Premium ativo. Use o Leão: fale e aja.`
      ),
      href: HREF.coach,
      cta: tx('Talk to the Lion', 'Hablar con el León', 'Falar com o Leão'),
    });
  }

  // —— Always-on ——
  push({
    id: 'always-1',
    tone: 'motivate',
    text: tx(
      `Virtue + consistency. Salvation · Health · Freedom.`,
      `Virtud + constancia. Salvation · Health · Freedom.`,
      `Virtude + constância. Salvation · Health · Freedom.`
    ),
    href: HREF.dashboard,
    cta: tx('Open Hub', 'Ver Hub', 'Ver Hub'),
  });
  push({
    id: 'always-2',
    tone: 'motivate',
    text: tx(
      `${name}, you're not a spectator. You're a Green Lion King.`,
      `${name}, no eres espectador. Eres Green Lion King.`,
      `${name}, você não é espectador. Você é Green Lion King.`
    ),
    href: coachHref,
    cta: tx('Talk now', 'Hablar ahora', 'Falar agora'),
  });
  push({
    id: 'always-3',
    tone: 'motivate',
    text: tx(
      `The phalanx is built one day at a time.`,
      `La phalanx se construye un día a la vez.`,
      `A phalanx se constrói um dia de cada vez.`
    ),
    href: HREF.freedomConnect,
    cta: tx('Invite / connect', 'Invitar / conectar', 'Convidar / conectar'),
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
