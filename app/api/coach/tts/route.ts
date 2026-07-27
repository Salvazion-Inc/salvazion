import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Text-to-speech via xAI Voice API (/v1/tts).
 * Returns audio/mpeg binary for client playback.
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'XAI_API_KEY not configured', fallback: true },
        { status: 503 }
      );
    }

    const body = await req.json();
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2500) : '';
    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const lang: 'es' | 'en' = body.lang === 'en' ? 'en' : 'es';
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
