import { UserProfile, Devotional, Language, Scripture } from './types';
import { DEVOTIONALS_LIBRARY, DEVOTIONALS_EN } from '@/data/devotionals-library';
import { getXaiClient, getXaiModel, isXaiConfigured } from '@/lib/ai/xai';
import { calculateAge, getLifeStage, getLifeStageLabel } from '@/lib/store/profile';

/**
 * Motor de Devocionales Salvazion
 *
 * 1) Prefer AI when configured — personalizado, extenso, bíblico
 * 2) Fallback: biblioteca + reglas si no hay XAI_API_KEY o falla la API
 *
 * Identidad: Cultura Cristiano-Occidental, BioConservadurismo,
 * virtud y desarrollo espiritual. Sin tibieza ni lenguaje secular woke.
 */

function getDaySeed(date: string): number {
  const d = new Date(date);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function scoreMatch(itemTags: string[], profile: UserProfile): number {
  let score = 0;
  for (const focus of profile.currentFocus) {
    if (itemTags.includes(focus)) score += 10;
  }
  if (profile.spiritualMaturity === 'leader' && itemTags.includes('liderazgo')) score += 8;
  if (profile.spiritualMaturity === 'new' && itemTags.includes('fe')) score += 6;
  if (profile.spiritualMaturity === 'growing' && itemTags.includes('perseverancia')) score += 5;
  if (
    (profile.familyStatus === 'parent' ||
      profile.familyStatus === 'married' ||
      profile.familyStatus === 'family') &&
    itemTags.includes('familia')
  ) {
    score += 12;
  }
  if (profile.struggles) {
    for (const s of profile.struggles) {
      if (itemTags.includes(s)) score += 7;
    }
  }
  return score;
}

function personalizeText(text: string, name: string, language: Language): string {
  if (!name) return text;
  if (language === 'es') {
    return text
      .replace(/\btú\b/gi, name)
      .replace(/hoy elige/gi, `${name}, hoy elige`)
      .replace(/eres llamado/gi, `${name}, eres llamado`);
  }
  return text
    .replace(/\byou\b/gi, name)
    .replace(/Today choose/gi, `${name}, today choose`);
}

export function generateDevotionalRules(
  profile: UserProfile,
  date: string = new Date().toISOString().slice(0, 10)
): Devotional {
  const library = profile.language === 'en' ? DEVOTIONALS_EN : DEVOTIONALS_LIBRARY;
  const scored = library.map((item, index) => ({
    item,
    index,
    score: scoreMatch(item.tags, profile),
  }));
  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  const topCandidates = scored.filter((s) => s.score === topScore || s.score >= topScore - 5);
  const seed = getDaySeed(date);
  const chosen = topCandidates[seed % topCandidates.length];
  const base = chosen.item;

  let points = base.points;
  if (profile.spiritualMaturity === 'leader') points += 3;
  if (profile.spiritualMaturity === 'mature') points += 1;

  return {
    id: `dev-${date}-rules-${chosen.index}`,
    date,
    title: base.title,
    scripture: base.scripture,
    reflection: personalizeText(base.reflection, profile.name, profile.language),
    prayer: personalizeText(base.prayer, profile.name, profile.language),
    action: base.action,
    virtue: profile.language === 'en' ? 'Faithfulness' : 'Fidelidad',
    closing:
      profile.language === 'en'
        ? `${profile.name || 'Brother'}, stand firm. Defend faith, family and freedom today.`
        : `${profile.name || 'Hermano'}, mantente firme. Defiende la fe, la familia y la libertad hoy.`,
    tags: base.tags,
    points,
    personalizedFor: profile.name,
    source: 'rules',
  };
}

/** @deprecated use generateDevotionalAsync — sync alias for rules engine */
export function generateDevotional(
  profile: UserProfile,
  date?: string
): Devotional {
  return generateDevotionalRules(profile, date);
}

export function buildLLMSystemPrompt(language: Language): string {
  if (language === 'en') {
    return `You are the Devotional Engine of Salvazion — powered by Salvazion AI for Western Christian Civilization.

MISSION:
- Produce a deep, biblical, personalized daily devotional.
- Always defend Western Christian Culture, the traditional family, ordered liberty, and BioConservatism (life, body stewardship, rejection of ideologies that dissolve nature, sex, and family).
- Strengthen virtue (faith, hope, charity, fortitude, temperance, prudence, justice) and spiritual growth.
- Base every claim on Scripture. Use the King James Version (KJV) for English.

TONE:
- Firm, hopeful, fatherly and clear. No lukewarmness. No progressive/woke framing.
- Speak to the person by name. Address their maturity, family situation, purpose and struggles.
- Long enough to form the soul: substantial reflection (not a tweet).

OUTPUT:
- Respond ONLY with valid JSON (no markdown fences). Match the schema the user provides.`;
  }

  return `Eres el Motor de Devocionales de Salvazion — impulsado por Salvazion AI para la Civilización Cristiana Occidental.

MISIÓN:
- Generar un devocional diario profundo, bíblico y personalizado.
- Defender siempre la Cultura Cristiano-Occidental, la familia tradicional, la libertad ordenada y el BioConservadurismo (vida, mayordomía del cuerpo, rechazo de ideologías que disuelven la naturaleza, el sexo y la familia).
- Potenciar la virtud (fe, esperanza, caridad, fortaleza, templanza, prudencia, justicia) y el desarrollo espiritual.
- Fundamentar todo en la Escritura. Usa Reina Valera (estilo clásico / RV) en español.

TONO:
- Firme, esperanzador, paternal y claro. Sin tibieza. Sin marco progresista/woke.
- Habla a la persona por su nombre. Atiende madurez, familia, propósito y luchas.
- Extenso y formativo: reflexión sustancial (no un hilo corto).

SALIDA:
- Responde SOLO con JSON válido (sin bloques markdown). Cumple el schema que te da el usuario.`;
}

export function buildLLMUserPrompt(profile: UserProfile, date: string): string {
  const age = profile.birthDate ? calculateAge(profile.birthDate) : null;
  const stage = getLifeStage(age);
  const stageLabel = getLifeStageLabel(stage, profile.language);
  const lang =
    profile.language === 'es' ? 'es' : profile.language === 'pt' ? 'pt' : 'en';
  const bible =
    profile.preferredBibleVersion === 'arc' || lang === 'pt'
      ? 'Almeida Revista e Corrigida (ARC)'
      : profile.preferredBibleVersion === 'kjv' || lang === 'en'
        ? 'King James Version (KJV)'
        : 'Reina Valera (clásica / estilo RV1909-RV1960)';

  if (lang === 'en') {
    return `Generate TODAY's personalized Salvazion devotional.

DATE: ${date}

USER PROFILE:
- Name: ${profile.name || 'Brother'}
- Language: English
- Age / life stage: ${age ?? 'unknown'} / ${stageLabel}
- Spiritual maturity: ${profile.spiritualMaturity}
- Family status: ${profile.familyStatus}
- Life purpose: ${profile.purpose || 'not specified'}
- City / country: ${profile.city || '—'} / ${profile.country || '—'}
- Current focus: ${(profile.currentFocus || []).join(', ') || 'faith, family'}
- Struggles: ${(profile.struggles || []).join(', ') || 'none specified'}
- Preferred Bible: ${bible}

REQUIRED STRUCTURE (richer / longer than a short card):
1. title — powerful, short (max ~10 words)
2. virtue — one classical Christian virtue for the day
3. scripture — main verse { reference, text, version: "KJV" } exact reference
4. secondaryScripture — supporting verse { reference, text, version: "KJV" }
5. reflection — 280–420 words, direct address by name; weave faith + virtue + Western Christian culture + BioConservatism as it fits their life; never contradict Scripture
6. prayer — 90–140 words, first person or pastoral "we/I"
7. action — one concrete, doable action TODAY (spiritual + preferably one embodied/family act)
8. closing — 2–3 sentence charge/blessing
9. tags — 4–8 lowercase tags from: fe, familia, proposito, salud, libertad, oracion, liderazgo, perseverancia, virtud, bioconservadurismo, cultura
10. points — integer 20–28

JSON SCHEMA ONLY:
{
  "title": "",
  "virtue": "",
  "scripture": { "reference": "", "text": "", "version": "KJV" },
  "secondaryScripture": { "reference": "", "text": "", "version": "KJV" },
  "reflection": "",
  "prayer": "",
  "action": "",
  "closing": "",
  "tags": [],
  "points": 24
}`;
  }

  if (lang === 'pt') {
    return `Gere o devocional personalizado de HOJE para a Salvazion.

DATA: ${date}

PERFIL DO USUÁRIO:
- Nome: ${profile.name || 'Irmão'}
- Idioma: Português (Brasil)
- Idade / etapa: ${age ?? 'desconhecida'} / ${stageLabel}
- Maturidade espiritual: ${profile.spiritualMaturity}
- Situação familiar: ${profile.familyStatus}
- Propósito de vida: ${profile.purpose || 'não especificado'}
- Cidade / país: ${profile.city || '—'} / ${profile.country || '—'}
- Foco atual: ${(profile.currentFocus || []).join(', ') || 'fé, família'}
- Lutas: ${(profile.struggles || []).join(', ') || 'nenhuma especificada'}
- Bíblia preferida: ${bible}

ESTRUTURA OBRIGATÓRIA (mais longa e formativa):
1. title — potente e curto (máx. ~10 palavras)
2. virtue — uma virtude cristã clássica do dia
3. scripture — versículo principal { reference, text, version: "ARC" } referência exata
4. secondaryScripture — versículo de apoio { reference, text, version: "ARC" }
5. reflection — 280–420 palavras; fale de você/nome; una fé + virtude + Cultura Cristã Ocidental + BioConservadorismo segundo a vida dele; nunca contradiga a Escritura
6. prayer — 90–140 palavras
7. action — uma ação concreta HOJE (espiritual + de preferência um ato corporal/familiar)
8. closing — 2–3 frases de consignação/bênção
9. tags — 4–8 tags em minúsculas de: fe, familia, proposito, salud, libertad, oracion, liderazgo, perseverancia, virtud, bioconservadurismo, cultura
10. points — inteiro 20–28

SOMENTE JSON:
{
  "title": "",
  "virtue": "",
  "scripture": { "reference": "", "text": "", "version": "ARC" },
  "secondaryScripture": { "reference": "", "text": "", "version": "ARC" },
  "reflection": "",
  "prayer": "",
  "action": "",
  "closing": "",
  "tags": [],
  "points": 24
}`;
  }

  return `Genera el devocional personalizado de HOY para Salvazion.

FECHA: ${date}

PERFIL DEL USUARIO:
- Nombre: ${profile.name || 'Hermano'}
- Idioma: Español
- Edad / etapa: ${age ?? 'desconocida'} / ${stageLabel}
- Madurez espiritual: ${profile.spiritualMaturity}
- Situación familiar: ${profile.familyStatus}
- Propósito de vida: ${profile.purpose || 'no especificado'}
- Ciudad / país: ${profile.city || '—'} / ${profile.country || '—'}
- Enfoque actual: ${(profile.currentFocus || []).join(', ') || 'fe, familia'}
- Luchas: ${(profile.struggles || []).join(', ') || 'ninguna especificada'}
- Biblia preferida: ${bible}

ESTRUCTURA REQUERIDA (más extensa y formativa):
1. title — potente y corto (máx. ~10 palabras)
2. virtue — una virtud cristiana clásica del día (ej. fortaleza, templanza, fe, caridad…)
3. scripture — versículo principal { reference, text, version: "Reina Valera" } referencia exacta
4. secondaryScripture — versículo de apoyo { reference, text, version: "Reina Valera" }
5. reflection — 280–420 palabras; habla de tú/nombre; une fe + virtud + Cultura Cristiano-Occidental + BioConservadurismo según su vida; nunca contradigas la Escritura
6. prayer — 90–140 palabras
7. action — una acción concreta HOY (espiritual + preferible un acto corporal/familiar)
8. closing — 2–3 frases de consignación/bendición
9. tags — 4–8 tags en minúsculas de: fe, familia, proposito, salud, libertad, oracion, liderazgo, perseverancia, virtud, bioconservadurismo, cultura
10. points — entero 20–28

SOLO JSON:
{
  "title": "",
  "virtue": "",
  "scripture": { "reference": "", "text": "", "version": "Reina Valera" },
  "secondaryScripture": { "reference": "", "text": "", "version": "Reina Valera" },
  "reflection": "",
  "prayer": "",
  "action": "",
  "closing": "",
  "tags": [],
  "points": 24
}`;
}

function extractJson(raw: string): unknown {
  let text = raw.trim();
  // strip markdown fences if model ignores instructions
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  return JSON.parse(text);
}

function asScripture(v: unknown, fallbackVersion: string): Scripture | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const reference = typeof o.reference === 'string' ? o.reference.trim() : '';
  const text = typeof o.text === 'string' ? o.text.trim() : '';
  if (!reference || !text) return null;
  return {
    reference: reference.slice(0, 120),
    text: text.slice(0, 1200),
    version: typeof o.version === 'string' ? o.version.slice(0, 40) : fallbackVersion,
  };
}

