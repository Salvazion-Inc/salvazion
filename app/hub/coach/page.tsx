'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import VoiceAgent from '@/components/coach/VoiceAgent';
import { loadProfile } from '@/lib/store/profile';
import { computeScores } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

export default function CoachPage() {
  const { t, lang } = useI18n();
  // Client-only stores: read once per mount via useMemo (no effect setState)
  const profile = useMemo(() => loadProfile(), []);
  const scores = useMemo(() => computeScores(), []);

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="page-header px-5 pt-6 pb-3 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/hub/dashboard" className="back-btn" aria-label={t('common.back')}>
              ←
            </Link>
            <div
              className="w-9 h-9 rounded-full border border-[var(--border-soft)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404] shrink-0"
              title="Salvazion"
            >
              <Image
                src="/logo-icon.png"
                alt="Salvazion"
                width={36}
                height={36}
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium">
                {t('quota.coachEyebrow')}
              </p>
              <h1 className="text-lg font-bold text-[var(--accent)] leading-tight truncate">
                {lang === 'en' ? 'Coach' : 'Coach'}
              </h1>
              <p className="text-[10px] text-[var(--sage)]/80 truncate">
                {lang === 'en'
                  ? 'Voice · Salvation · Health · Freedom'
                  : 'Voz · Salvation · Health · Freedom'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-2 pb-28 min-h-0 flex flex-col">
        <div className="max-w-lg mx-auto w-full flex-1 min-h-0 flex flex-col">
          <VoiceAgent
            profile={profile}
            scores={scores}
            lang={lang}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
