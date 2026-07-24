import { UserProfile } from '@/lib/types';
import { ComputedScores, Pillar } from '@/lib/scoring/types';
import { calculateAge, getLifeStage, getLifeStageLabel, LifeStage } from '@/lib/store/profile';
import { getPointsForAction } from '@/lib/scoring/engine';

export interface CoachMessage {
  id: string;
  tone: 'encourage' | 'discipline' | 'challenge' | 'celebrate';
  title: string;
  body: string;
  recommendedAction?: {
    type: string;
    label: string;
    pillar: Pillar;
    points: number;
  };
  pillarFocus?: Pillar;
}

/**
 * León Verde — Coach de Virtud y Desarrollo Integral
 * Personaliza mensajes y recomendaciones según edad / etapa de vida.
 *
 * Etapas:
 * - infancia (0-12)
 * - juventud (13-17)
 * - young_adult (18-29)
 * - adult (30-49)
 * - mature (50-64)
 * - senior (65+)
 */
export function generateCoachGuidance(
  profile: Partial<UserProfile>,
  scores: ComputedScores
): CoachMessage {
  const name = profile.name?.split(' ')[0] || 'Hermano';
  const age = profile.birthDate ? calculateAge(profile.birthDate) : null;
  const stage = getLifeStage(age);
  const stageLabel = getLifeStageLabel(stage);
  const { salvation, health, freedom, global, streaks, todayActions } = scores;

  const pillars: { key: Pillar; value: number; streak: number }[] = [
    { key: 'salvation', value: salvation, streak: streaks.salvation },
    { key: 'health', value: health, streak: streaks.health },
    { key: 'freedom', value: freedom, streak: streaks.freedom }
  ];
  pillars.sort((a, b) => a.value - b.value);
  const weakest = pillars[0];
  const strongest = pillars[pillars.length - 1];

  const didDevotional = todayActions.some(a => a.type === 'devotional_complete');
  const didBible = todayActions.some(a => a.type === 'bible_chapter' || a.type === 'bible_study_15min');
  const didMovement = todayActions.some(a => a.type === 'hit_15min' || a.type === 'outdoor_sun_20min');
  const didLearn = todayActions.some(a => a.type.startsWith('learn_') || a.type === 'debate_participate');

  // ========== CELEBRATE ==========
  if (global >= 85 && strongest.streak >= 7) {
    return {
      id: 'celebrate-high',
      tone: 'celebrate',
      title: celebrateTitle(name, stage),
      body: celebrateBody(name, stage, global, strongest.streak, strongest.key),
      pillarFocus: strongest.key
    };
  }

  // ========== DISCIPLINE ==========
  if (weakest.value < 30) {
    const rec = recommendForPillar(weakest.key, stage, { didDevotional, didBible, didMovement, didLearn });
    return {
      id: 'discipline-low',
      tone: 'discipline',
      title: disciplineTitle(name, stage),
      body: disciplineBody(name, stage, weakest.key, weakest.value),
      recommendedAction: rec,
      pillarFocus: weakest.key
    };
  }

  // ========== CHALLENGE ==========
  if (global >= 50 && global < 85) {
    const rec = recommendForPillar(weakest.key, stage, { didDevotional, didBible, didMovement, didLearn });
    return {
      id: 'challenge-mid',
      tone: 'challenge',
      title: challengeTitle(name, stage),
      body: challengeBody(name, stage, global, weakest.key),
      recommendedAction: rec,
      pillarFocus: weakest.key
    };
  }

  // ========== ENCOURAGE — prioriza Devocional ==========
  if (!didDevotional) {
    return {
      id: 'encourage-devotional',
      tone: 'encourage',
      title: encourageTitle(name, stage),
      body: encourageBody(name, stage),
      recommendedAction: {
        type: 'devotional_complete',
        label: stage === 'infancia' || stage === 'juventud'
          ? 'Completar Devocional (con guía)'
          : 'Completar Devocional del día',
        pillar: 'salvation',
        points: getPointsForAction('devotional_complete', stage)
      },
      pillarFocus: 'salvation'
    };
  }

  // Default
  const rec = recommendForPillar(weakest.key, stage, { didDevotional, didBible, didMovement, didLearn });
  return {
    id: 'default-guide',
    tone: 'encourage',
    title: `El León camina contigo, ${name}`,
    body: defaultBody(stage, weakest.key, stageLabel),
    recommendedAction: rec,
    pillarFocus: weakest.key
  };
}

// ─── Textos por etapa ───────────────────────────────────────────

function celebrateTitle(name: string, stage: LifeStage): string {
  if (stage === 'infancia') return `${name}, ¡el León está orgulloso!`;
  if (stage === 'juventud') return `${name}, vas por buen camino`;
  if (stage === 'senior') return `${name}, tu constancia es legado`;
  return `${name}, el León te ve firme`;
}

