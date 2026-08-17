import { NextRequest, NextResponse } from 'next/server';
import {
  authRequiredMessage,
  quotaUserMessage,
  refundAiQuota,
  requireAiQuota,
} from '@/lib/billing/ai-usage';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Text-to-speech via xAI Voice API (/v1/tts).
 * Free: limited daily quota. Premium: unlimited.
 */
export async function POST(req: NextRequest) {
  let reservedUserId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const lang: 'es' | 'en' | 'pt' =
      body?.lang === 'en' ? 'en' : body?.lang === 'pt' ? 'pt' : 'es';

    const gate = await requireAiQuota('coach_tts', lang);
    if (!gate.ok) {
      return NextResponse.json(
        {
          error: gate.error,
          fallback: true,
          message:
            gate.error === 'auth_required'
              ? authRequiredMessage(lang)
              : gate.quota
                ? quotaUserMessage(gate.quota, lang)
                : authRequiredMessage(lang),
          usage: gate.quota ?? null,
        },
        { status: gate.status }
      );
    }
    reservedUserId =
      gate.quota.tracked && gate.user.id !== 'local-dev' ? gate.user.id : null;

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      if (reservedUserId) await refundAiQuota(reservedUserId, 'coach_tts');
      return NextResponse.json(
        { error: 'XAI_API_KEY not configured', fallback: true },
        { status: 503 }
      );
    }

    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2500) : '';
    if (!text) {
      if (reservedUserId) await refundAiQuota(reservedUserId, 'coach_tts');
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }
    // Deep, noble voice defaults — override with XAI_TTS_VOICE
    const voiceId =
      (typeof body.voiceId === 'string' && body.voiceId) ||
      process.env.XAI_TTS_VOICE ||
      'ara';

    const base = (process.env.XAI_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, '');
    const res = await fetch(`${base}/tts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        language: lang,
      }),
    });

    if (!res.ok) {
      if (reservedUserId) await refundAiQuota(reservedUserId, 'coach_tts');
      const errText = await res.text().catch(() => '');
      console.error('[coach/tts]', res.status, errText.slice(0, 400));
      return NextResponse.json(
        {
          error: `TTS failed (${res.status})`,
          fallback: true,
          detail: errText.slice(0, 200),
        },
        { status: 502 }
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    if (reservedUserId) await refundAiQuota(reservedUserId, 'coach_tts');
    console.error('[coach/tts]', e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'TTS error',
        fallback: true,
      },
      { status: 500 }
    );
  }
}
