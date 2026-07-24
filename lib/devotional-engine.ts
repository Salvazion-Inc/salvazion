import { UserProfile, Devotional, Language } from './types';
import { DEVOTIONALS_LIBRARY, DEVOTIONALS_EN } from '@/data/devotionals-library';

/**
 * Motor de personalización de Devocionales Salvazion
 * 
 * En esta fase: motor inteligente basado en reglas + matching de tags
 * (preparado para ser reemplazado o aumentado por un LLM real en producción).
 * 
 * Lógica:
 * 1. Selecciona la biblioteca según idioma
 * 2. Calcula score de relevancia por tags + madurez + estado familiar
 * 3. Elige el mejor match del día (determinista por fecha para consistencia)
 * 4. Personaliza el texto con el nombre del usuario
 * 5. Ajusta puntos según madurez (líderes reciben ligeramente más responsabilidad)
 */

function getDaySeed(date: string): number {
  // Seed determinista por fecha para que el mismo día siempre devuelva el mismo devocional
  const d = new Date(date);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function scoreMatch(
  itemTags: string[],
  profile: UserProfile
): number {
  let score = 0;

  // Matching directo de focus
  for (const focus of profile.currentFocus) {
    if (itemTags.includes(focus)) score += 10;
  }

  // Bonus por madurez
  if (profile.spiritualMaturity === 'leader' && itemTags.includes('liderazgo')) score += 8;
  if (profile.spiritualMaturity === 'new' && itemTags.includes('fe')) score += 6;
  if (profile.spiritualMaturity === 'growing' && itemTags.includes('perseverancia')) score += 5;

  // Bonus familiar
  if (
    (profile.familyStatus === 'parent' || profile.familyStatus === 'married' || profile.familyStatus === 'family') &&
    itemTags.includes('familia')
  ) {
    score += 12;
  }

  // Bonus por struggles
  if (profile.struggles) {
    for (const s of profile.struggles) {
      if (itemTags.includes(s)) score += 7;
    }
  }

  return score;
}

function personalizeText(text: string, name: string, language: Language): string {
  if (!name) return text;

  // Pequeños toques de personalización
  if (language === 'es') {
    return text
      .replace(/\btú\b/gi, name)
      .replace(/\bTu\b/g, name) // cuidado con mayúsculas
      .replace(/hoy elige/gi, `${name}, hoy elige`)
      .replace(/eres llamado/gi, `${name}, eres llamado`);
  } else {
    return text
      .replace(/\byou\b/gi, name)
      .replace(/Today choose/gi, `${name}, today choose`);
  }
}

export function generateDevotional(
  profile: UserProfile,
  date: string = new Date().toISOString().slice(0, 10)
): Devotional {
  const library = profile.language === 'en' ? DEVOTIONALS_EN : DEVOTIONALS_LIBRARY;

  // Calcular scores
  const scored = library.map((item, index) => ({
    item,
    index,
    score: scoreMatch(item.tags, profile)
  }));

  // Ordenar por score descendente
  scored.sort((a, b) => b.score - a.score);

  // Si hay empates, usar el seed del día para elegir de forma estable
  const topScore = scored[0].score;
  const topCandidates = scored.filter(s => s.score === topScore || s.score >= topScore - 5);

  const seed = getDaySeed(date);
  const chosen = topCandidates[seed % topCandidates.length];

  const base = chosen.item;

  // Personalizar
  const reflection = personalizeText(base.reflection, profile.name, profile.language);
  const prayer = personalizeText(base.prayer, profile.name, profile.language);

  // Ajuste de puntos por madurez (más responsabilidad = ligeramente más peso)
  let points = base.points;
  if (profile.spiritualMaturity === 'leader') points += 3;
  if (profile.spiritualMaturity === 'mature') points += 1;

  return {
    id: `dev-${date}-${chosen.index}`,
    date,
    title: base.title,
    scripture: base.scripture,
    reflection,
    prayer,
    action: base.action,
    tags: base.tags,
    points,
    personalizedFor: profile.name
  };
}

/**
 * Genera un prompt listo para un LLM real (cuando se conecte OpenAI / Grok / Claude)
 * Úsalo en el futuro para reemplazar o enriquecer el motor de reglas.
 */
export function buildLLMPrompt(profile: UserProfile, date: string): string {
  return `
Eres el motor de Devocionales de Salvazion.
Genera un devocional personalizado, profundo, bíblico y alineado con la cultura cristiano-occidental y el bio-conservadurismo.

Usuario:
- Nombre: ${profile.name}
- Idioma: ${profile.language}
- Madurez espiritual: ${profile.spiritualMaturity}
- Situación familiar: ${profile.familyStatus}
- Enfoque actual: ${profile.currentFocus.join(', ')}
- Luchas: ${profile.struggles?.join(', ') || 'ninguna especificada'}

Requisitos:
1. Título potente y corto.
2. Un versículo (Reina Valera 1960 si ES, KJV si EN) con referencia exacta.
3. Reflexión de 80-120 palabras que hable directamente a la situación del usuario, defendiendo fe, familia, propósito, salud o libertad según corresponda.
4. Oración de 40-60 palabras.
5. Una acción concreta y realizable hoy.
6. Tags relevantes.
7. Tono: firme, esperanzador, sin tibieza, sin lenguaje woke.

Fecha: ${date}

Responde SOLO en JSON con esta estructura:
{
  "title": "",
  "scripture": { "reference": "", "text": "", "version": "" },
  "reflection": "",
  "prayer": "",
  "action": "",
  "tags": [],
  "points": 18
}
`.trim();
}