function normalizeGrokDevotional(
  raw: unknown,
  profile: UserProfile,
  date: string,
  model: string
): Devotional | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const fallbackV =
    profile.language === 'en' ? 'KJV' : 'Reina Valera';
  const scripture = asScripture(o.scripture, fallbackV);
  if (!scripture) return null;

  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const reflection = typeof o.reflection === 'string' ? o.reflection.trim() : '';
  const prayer = typeof o.prayer === 'string' ? o.prayer.trim() : '';
  const action = typeof o.action === 'string' ? o.action.trim() : '';
  if (!title || !reflection || !prayer || !action) return null;

  const tags = Array.isArray(o.tags)
    ? o.tags.filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase().slice(0, 40)).slice(0, 10)
    : ['fe', 'virtud'];

  let points = typeof o.points === 'number' ? Math.round(o.points) : 24;
  if (points < 18) points = 18;
  if (points > 30) points = 30;

  const secondary = asScripture(o.secondaryScripture, fallbackV) || undefined;

  return {
    id: `dev-${date}-grok`,
    date,
    title: title.slice(0, 120),
    scripture,
    secondaryScripture: secondary,
    reflection: reflection.slice(0, 6000),
    prayer: prayer.slice(0, 2500),
    action: action.slice(0, 800),
    virtue: typeof o.virtue === 'string' ? o.virtue.trim().slice(0, 80) : undefined,
    closing: typeof o.closing === 'string' ? o.closing.trim().slice(0, 800) : undefined,
    tags,
    points,
    personalizedFor: profile.name,
    source: 'grok',
    model,
  };
}

