import { NextRequest, NextResponse } from 'next/server';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { getXaiClient, getXaiVisionModel, isXaiConfigured } from '@/lib/ai/xai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 90;

type VisionMode = 'body' | 'meal';

const MAX_DATA_URL_LEN = 2_500_000; // ~1.8MB base64 budget

function isDataUrlImage(s: unknown): s is string {
  return (
    typeof s === 'string' &&
    s.startsWith('data:image/') &&
    s.includes('base64,') &&
    s.length < MAX_DATA_URL_LEN
  );
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* try fence */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* fall through */
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error('invalid_json');
}

function bodySystemPrompt(lang: 'es' | 'en' | 'pt'): string {
  if (lang === 'en') {
    return `You are a careful sports-science assistant for Salvazion Health.
Analyze swimsuit/fitness photos (front, back, right side and/or left side) for educational cineanthropometry ESTIMATES only.
Never claim medical diagnosis or DEXA accuracy.
Return ONLY valid JSON (no markdown) with this shape:
{
  "weightKg": number|null,
  "muscleMassKg": number|null,
  "boneMassKg": number|null,
  "residualMassKg": number|null,
  "skinFatMassKg": number|null,
  "bodyFatPercent": number|null,
  "bmi": number|null,
  "somatotypeHint": string|null,
  "confidence": "low"|"medium"|"high",
  "observations": string,
  "recommendations": string
}
Mass fractionation style: muscle, bone, residual, skin/fat (skinFatMassKg).
If height/weight provided, prefer consistency with physics; if missing, estimate carefully with low confidence.
observations/recommendations in English, concise, bio-conservative stewardship of the body (not vanity culture).`;
  }
  return `Eres un asistente de ciencias del deporte para Salvazion Health.
Analiza fotos en traje de baño / fitness (frente, espalda, lado derecho y/o izquierdo) para ESTIMACIONES educativas de cineantropometría.
Nunca digas que es diagnóstico médico ni precisión DEXA/plicometría clínica.
Devuelve SOLO JSON válido (sin markdown) con esta forma:
{
  "weightKg": number|null,
  "muscleMassKg": number|null,
  "boneMassKg": number|null,
  "residualMassKg": number|null,
  "skinFatMassKg": number|null,
  "bodyFatPercent": number|null,
  "bmi": number|null,
  "somatotypeHint": string|null,
  "confidence": "low"|"medium"|"high",
  "observations": string,
  "recommendations": string
}
Fraccionamiento: masa muscular, ósea, residual y grasa/piel (skinFatMassKg).
Si hay talla/peso declarados, sé coherente; si faltan, estima con confidence low/medium.
observations/recommendations en español, breves, mayordomía del cuerpo (no cultura de vanidad).`;
}

function mealSystemPrompt(lang: 'es' | 'en' | 'pt'): string {
  if (lang === 'en') {
    return `You are a nutrition vision assistant for Salvazion Health.
Analyze a meal photo for educational estimates of foods, calories, macros, and a classic food pyramid distribution (USDA/Kennedy-style guide: base grains/plant foods, mid protein/dairy, tip fats/sugars).
Not medical advice. Return ONLY valid JSON:
{
  "foods": [{"name": string, "portion": string}],
  "estimatedKcal": number|null,
  "macros": {"protein_g": number|null, "carbs_g": number|null, "fat_g": number|null, "fiber_g": number|null},
  "microsSummary": string,
  "pyramid": {
    "grains": number, "vegetables": number, "fruits": number,
    "protein": number, "dairy": number, "fats": number, "sugars": number
  },
  "quality": "whole"|"mixed"|"processed",
  "kennedyNote": string,
  "advice": string,
  "confidence": "low"|"medium"|"high"
}
pyramid values are approximate % contribution of the plate (0-100 each, need not sum exactly 100).
kennedyNote: short note on how this plate sits on a classic food pyramid.
advice in English, practical, whole-food oriented.`;
  }
  return `Eres un asistente de nutrición visual para Salvazion Health.
Analiza la foto de una comida y estima alimentos, calorías, macros y distribución en pirámide alimenticia clásica (estilo guía USDA/Kennedy: base cereales/vegetales, medios proteínas/lácteos, cúspide grasas/azúcares).
No es consejo médico. Devuelve SOLO JSON válido:
{
  "foods": [{"name": string, "portion": string}],
  "estimatedKcal": number|null,
  "macros": {"protein_g": number|null, "carbs_g": number|null, "fat_g": number|null, "fiber_g": number|null},
  "microsSummary": string,
  "pyramid": {
    "grains": number, "vegetables": number, "fruits": number,
    "protein": number, "dairy": number, "fats": number, "sugars": number
  },
  "quality": "whole"|"mixed"|"processed",
  "kennedyNote": string,
  "advice": string,
  "confidence": "low"|"medium"|"high"
}
pyramid: % aproximado del plato (0-100 por grupo).
kennedyNote: cómo se ubica el plato en la pirámide clásica.
advice en español, práctico, orientado a comida real.`;
}

