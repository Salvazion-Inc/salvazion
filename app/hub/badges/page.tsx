'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
        <div className="text-[#00F511] animate-pulse">Cargando insignias...</div>
      </div>
    );
  }

  const categories = Object.keys(CATEGORY_LABELS) as BadgeCategory[];

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="px-5 pt-6 pb-4 border-b border-[#00B10C]/20">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/hub/dashboard" className="text-[#B7F7AC]/60 text-sm">←</Link>
          <div className="w-8 h-8 rounded-full border border-[#00F511]/40 flex items-center justify-center lion-glow">
            <span className="text-sm">🦁</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#00F511]">Insignias</h1>
            <p className="text-[10px] text-[#B7F7AC]/50">Virtud · Constancia · Excelencia</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-white">
            {progress.earned} / {progress.total} desbloqueadas
          </p>
          <div className="h-2 w-32 rounded-full bg-[#00B10C]/20 overflow-hidden">
            <div
              className="h-full bg-[#00F511] transition-all"
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
                className="glass rounded-xl p-3 border border-[#00F511] flex items-center gap-3 shadow-[0_0_20px_rgba(0,245,17,0.15)]"
              >
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-[10px] text-[#00F511] uppercase tracking-wider">Nueva insignia</p>
                  <p className="text-sm font-semibold text-white">{b.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="glass rounded-xl px-4 py-3 mb-5 flex items-start gap-2 border border-[#00F511]/15">
          <span className="text-sm">🦁</span>
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
                          ? 'border-[#00F511]/40 bg-[#00F511]/5'
                          : 'border-[#00B10C]/20 opacity-45'
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
                        <p className="text-[10px] text-[#00F511] mt-1.5">✓ Desbloqueada</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#040404]/95 border-t border-[#00B10C]/25 backdrop-blur-md px-4 py-3">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavItem href="/hub/dashboard" label="Home" icon="🏠" />
          <NavItem href="/hub/health" label="Health" icon="⚡" />
          <NavItem href="/hub/calendar" label="Agenda" icon="📅" />
          <NavItem href="/hub/badges" label="Insignias" icon="🏅" active />
          <NavItem href="/hub/devotional" label="Devocional" icon="✝️" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active?: boolean }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5">
      <span className={`text-xl ${active ? 'opacity-100' : 'opacity-50'}`}>{icon}</span>
      <span className={`text-[10px] ${active ? 'text-[#00F511]' : 'text-[#B7F7AC]/50'}`}>{label}</span>
    </Link>
  );
}
