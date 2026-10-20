import { NextRequest, NextResponse } from 'next/server';
import {
  quotaGateMessage,
  refundAiQuota,
  requireAiQuota,
  type QuotaGate,
} from '@/lib/billing/ai-usage';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Text-to-speech via xAI Voice API (/v1/tts).
 * Free: limited daily quota. Premium: unlimited.
 */
export type CoachTtsDeps = {
  reserve: (feature: 'coach_tts', lang: 'es' | 'en' | 'pt') => Promise<QuotaGate>;
  refund: (userId: string, feature: 'coach_tts') => Promise<void>;
  apiKey: () => string | undefined;
};

type TtsResult =
  | { kind: 'json'; status: number; body: Record<string, unknown> }
  | { kind: 'audio'; bytes: Buffer; contentType: string };

/** Missing key and provider failure keep the attempt. Empty text does not. */
export async function respondCoachTts(
  body: { text?: unknown; lang?: unknown; voiceId?: unknown },
  deps: CoachTtsDeps
): Promise<TtsResult> {
  let reservedUserId: string | null = null;
  try {
    const lang: 'es' | 'en' | 'pt' =
      body?.lang === 'en' ? 'en' : body?.lang === 'pt' ? 'pt' : 'es';

    const gate = await deps.reserve('coach_tts', lang);
    if (!gate.ok) {
      return {
        kind: 'json',
        status: gate.status,
        body: {
          error: gate.error,
          fallback: true,
          message: quotaGateMessage(gate, lang),
          usage: gate.quota ?? null,
        },
      };
    }
    reservedUserId =
      gate.quota.tracked && gate.user.id !== 'local-dev' ? gate.user.id : null;

    const apiKey = deps.apiKey();
    if (!apiKey) {
      return {
        kind: 'json',
        status: 503,
        body: { error: 'XAI_API_KEY not configured', fallback: true, usage: gate.quota },
      };
    }

    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2500) : '';
    if (!text) {
      if (reservedUserId) await deps.refund(reservedUserId, 'coach_tts');
      return { kind: 'json', status: 400, body: { error: 'text required' } };
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
      const errText = await res.text().catch(() => '');
      console.error('[coach/tts]', res.status, errText.slice(0, 400));
      return {
        kind: 'json',
        status: 502,
        body: {
          error: `TTS failed (${res.status})`,
          fallback: true,
          detail: errText.slice(0, 200),
          usage: gate.quota,
        },
      };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return {
      kind: 'audio',
      bytes: buf,
      contentType: res.headers.get('content-type') || 'audio/mpeg',
    };
  } catch (e) {
    console.error('[coach/tts]', e);
    return {
      kind: 'json',
      status: 500,
      body: {
        error: e instanceof Error ? e.message : 'TTS error',
        fallback: true,
      },
    };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await respondCoachTts(body, {
    reserve: (feature, lang) => requireAiQuota(feature, lang),
    refund: refundAiQuota,
    apiKey: () => process.env.XAI_API_KEY,
  });
  if (result.kind === 'audio') {
    return new NextResponse(new Uint8Array(result.bytes), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'no-store',
      },
    });
  }
  return NextResponse.json(result.body, { status: result.status });
}