function normalizeBody(raw: Record<string, unknown>) {
  const num = (k: string) => {
    const v = raw[k];
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v * 10) / 10;
    if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v)))
      return Math.round(Number(v) * 10) / 10;
    return null;
  };
  const conf = raw.confidence;
  return {
    weightKg: num('weightKg'),
    muscleMassKg: num('muscleMassKg'),
    boneMassKg: num('boneMassKg'),
    residualMassKg: num('residualMassKg'),
    skinFatMassKg: num('skinFatMassKg'),
    bodyFatPercent: num('bodyFatPercent'),
    bmi: num('bmi'),
    somatotypeHint:
      typeof raw.somatotypeHint === 'string' ? raw.somatotypeHint.slice(0, 200) : null,
    confidence:
      conf === 'high' || conf === 'medium' || conf === 'low' ? conf : 'low',
    observations:
      typeof raw.observations === 'string' ? raw.observations.slice(0, 1200) : '',
    recommendations:
      typeof raw.recommendations === 'string'
        ? raw.recommendations.slice(0, 1200)
        : '',
  };
}

function normalizeMeal(raw: Record<string, unknown>) {
  const num = (v: unknown) => {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v * 10) / 10;
    if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v)))
      return Math.round(Number(v) * 10) / 10;
    return null;
  };
  const clampPct = (v: unknown) => {
    const n = num(v);
    if (n == null) return 0;
    return Math.max(0, Math.min(100, n));
  };
  const macros =
    raw.macros && typeof raw.macros === 'object'
      ? (raw.macros as Record<string, unknown>)
      : {};
  const pyramid =
    raw.pyramid && typeof raw.pyramid === 'object'
      ? (raw.pyramid as Record<string, unknown>)
      : {};
  const foodsRaw = Array.isArray(raw.foods) ? raw.foods : [];
  const foods = foodsRaw
    .slice(0, 20)
    .map((f) => {
      if (!f || typeof f !== 'object') return null;
      const o = f as Record<string, unknown>;
      const name = typeof o.name === 'string' ? o.name.slice(0, 80) : '';
      const portion = typeof o.portion === 'string' ? o.portion.slice(0, 80) : '';
      if (!name) return null;
      return { name, portion: portion || '—' };
    })
    .filter(Boolean) as { name: string; portion: string }[];

  const q = raw.quality;
  return {
    foods,
    estimatedKcal: num(raw.estimatedKcal),
    macros: {
      protein_g: num(macros.protein_g),
      carbs_g: num(macros.carbs_g),
      fat_g: num(macros.fat_g),
      fiber_g: num(macros.fiber_g),
    },
    microsSummary:
      typeof raw.microsSummary === 'string' ? raw.microsSummary.slice(0, 500) : '',
    pyramid: {
      grains: clampPct(pyramid.grains),
      vegetables: clampPct(pyramid.vegetables),
      fruits: clampPct(pyramid.fruits),
      protein: clampPct(pyramid.protein),
      dairy: clampPct(pyramid.dairy),
      fats: clampPct(pyramid.fats),
      sugars: clampPct(pyramid.sugars),
    },
    quality:
      q === 'whole' || q === 'mixed' || q === 'processed' ? q : 'mixed',
    kennedyNote:
      typeof raw.kennedyNote === 'string' ? raw.kennedyNote.slice(0, 600) : '',
    advice: typeof raw.advice === 'string' ? raw.advice.slice(0, 800) : '',
    confidence:
      raw.confidence === 'high' ||
      raw.confidence === 'medium' ||
      raw.confidence === 'low'
        ? raw.confidence
        : 'low',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode: VisionMode = body.mode === 'meal' ? 'meal' : 'body';
    const lang: 'es' | 'en' | 'pt' =
      body.lang === 'en' ? 'en' : body.lang === 'pt' ? 'pt' : 'es';

    // Optional auth — allow logged-out local demo; soft premium not hard-gated for health tools
    try {
      const supabase = await createClient();
      await supabase.auth.getUser();
    } catch {
      /* ignore */
    }

    if (!isXaiConfigured()) {
      return NextResponse.json(
        {
          error: 'xai_not_configured',
          message:
            lang === 'en'
              ? 'XAI_API_KEY is not configured on the server.'
              : lang === 'pt'
                ? 'XAI_API_KEY não está configurada no servidor.'
                : 'XAI_API_KEY no está configurada en el servidor.',
        },
        { status: 503 }
      );
    }

    const client = getXaiClient();
    if (!client) {
      return NextResponse.json({ error: 'xai_unavailable' }, { status: 503 });
    }

    const model = getXaiVisionModel();
    const contentParts: ChatCompletionContentPart[] = [];

    if (mode === 'body') {
      const photos = { ...(body.photos || {}) };
      if (!photos.right && photos.side) photos.right = photos.side;
      const views: { key: string; label: string }[] = [
        {
          key: 'front',
          label:
            lang === 'en' ? 'FRONT view' : lang === 'pt' ? 'vista FRONTAL' : 'vista FRONTAL',
        },
        {
          key: 'back',
          label:
            lang === 'en' ? 'BACK view' : lang === 'pt' ? 'vista POSTERIOR' : 'vista POSTERIOR',
        },
        {
          key: 'right',
          label:
            lang === 'en'
              ? 'RIGHT side view'
              : lang === 'pt'
                ? 'vista LATERAL DIREITA'
                : 'vista LATERAL DERECHA',
        },
        {
          key: 'left',
          label:
            lang === 'en'
              ? 'LEFT side view'
              : lang === 'pt'
                ? 'vista LATERAL ESQUERDA'
                : 'vista LATERAL IZQUIERDA',
        },
      ];
      let count = 0;
      for (const v of views) {
        const url = photos[v.key];
        if (!isDataUrlImage(url)) continue;
        count++;
        contentParts.push({
          type: 'text',
          text: `${v.label}:`,
        });
        contentParts.push({
          type: 'image_url',
          image_url: { url, detail: 'high' },
        });
      }
      if (count === 0) {
        return NextResponse.json(
          { error: 'photos_required' },
          { status: 400 }
        );
      }
      const heightCm =
        typeof body.heightCm === 'number' ? body.heightCm : null;
      const weightKg =
        typeof body.weightKg === 'number' ? body.weightKg : null;
      const sex = body.sex === 'female' || body.sex === 'male' ? body.sex : null;
      const age = typeof body.age === 'number' ? body.age : null;
      contentParts.unshift({
        type: 'text',
        text:
          lang === 'en'
            ? `Estimate cineanthropometry from these swimsuit/body photos. Declared: heightCm=${heightCm}, weightKg=${weightKg}, sex=${sex}, age=${age}. Prefer declared weight/height when present.`
            : `Estima cineantropometría a partir de estas fotos corporales. Declarado: heightCm=${heightCm}, weightKg=${weightKg}, sex=${sex}, age=${age}. Prioriza talla/peso declarados si existen.`,
      });
    } else {
      const photo = body.photo;
      if (!isDataUrlImage(photo)) {
        return NextResponse.json({ error: 'photo_required' }, { status: 400 });
      }
      contentParts.push({
        type: 'text',
        text:
          lang === 'en'
            ? 'Analyze this meal photo for nutrients, calories, and classic food pyramid placement.'
            : 'Analiza esta foto de comida: nutrientes, calorías y ubicación en la pirámide alimenticia clásica.',
      });
      contentParts.push({
        type: 'image_url',
        image_url: { url: photo, detail: 'high' },
      });
    }

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 1800,
      messages: [
        {
          role: 'system',
          content:
            mode === 'body' ? bodySystemPrompt(lang) : mealSystemPrompt(lang),
        },
        {
          role: 'user',
          content: contentParts,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || '';
    let parsed: unknown;
    try {
      parsed = extractJsonObject(text);
    } catch {
      return NextResponse.json(
        {
          error: 'parse_failed',
          raw: text.slice(0, 1500),
          message:
            lang === 'en'
              ? 'Model returned non-JSON. Try again with clearer photos.'
              : 'El modelo no devolvió JSON. Reintenta con fotos más claras.',
        },
        { status: 502 }
      );
    }

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: 'invalid_analysis' }, { status: 502 });
    }

    const analysis =
      mode === 'body'
        ? normalizeBody(parsed as Record<string, unknown>)
        : normalizeMeal(parsed as Record<string, unknown>);

    return NextResponse.json({
      ok: true,
      mode,
      model,
      analysis,
    });
  } catch (e) {
    console.error('[health/vision]', e);
    return NextResponse.json(
      {
        error: 'vision_failed',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { status: 500 }
    );
  }
}
