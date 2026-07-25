'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import {
  BADGE_CATALOG,
  evaluateBadges,
  getEarnedBadgesDetailed,
  getBadgeProgress,
  hasBadge,
  BadgeDef,
  BadgeCategory
} from '@/lib/badges/engine';
import { loadProfile } from '@/lib/store/profile';

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  salvation: 'Salvation',
  health: 'Health',
  freedom: 'Freedom',
  streak: 'Rachas',
  discipline: 'Disciplina',
  special: 'Especiales'
};

export default function BadgesPage() {
  const [earned, setEarned] = useState<(BadgeDef & { earnedAt: string })[]>([]);
  const [progress, setProgress] = useState({ earned: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([]);

  useEffect(() => {
    setMounted(true);
    const profile = loadProfile();
    const newly = evaluateBadges({ onboardingCompleted: profile.onboardingCompleted });
    setNewBadges(newly);
    setEarned(getEarnedBadgesDetailed());
    setProgress(getBadgeProgress());
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#8FD99A] animate-pulse">Cargando insignias...</div>
      </div>
    );
  }

  const categories = Object.keys(CATEGORY_LABELS) as BadgeCategory[];

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="px-5 pt-6 pb-4 border-b border-[#6B8F6E]/20">
        <div className="flex items-center gap-2.5 mb-3">
          <Link href="/hub/dashboard" className="text-[#B7F7AC]/60 text-sm">←</Link>
          <div className="w-9 h-9 rounded-full border border-[#8FD99A]/50 flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#8FD99A]">Insignias</h1>
            <p className="text-[10px] text-[#B7F7AC]/50">Virtud · Constancia · Excelencia</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-white">
            {progress.earned} / {progress.total} desbloqueadas
          </p>
          <div className="h-2 w-32 rounded-full bg-[#6B8F6E]/20 overflow-hidden">
            <div
              className="h-full bg-[#7BC98A] transition-all"
              style={{ width: `${(progress.earned / Math.max(progress.total, 1)) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 overflow-y-auto">
        {/* Newly earned toast list */}
        {newBadges.length > 0 && (
          <div className="mb-5 space-y-2">
            {newBadges.map(b => (
              <div
                key={b.id}
                className="glass rounded-xl p-3 border border-[#8FD99A] flex items-center gap-3 shadow-[0_0_20px_rgba(143, 217, 154,0.15)]"
              >
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-[10px] text-[#8FD99A] uppercase tracking-wider">Nueva insignia</p>
                  <p className="text-sm font-semibold text-white">{b.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="glass rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5 border border-[#8FD99A]/15">
          <div className="w-8 h-8 rounded-full border border-[#8FD99A]/40 flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="León Verde" width={32} height={32} className="object-cover" />
          </div>
          <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
            Las insignias no son trofeos vacíos. Son memoria de decisiones fieles.
            El León solo reconoce lo que se vive con constancia.
          </p>
        </div>

        {categories.map(cat => {
          const badges = BADGE_CATALOG.filter(b => b.category === cat);
          return (
            <section key={cat} className="mb-6">
              <h2 className="text-sm font-semibold text-[#B7F7AC] mb-3">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {badges.map(badge => {
                  const unlocked = hasBadge(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`glass rounded-xl p-3 border transition-all ${
                        unlocked
                          ? 'border-[#8FD99A]/40 bg-[#7BC98A]/5'
                          : 'border-[#6B8F6E]/20 opacity-45'
                      }`}
                    >
                      <div className="text-2xl mb-1.5">{badge.icon}</div>
                      <p className={`text-sm font-medium ${unlocked ? 'text-white' : 'text-[#D8E1D9]/60'}`}>
                        {badge.name}
                      </p>
                      <p className="text-[10px] text-[#B7F7AC]/50 mt-1 leading-snug">
                        {badge.requirement}
                      </p>
                      {unlocked && (
                        <p className="text-[10px] text-[#8FD99A] mt-1.5">✓ Desbloqueada</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <BottomNav variant="badges" />
    </div>
  );
}
