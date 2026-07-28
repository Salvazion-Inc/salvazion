import { NextRequest, NextResponse } from 'next/server';
import {
  generateDevotionalAsync,
  generateDevotionalRules,
  isXaiConfigured,
} from '@/lib/devotional-engine';
import { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/billing/subscription';

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

    // Premium unlocks AI devotionals; free uses rules engine
    let premium = false;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const ent = await getEntitlementForUser(user.id, user.email);
        premium = ent.isPremium;
      }
    } catch {
      // ignore
    }

    const profile: UserProfile = {
      name: sanitize(body.name, 80) || (body.language === 'en' ? 'Brother' : 'Hermano'),
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
        : body.language === 'en'
          ? 'kjv'
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

    if (!premium) {
      return NextResponse.json({
        success: true,
        data: generateDevotionalRules(profile, date),
        engine: 'salvazion-rules-v1',
        note:
          profile.language === 'en'
            ? 'Free plan: rules-based daily devotional. Upgrade to Premium for AI devotionals.'
            : 'Plan Free: devocional diario por reglas. Mejora a Premium para devocionales con IA.',
        aiConfigured: isXaiConfigured(),
        premium: false,
      });
    }

    const { devotional, engine, note } = await generateDevotionalAsync(profile, date);

    return NextResponse.json({
      success: true,
      data: devotional,
      engine,
      note,
      aiConfigured: isXaiConfigured(),
      premium: true,
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
    aiConfigured: isXaiConfigured(),
    usage: 'POST with full UserProfile fields (name, language, purpose, birthDate, currentFocus, …)',
  });
}