function celebrateBody(name: string, stage: LifeStage, global: number, streak: number, pillar: Pillar): string {
  const p = labelPillar(pillar);
  if (stage === 'infancia') {
    return `Score ${global}. Llevas ${streak} días siendo constante en ${p}. Dios se alegra cuando los niños caminan con Él. ¡Sigue así!`;
  }
  if (stage === 'juventud') {
    return `Score ${global}. ${streak} días de constancia en ${p}. En la juventud se decide el rumbo de toda una vida. Estás eligiendo bien. No aflojes.`;
  }
  if (stage === 'young_adult') {
    return `Score ${global}. ${streak} días firmes en ${p}. Esta es la década donde se construye el carácter que te sostendrá. Sigue.`;
  }
  if (stage === 'adult' || stage === 'mature') {
    return `Score ${global}. ${streak} días de constancia en ${p}. Tu ejemplo está formando a tu familia y a quienes te observan. La phalanx se construye así.`;
  }
  return `Score ${global}. ${streak} días de fidelidad en ${p}. Tu perseverancia es un testimonio vivo. El León te honra.`;
}

function disciplineTitle(name: string, stage: LifeStage): string {
  if (stage === 'infancia') return `${name}, el León te llama a ordenarte`;
  if (stage === 'juventud') return `${name}, despierta ahora`;
  return `${name}, despierta`;
}

function disciplineBody(name: string, stage: LifeStage, pillar: Pillar, value: number): string {
  const p = labelPillar(pillar);
  if (stage === 'infancia') {
    return `Tu ${p} está bajo (${value}). El León te quiere fuerte y ordenado. Pide ayuda a tus padres o a un adulto de confianza y haz una sola cosa buena hoy.`;
  }
  if (stage === 'juventud') {
    return `Tu ${p} está en ${value}. En la juventud es fácil distraerse. El León no te suelta: elige hoy una acción y cúmplela. El carácter se forja ahora.`;
  }
  if (stage === 'senior') {
    return `Tu ${p} está en ${value}. La disciplina no se retira con los años. Una decisión sencilla hoy mantiene tu dignidad y tu testimonio.`;
  }
  return `Tu ${p} está en ${value}. El León no adula: te confronta. La mediocridad es el enemigo silencioso. Hoy elige una sola acción y ejecútala.`;
}

function challengeTitle(name: string, stage: LifeStage): string {
  if (stage === 'infancia') return `${name}, el León te reta con amor`;
  if (stage === 'juventud') return `${name}, ¿aceptas el reto?`;
  return `El León te reta, ${name}`;
}

function challengeBody(name: string, stage: LifeStage, global: number, pillar: Pillar): string {
  const p = labelPillar(pillar);
  if (stage === 'infancia') {
    return `Vas bien (${global}). Todavía puedes crecer más en ${p}. El León cree en ti. ¿Haces una acción más hoy?`;
  }
  if (stage === 'juventud') {
    return `Vas bien (${global}), pero tu ${p} puede subir. La juventud es el momento de entrenar la voluntad. Un acto de disciplina ahora cambia el día.`;
  }
  if (stage === 'young_adult') {
    return `Vas bien (${global}). Tu ${p} es el eslabón más débil. Esta etapa define hábitos para décadas. ¿Aceptas el reto?`;
  }
  return `Vas bien (${global}), pero aún no estás en tu mejor versión. Tu ${p} necesita atención. Un solo acto de disciplina ahora cambia el día.`;
}

function encourageTitle(name: string, stage: LifeStage): string {
  if (stage === 'infancia') return `${name}, empieza con Dios`;
  if (stage === 'juventud') return `${name}, pon primero lo eterno`;
  return `${name}, empieza por lo eterno`;
}

function encourageBody(name: string, stage: LifeStage): string {
  if (stage === 'infancia') {
    return `Antes de jugar o estudiar: habla con Dios y lee un poquito de Su Palabra. El León te acompaña. Cuando pones a Dios primero, todo lo demás se ordena.`;
  }
  if (stage === 'juventud') {
    return `Antes que las pantallas y las prisas: abre la Escritura y completa tu Devocional. En la juventud se decide a quién sirves. El León te espera en la Palabra.`;
  }
  if (stage === 'young_adult') {
    return `Antes de cualquier otra cosa: Devocional. En esta etapa se forja el carácter que llevarás décadas. El León te espera en la oración y en la Escritura.`;
  }
  if (stage === 'adult' || stage === 'mature') {
    return `Antes de cualquier otra cosa: Devocional. Tu ejemplo impacta a tu familia y a los que te siguen. El espíritu primero; después salud, propósito y libertad.`;
  }
  return `Antes de cualquier otra cosa: Devocional. Tu sabiduría y constancia son un legado vivo. El León te espera en la Palabra.`;
}

function defaultBody(stage: LifeStage, pillar: Pillar, stageLabel: string): string {
  const p = labelPillar(pillar);
  if (stage === 'infancia') {
    return `Hoy tu ${p} necesita un poco de atención. Da un paso pequeño y bueno. El León camina contigo.`;
  }
  if (stage === 'juventud') {
    return `Hoy tu ${p} necesita disciplina. La virtud se entrena como un músculo. Da el siguiente paso ahora.`;
  }
  return `Hoy tu ${p} necesita atención (${stageLabel}). La virtud no es un sentimiento: es una decisión repetida. Da el siguiente paso ahora.`;
}

