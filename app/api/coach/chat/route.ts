import { NextRequest, NextResponse } from 'next/server';
import { getXaiClient, getXaiModel, isXaiConfigured } from '@/lib/ai/xai';
import { buildLionSystemPrompt, type CoachChatMessage } from '@/lib/coach/agent';
import type { UserProfile } from '@/lib/types';
import type { ComputedScores } from '@/lib/scoring/types';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/billing/subscription';

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
  try {
    const body = await req.json();
    const messages = sanitizeMessages(body.messages);
    const profile = (body.profile || null) as Partial<UserProfile> | null;
    const scores = (body.scores || null) as Partial<ComputedScores> | null;
    const lang: 'es' | 'en' = body.lang === 'en' ? 'en' : 'es';

    if (!messages.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      return NextResponse.json({ error: 'user message required' }, { status: 400 });
    }

    // Premium: full AI coach
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const ent = await getEntitlementForUser(user.id, user.email);
        if (!ent.isPremium) {
          return NextResponse.json(
            {
              error: 'premium_required',
              reply:
                lang === 'en'
                  ? 'Green Lion AI coach is a Premium feature. Upgrade for full Grok coaching — Salvation · Health · Freedom.'
                  : 'El coach León Verde con IA es Premium. Mejora tu plan para coaching Grok completo — Salvación · Salud · Libertad.',
              source: 'premium_gate',
              model: null,
            },
            { status: 402 }
          );
        }
      }
    } catch {
      // If auth/billing unavailable, fall through (dev without Supabase)
    }

    if (!isXaiConfigured()) {
      const name = profile?.name?.split(' ')[0] || (lang === 'en' ? 'Friend' : 'Hermano');
      const fallback =
        lang === 'en'
          ? `${name}, the Green Lion walks with you. Configure XAI_API_KEY to unlock full Grok voice coaching. Today: read one Bible chapter, move 15 minutes, and pray 5 minutes. Salvation · Health · Freedom.`
          : `${name}, el León Verde camina contigo. Configura XAI_API_KEY para activar el coach Grok completo. Hoy: lee un capítulo de la Biblia, muévete 15 minutos y ora 5 minutos. Salvación · Salud · Libertad.`;
      return NextResponse.json({
        reply: fallback,
        source: 'fallback',
        model: null,
      });
    }

    const client = getXaiClient();
    if (!client) {
      return NextResponse.json({ error: 'xAI client unavailable' }, { status: 503 });
    }

    const model = getXaiModel();
    const system = buildLionSystemPrompt(profile, scores, lang);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.75,
      max_tokens: 700,
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      (lang === 'en'
        ? 'I am here. Speak again, and we walk forward.'
        : 'Estoy aquí. Habla de nuevo y avanzamos.');

    return NextResponse.json({
      reply,
      source: 'grok',
      model,
    });
  } catch (e) {
    console.error('[coach/chat]', e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Coach error',
        reply:
          'El León permanece firme. Hubo un fallo temporal; intenta de nuevo en un momento.',
        source: 'error',
      },
      { status: 500 }
    );
  }
}
