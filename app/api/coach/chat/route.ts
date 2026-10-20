import { NextRequest, NextResponse } from 'next/server';
import { getXaiClient, getXaiModel, isXaiConfigured } from '@/lib/ai/xai';
import {
  buildLionSystemPrompt,
  buildDebateSystemPrompt,
  type CoachChatMessage,
  type CoachMode,
} from '@/lib/coach/agent';
import type { UserProfile } from '@/lib/types';
import type { ComputedScores } from '@/lib/scoring/types';
import {
  quotaGateMessage,
  requireAiQuota,
  type QuotaGate,
} from '@/lib/billing/ai-usage';

export const runtime = 'nodejs';
export const maxDuration = 60;

function sanitizeMessages(raw: unknown): CoachChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is CoachChatMessage =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .slice(-16)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }));
}

export type CoachChatInput = {
  messages: unknown;
  profile?: Partial<UserProfile> | null;
  scores?: Partial<ComputedScores> | null;
  lang?: unknown;
  mode?: unknown;
};

export type CoachChatDeps = {
  reserve: (feature: 'coach_chat', lang: 'es' | 'en' | 'pt') => Promise<QuotaGate>;
  configured: () => boolean;
};

/** A served reply, including the local fallback, keeps the reserved attempt. */
export async function respondCoachChat(
  input: CoachChatInput,
  deps: CoachChatDeps
): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    const messages = sanitizeMessages(input.messages);
    const profile = (input.profile || null) as Partial<UserProfile> | null;
    const scores = (input.scores || null) as Partial<ComputedScores> | null;
    const lang: 'es' | 'en' | 'pt' =
      input.lang === 'en' ? 'en' : input.lang === 'pt' ? 'pt' : 'es';
    const mode: CoachMode = input.mode === 'debate' ? 'debate' : 'coach';

    if (!messages.length) {
      return { status: 400, body: { error: 'messages required' } };
    }

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      return { status: 400, body: { error: 'user message required' } };
    }

    const gate = await deps.reserve('coach_chat', lang);
    if (!gate.ok) {
      const reply = quotaGateMessage(gate, lang);
      return {
        status: gate.status,
        body: {
          error: gate.error,
          reply,
          source: gate.error,
          model: null,
          usage: gate.quota ?? null,
        },
      };
    }
    if (!deps.configured()) {
      const name =
        profile?.name?.split(' ')[0] ||
        (lang === 'en' ? 'Friend' : lang === 'pt' ? 'Irmão' : 'Hermano');
      const fallback =
        mode === 'debate'
          ? lang === 'en'
            ? `${name}, I stand for Western Christian culture and bio-conservatism. State your thesis — globalism, woke ideology, LGBTQ activism, Deep State power, leftism, or transhumanism — and I will answer with reason and faith.`
            : lang === 'pt'
              ? `${name}, defendo a cultura cristã ocidental e o bio-conservadorismo. Apresente sua tese — globalismo, agenda woke, LGBTQ, Deep State, esquerda ou transumanismo — e responderei com razão e fé.`
              : `${name}, defiendo la cultura cristiano-occidental y el bio-conservadurismo. Plantea tu tesis — globalismo, agenda woke, LGBTQ, Deep State, izquierda o transhumanismo — y responderé con razón y fe.`
          : lang === 'en'
            ? profile?.purpose?.trim()
              ? `${name}, live your purpose today. Raise your Global Score: one Bible chapter, 15 minutes of movement, 5 minutes of prayer. Use the Platform.`
              : `${name}, you have not written your purpose yet — I will help you find it. Meanwhile raise your Global Score: one Bible chapter, 15 minutes of movement, 5 minutes of prayer.`
            : lang === 'pt'
              ? profile?.purpose?.trim()
                ? `${name}, viva o seu propósito hoje. Suba o Score Global: um capítulo da Bíblia, 15 minutos de movimento, 5 minutos de oração. Use a Plataforma.`
                : `${name}, você ainda não escreveu o seu propósito — eu ajudo você a encontrá-lo. Enquanto isso, suba o Score Global: um capítulo da Bíblia, 15 minutos de movimento, 5 minutos de oração.`
              : profile?.purpose?.trim()
                ? `${name}, vive tu propósito hoy. Sube el Score Global: un capítulo de la Biblia, 15 minutos de movimiento, 5 minutos de oración. Usa la Plataforma.`
                : `${name}, aún no has escrito tu propósito — te ayudo a encontrarlo. Mientras tanto sube el Score Global: un capítulo de la Biblia, 15 minutos de movimiento, 5 minutos de oración.`;
      return {
        status: 200,
        body: {
          reply: fallback,
          source: 'fallback',
          model: null,
          mode,
          usage: gate.quota,
        },
      };
    }

    const client = getXaiClient();
    if (!client) {
      return { status: 503, body: { error: 'xAI client unavailable', source: 'fallback' } };
    }

    const model = getXaiModel();
    const system =
      mode === 'debate'
        ? buildDebateSystemPrompt(profile, scores, lang)
        : buildLionSystemPrompt(profile, scores, lang);

    const completion = await client.chat.completions.create({
      model,
      temperature: mode === 'debate' ? 0.65 : 0.75,
      max_tokens: mode === 'debate' ? 1100 : 700,
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      (lang === 'en'
        ? 'I am here. Speak again, and we walk forward.'
        : lang === 'pt'
          ? 'Estou aqui. Fale de novo e avançamos.'
          : 'Estoy aquí. Habla de nuevo y avanzamos.');

    return {
      status: 200,
      body: {
        reply,
        source: 'ai',
        model,
        mode,
        usage: gate.quota,
      },
    };
  } catch (e) {
    console.error('[coach/chat]', e);
    return {
      status: 500,
      body: {
        error: e instanceof Error ? e.message : 'Coach error',
        reply:
          'Salvazion AI permanece firme. Hubo un fallo temporal; intenta de nuevo en un momento.',
        source: 'error',
      },
    };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await respondCoachChat(body, {
    reserve: (feature, lang) => requireAiQuota(feature, lang),
    configured: isXaiConfigured,
  });
  return NextResponse.json(result.body, { status: result.status });
}