// ─── Recomendaciones adaptadas por edad ─────────────────────────

function recommendForPillar(
  pillar: Pillar,
  stage: LifeStage,
  flags: { didDevotional: boolean; didBible: boolean; didMovement: boolean; didLearn: boolean }
) {
  const pts = (type: string) => getPointsForAction(type, stage);
  if (pillar === 'salvation') {
    if (!flags.didDevotional) {
      return {
        type: 'devotional_complete',
        label: stage === 'infancia' ? 'Devocional (con ayuda)' : 'Completar Devocional del día',
        pillar: 'salvation' as Pillar,
        points: pts('devotional_complete')
      };
    }
    if (!flags.didBible) {
      return {
        type: 'bible_chapter',
        label: stage === 'infancia' ? 'Leer un pasaje corto de la Biblia' : 'Leer 1 capítulo de la Biblia',
        pillar: 'salvation' as Pillar,
        points: pts('bible_chapter')
      };
    }
    return {
      type: 'pray_5min',
      label: stage === 'infancia' ? 'Orar con alguien de tu familia' : 'Orar ≥ 5 minutos',
      pillar: 'salvation' as Pillar,
      points: pts('pray_5min')
    };
  }

  if (pillar === 'health') {
    // Intensidad adaptada por edad
    if (stage === 'infancia') {
      return {
        type: 'outdoor_sun_20min',
        label: 'Jugar / estar al aire libre y al sol',
        pillar: 'health' as Pillar,
        points: pts('outdoor_sun_20min')
      };
    }
    if (stage === 'juventud') {
      if (!flags.didMovement) {
        return {
          type: 'hit_15min',
          label: 'Moverte con intensidad ≥ 15 min (deporte)',
          pillar: 'health' as Pillar,
          points: pts('hit_15min')
        };
      }
      return {
        type: 'outdoor_sun_20min',
        label: 'Salir al aire libre ≥ 20 min',
        pillar: 'health' as Pillar,
        points: pts('outdoor_sun_20min')
      };
    }
    if (stage === 'senior') {
      return {
        type: 'outdoor_sun_20min',
        label: 'Caminar al aire libre / sol ≥ 20 min',
        pillar: 'health' as Pillar,
        points: pts('outdoor_sun_20min')
      };
    }
    // adult / young_adult / mature
    if (!flags.didMovement) {
      return {
        type: 'hit_15min',
        label: 'HIT / entrenamiento ≥ 15 min',
        pillar: 'health' as Pillar,
        points: pts('hit_15min')
      };
    }
    return {
      type: 'sleep_ideal',
      label: 'Cuidar el sueño (ventana circadiana)',
      pillar: 'health' as Pillar,
      points: pts('sleep_ideal')
    };
  }

  // freedom
  if (stage === 'infancia') {
    return {
      type: 'connect_real',
      label: 'Tiempo de calidad con familia',
      pillar: 'freedom' as Pillar,
      points: pts('connect_real')
    };
  }
  if (stage === 'juventud') {
    if (!flags.didLearn) {
      return {
        type: 'learn_article_video',
        label: 'Aprender algo útil (video/artículo corto)',
        pillar: 'freedom' as Pillar,
        points: pts('learn_article_video')
      };
    }
    return {
      type: 'connect_real',
      label: 'Conectar con familia o comunidad de fe',
      pillar: 'freedom' as Pillar,
      points: pts('connect_real')
    };
  }
  if (!flags.didLearn) {
    return {
      type: 'learn_article_video',
      label: 'Artículo o video corto',
      pillar: 'freedom' as Pillar,
      points: pts('learn_article_video')
    };
  }
  return {
    type: 'connect_real',
    label: 'Conexión real (familia/iglesia)',
    pillar: 'freedom' as Pillar,
    points: pts('connect_real')
  };
}

function labelPillar(p: Pillar): string {
  const map = { salvation: 'Salvation', health: 'Health', freedom: 'Freedom' };
  return map[p];
}

/** Mensaje corto del León */
export function getLionShortNudge(pillar?: Pillar, stage?: LifeStage): string {
  if (stage === 'infancia') {
    return 'El León te cuida. Pon a Dios primero hoy y sé obediente y alegre.';
  }
  if (stage === 'juventud') {
    return pillar === 'salvation'
      ? 'En la juventud se decide el rumbo. El León te llama a la Palabra y a la oración.'
      : 'Virtud y disciplina ahora construyen la libertad de mañana.';
  }
  const nudges = {
    salvation: 'El León te recuerda: sin Palabra y oración, todo lo demás se debilita.',
    health: 'Tu cuerpo es templo. El León no acepta negligencia con el templo.',
    freedom: 'La verdadera libertad se construye con aprendizaje y aporte, no con consumo pasivo.',
    default: 'Virtud. Constancia. Excelencia. El León no negocia estos tres.'
  };
  return pillar ? nudges[pillar] : nudges.default;
}
