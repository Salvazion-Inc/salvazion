import { NextRequest, NextResponse } from 'next/server';
import {
  generateDevotionalAsync,
  generateDevotionalRules,
  isXaiConfigured,
} from '@/lib/devotional-engine';
import { UserProfile } from '@/lib/types';
import {
  consumeAiQuota,
  getRequestUser,
  peekAiQuota,
  refundAiQuota,
} from '@/lib/billing/ai-usage';

/** Basic sanitization for free-text fields */
function sanitize(str: unknown, maxLen = 200): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (JSON.stringify(body).length > 12000) {
      return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 });
    }

    // Free: 1 AI devotional / day (2× with $SALVAZION). Premium: unlimited.
    // Exhausted Free quota still gets the rules-based daily reading.
    const user = await getRequestUser();
    let useAi = false;
    let quotaNote: string | null = null;
    let usage = null as Awaited<ReturnType<typeof consumeAiQuota>> | null;

    if (user) {
      const peek = await peekAiQuota(user.id, 'devotional_ai', user.email);
      if (peek.unlimited || peek.allowed) {
        useAi = true;
      } else {
        const lang =
          body.language === 'en' ? 'en' : body.language === 'pt' ? 'pt' : 'es';
        quotaNote =
          lang === 'en'
            ? 'Free AI devotional used for today. Rules-based reading below. Premium is unlimited.'
            : lang === 'pt'
              ? 'Devocional IA Free de hoje já usado. Leitura por regras abaixo. Premium é ilimitado.'
              : 'Devocional IA Free de hoy ya usado. Lectura por reglas abajo. Premium es ilimitado.';
      }
    }

    const profile: UserProfile = {
      name:
        sanitize(body.name, 80) ||
        (body.language === 'en' ? 'Brother' : body.language === 'pt' ? 'Irmão' : 'Hermano'),
      language:
        body.language === 'en' ? 'en' : body.language === 'pt' ? 'pt' : 'es',
      spiritualMaturity: ['new', 'growing', 'mature', 'leader'].includes(body.spiritualMaturity)
        ? body.spiritualMaturity
        : 'growing',
      familyStatus: ['single', 'married', 'parent', 'widow', 'family'].includes(body.familyStatus)
        ? body.familyStatus
        : 'family',
      currentFocus: Array.isArray(body.currentFocus)
        ? body.currentFocus.filter((t: unknown) => typeof t === 'string').slice(0, 8)
        : ['fe', 'familia'],
      struggles: Array.isArray(body.struggles)
        ? body.struggles.filter((t: unknown) => typeof t === 'string').slice(0, 6)
        : [],
      preferredBibleVersion: ['rv1960', 'kjv', 'original', 'arc'].includes(
        body.preferredBibleVersion
      )
        ? body.preferredBibleVersion
        : body.language === 'en'
          ? 'kjv'
          : body.language === 'pt'
            ? 'arc'
            : 'rv1960',
      purpose: sanitize(body.purpose, 400),
      city: sanitize(body.city, 80),
      country: sanitize(body.country, 80),
      birthDate: typeof body.birthDate === 'string' ? body.birthDate.slice(0, 10) : '',
      familyLinks: [],
      friendsLinks: [],
      hasAcceptedLionCoach: true,
      onboardingCompleted: true,
    };

    const date =
      typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : new Date().toISOString().slice(0, 10);

    if (!useAi) {
      return NextResponse.json({
        success: true,
        data: generateDevotionalRules(profile, date),
        engine: 'salvazion-rules-v1',
        note:
          quotaNote ||
          (profile.language === 'en'
            ? 'Rules-based daily devotional. Sign in to use the Free AI daily slot — Premium is unlimited.'
            : profile.language === 'pt'
              ? 'Devocional diário por regras. Entre para usar o cupo Free de IA — Premium é ilimitado.'
              : 'Devocional diario por reglas. Inicia sesión para usar el cupo Free de IA — Premium es ilimitado.'),
        aiConfigured: isXaiConfigured(),
        premium: false,
        usage: user
          ? await peekAiQuota(user.id, 'devotional_ai', user.email)
          : null,
      });
    }

    usage = await consumeAiQuota(user!.id, 'devotional_ai', user!.email);
    if (!usage.allowed && !usage.unlimited) {
      return NextResponse.json({
        success: true,
        data: generateDevotionalRules(profile, date),
        engine: 'salvazion-rules-v1',
        note:
          profile.language === 'en'
            ? 'Free AI devotional used for today. Rules-based reading below.'
            : profile.language === 'pt'
              ? 'Devocional IA Free de hoje já usado. Leitura por regras abaixo.'
              : 'Devocional IA Free de hoy ya usado. Lectura por reglas abajo.',
        aiConfigured: isXaiConfigured(),
        premium: false,
        usage,
      });
    }

    try {
      const { devotional, engine, note } = await generateDevotionalAsync(profile, date);
      if (engine === 'salvazion-rules-v1' && usage.tracked && user) {
        await refundAiQuota(user.id, 'devotional_ai');
      }
      return NextResponse.json({
        success: true,
        data: devotional,
        engine,
        note,
        aiConfigured: isXaiConfigured(),
        premium: usage.unlimited,
        usage,
      });
    } catch (aiErr) {
      if (usage.tracked && user) {
        await refundAiQuota(user.id, 'devotional_ai');
      }
      throw aiErr;
    }
  } catch (error) {
    console.error('Devotional engine error:', error);
    return NextResponse.json(
      { success: false, error: 'Error generando el devocional' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Salvazion Devotional Engine',
    aiConfigured: isXaiConfigured(),
    usage: 'POST with full UserProfile fields (name, language, purpose, birthDate, currentFocus, …)',
  });
}
