import { NextRequest, NextResponse } from 'next/server';
import { generateDevotional } from '@/lib/devotional-engine';
import { UserProfile } from '@/lib/types';

/** Basic sanitization for free-text fields */
function sanitize(str: unknown, maxLen = 200): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Rate-limit style guard: reject oversized payloads
    if (JSON.stringify(body).length > 4000) {
      return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 });
    }

    const profile: UserProfile = {
      name: sanitize(body.name, 80) || 'Hermano',
      language: body.language === 'en' ? 'en' : 'es',
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
      preferredBibleVersion: ['rv1960', 'kjv', 'original'].includes(body.preferredBibleVersion)
        ? body.preferredBibleVersion
        : 'rv1960',
      purpose: '',
      city: '',
      country: '',
      birthDate: '',
      familyLinks: [],
      friendsLinks: [],
      hasAcceptedLionCoach: true,
      onboardingCompleted: true,
    };

    const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : new Date().toISOString().slice(0, 10);

    const devotional = generateDevotional(profile, date);

    return NextResponse.json({
      success: true,
      data: devotional,
      engine: 'salvazion-rule-based-v1',
      note: 'Motor de reglas + matching inteligente. Listo para upgrade a LLM real.',
    });
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
    usage: 'POST with UserProfile body',
    example: {
      name: 'Juan Pérez',
      language: 'es',
      spiritualMaturity: 'growing',
      familyStatus: 'parent',
      currentFocus: ['familia', 'fe', 'proposito'],
      struggles: ['perseverancia'],
    },
  });
}