/**
 * Generate with AI when XAI_API_KEY is set; otherwise rules fallback.
 */
export async function generateDevotionalAsync(
  profile: UserProfile,
  date: string = new Date().toISOString().slice(0, 10)
): Promise<{ devotional: Devotional; engine: string; note?: string }> {
  const client = getXaiClient();
  const model = getXaiModel();

  if (!client) {
    return {
      devotional: generateDevotionalRules(profile, date),
      engine: 'salvazion-rules-v1',
      note: 'IA no configurada. Usando motor de reglas.',
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.75,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: buildLLMSystemPrompt(profile.language) },
        { role: 'user', content: buildLLMUserPrompt(profile, date) },
      ],
    });

    const content = completion.choices[0]?.message?.content || '';
    const parsed = extractJson(content);
    const devotional = normalizeGrokDevotional(parsed, profile, date, model);

    if (!devotional) {
      console.warn('[Devotional] AI JSON invalid, falling back to rules');
      return {
        devotional: generateDevotionalRules(profile, date),
        engine: 'salvazion-rules-v1',
        note: 'Respuesta de IA en formato inválido; se usó fallback de reglas.',
      };
    }

    return {
      devotional,
      engine: `ai:${model}`,
      note: 'Devocional personalizado por perfil',
    };
  } catch (e) {
    console.error('[Devotional] AI error', e);
    return {
      devotional: generateDevotionalRules(profile, date),
      engine: 'salvazion-rules-v1',
      note: 'Error de IA. Se usó fallback de reglas.',
    };
  }
}

/** Prompt builder kept for debugging / admin */
export function buildLLMPrompt(profile: UserProfile, date: string): string {
  return `${buildLLMSystemPrompt(profile.language)}\n\n${buildLLMUserPrompt(profile, date)}`;
}

export { isXaiConfigured };
