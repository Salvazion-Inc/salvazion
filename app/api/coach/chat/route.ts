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
  authRequiredMessage,
  quotaUserMessage,
  refundAiQuota,
  requireAiQuota,
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

export async function POST(req: NextRequest) {
  let reservedUserId: string | null = null;
  try {
    const body = await req.json();
    const messages = sanitizeMessages(body.messages);
    const profile = (body.profile || null) as Partial<UserProfile> | null;
    const scores = (body.scores || null) as Partial<ComputedScores> | null;
    const lang: 'es' | 'en' | 'pt' =
      body.lang === 'en' ? 'en' : body.lang === 'pt' ? 'pt' : 'es';
    const mode: CoachMode = body.mode === 'debate' ? 'debate' : 'coach';

    if (!messages.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      return NextResponse.json({ error: 'user message required' }, { status: 400 });
    }

    const gate = await requireAiQuota('coach_chat', lang);
    if (!gate.ok) {
      const reply =
        gate.error === 'auth_required'
          ? authRequiredMessage(lang)
          : gate.quota
            ? quotaUserMessage(gate.quota, lang)
            : authRequiredMessage(lang);
      return NextResponse.json(
        {
          error: gate.error,
          reply,
          source: gate.error,
          model: null,
          usage: gate.quota ?? null,
        },
        { status: gate.status }
      );
    }
    reservedUserId =
      gate.quota.tracked && gate.user.id !== 'local-dev' ? gate.user.id : null;

    if (!isXaiConfigured()) {
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
                ? `${name}, viva o teu propósito hoje. Suba o Score Global: um capítulo da Bíblia, 15 minutos de movimento, 5 minutos de oração. Use a Plataforma.`
                : `${name}, você ainda não escreveu o teu propósito — eu te ajudo a encontrá-lo. Enquanto isso, suba o Score Global: um capítulo da Bíblia, 15 minutos de movimento, 5 minutos de oração.`
              : profile?.purpose?.trim()
                ? `${name}, vive tu propósito hoy. Sube el Score Global: un capítulo de la Biblia, 15 minutos de movimiento, 5 minutos de oración. Usa la Plataforma.`
                : `${name}, aún no has escrito tu propósito — te ayudo a encontrarlo. Mientras tanto sube el Score Global: un capítulo de la Biblia, 15 minutos de movimiento, 5 minutos de oración.`;
      if (reservedUserId) await refundAiQuota(reservedUserId, 'coach_chat');
      return NextResponse.json({
        reply: fallback,
        source: 'fallback',
        model: null,
        mode,
      });
    }

    const client = getXaiClient();
    if (!client) {
      if (reservedUserId) await refundAiQuota(reservedUserId, 'coach_chat');
      return NextResponse.json({ error: 'xAI client unavailable' }, { status: 503 });
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

    return NextResponse.json({
      reply,
      source: 'ai',
      model,
      mode,
      usage: gate.quota,
    });
  } catch (e) {
    if (reservedUserId) await refundAiQuota(reservedUserId, 'coach_chat');
    console.error('[coach/chat]', e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Coach error',
        reply:
          'Salvazion AI permanece firme. Hubo un fallo temporal; intenta de nuevo en un momento.',
        source: 'error',
      },
      { status: 500 }
    );
  }
}
