'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadProfile, loadProfileAsync, calculateAge, getLifeStage, getLifeStageLabel } from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';
import { computeScores, logAction, ACTION_CATALOG, resetScores, getPointsForAction, syncScoresFromServer } from '@/lib/scoring/engine';
import { ComputedScores } from '@/lib/scoring/types';
import { generateCoachGuidance, CoachMessage } from '@/lib/coach/engine';
import { evaluateBadges, getBadgeProgress, getEarnedBadgesDetailed, BadgeDef } from '@/lib/badges/engine';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [scores, setScores] = useState<ComputedScores | null>(null);
  const [coach, setCoach] = useState<CoachMessage | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([]);
  const [badgeProgress, setBadgeProgress] = useState({ earned: 0, total: 0 });

  const refresh = useCallback((p?: Partial<UserProfile>, s?: ComputedScores) => {
    const scoresToUse = s || computeScores();
    setScores(scoresToUse);
    const profileToUse = p || loadProfile();
    if (profileToUse) {
      setCoach(generateCoachGuidance(profileToUse, scoresToUse));
      const newly = evaluateBadges({ onboardingCompleted: profileToUse.onboardingCompleted });
      if (newly.length) setNewBadges(newly);
      setBadgeProgress(getBadgeProgress());
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const p = await loadProfileAsync();
      if (!p?.onboardingCompleted) {
        router.replace('/hub/onboarding');
        return;
      }
      setProfile(p);
      // Sync scores from Supabase first (multi-device), then render
      const synced = await syncScoresFromServer();
      refresh(p, synced);
    })();
  }, [router, refresh]);

  const handleLog = (actionType: string) => {
    const result = logAction(actionType);
    if (result) {
      setScores(result);
      if (profile) {
        setCoach(generateCoachGuidance(profile, result));
        const newly = evaluateBadges({ onboardingCompleted: profile.onboardingCompleted });
        if (newly.length) setNewBadges(prev => [...newly, ...prev].slice(0, 5));
        setBadgeProgress(getBadgeProgress());
      }
    }
  };

  if (!mounted || !profile || !scores || !coach) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#00F511] text-lg animate-pulse">El León se prepara...</div>
      </div>
    );
  }

  const { salvation, health, freedom, global, multipliers, streaks, todayActions } = scores;

  const toneStyles = {
    encourage: 'border-[#00F511]/40',
    discipline: 'border-amber-500/50',
    challenge: 'border-[#00F511]/60',
    celebrate: 'border-[#00F511] shadow-[0_0_20px_rgba(0,245,17,0.15)]'
  };

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border border-[#00F511]/40 flex items-center justify-center lion-glow">
            <span className="text-lg">🦁</span>
          </div>
          <div>
            <p className="text-xs text-[#B7F7AC]/60">Salvazion</p>
            <p className="text-sm font-medium leading-tight">
              {profile.name || 'Hermano'}
              {profile.birthDate && calculateAge(profile.birthDate) !== null && (
                <span className="text-[#B7F7AC]/50 font-normal text-xs ml-1.5">
                  · {calculateAge(profile.birthDate)} años · {getLifeStageLabel(getLifeStage(calculateAge(profile.birthDate)))}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full border border-[#00B10C]/40 text-[#B7F7AC]">
            Solana
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-5 pt-4 pb-32">
        {/* ===== LEÓN VERDE COACH ===== */}
        <div className={`w-full max-w-sm glass rounded-2xl p-4 mb-5 border ${toneStyles[coach.tone]}`}>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full border border-[#00F511]/50 flex items-center justify-center flex-shrink-0 lion-glow bg-[#00F511]/5">
              <span className="text-xl">🦁</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[#00F511] mb-0.5">
                León Verde · Coach
              </p>
              <h3 className="text-sm font-semibold text-white leading-snug mb-1.5">
                {coach.title}
              </h3>
              <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
                {coach.body}
              </p>

              {coach.recommendedAction && (
                <button
                  onClick={() => handleLog(coach.recommendedAction!.type)}
                  className="mt-3 w-full py-2.5 rounded-xl bg-[#00F511] text-[#040404] text-sm font-semibold hover:bg-[#B7F7AC] transition-all"
                >
                  {coach.recommendedAction.label} · +{coach.recommendedAction.points}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* New badges */}
        {newBadges.length > 0 && (
          <div className="w-full max-w-sm space-y-2 mb-4">
            {newBadges.map(b => (
              <div key={b.id} className="glass rounded-xl p-3 border border-[#00F511] flex items-center gap-3">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-[10px] text-[#00F511] uppercase">Nueva insignia</p>
                  <p className="text-sm font-semibold text-white">{b.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rings */}
        <div className="relative w-60 h-60 flex items-center justify-center mb-5">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#00B10C" strokeWidth="3" opacity="0.2" />
            <circle
              cx="50" cy="50" r="46" fill="none" stroke="#00F511" strokeWidth="3.5"
              strokeDasharray={`${Math.min(salvation, 100) * 2.89} 289`}
              strokeLinecap="round"
              className="ring-glow transition-all duration-700"
            />
          </svg>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#00B10C" strokeWidth="3" opacity="0.2" />
            <circle
              cx="50" cy="50" r="38" fill="none" stroke="#00F511" strokeWidth="3"
              strokeDasharray={`${Math.min(health, 100) * 2.39} 239`}
              strokeLinecap="round"
              opacity="0.9"
              className="transition-all duration-700"
            />
          </svg>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" fill="none" stroke="#00B10C" strokeWidth="3" opacity="0.2" />
            <circle
              cx="50" cy="50" r="30" fill="none" stroke="#B7F7AC" strokeWidth="3"
              strokeDasharray={`${Math.min(freedom, 100) * 1.88} 188`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>

          <div className="text-center z-10">
            <div className="text-5xl font-bold text-white tracking-tighter">{global}</div>
            <div className="text-xs uppercase tracking-widest text-[#B7F7AC]/70 mt-1">
              Salvazion Score
            </div>
            <div className="text-[10px] text-[#00F511] font-medium">GLOBAL</div>
          </div>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-5">
          <ScoreCard label="Salvation" value={salvation} streak={streaks.salvation} multiplier={multipliers.salvation} />
          <ScoreCard label="Health" value={health} streak={streaks.health} multiplier={multipliers.health} />
          <ScoreCard label="Freedom" value={freedom} streak={streaks.freedom} multiplier={multipliers.freedom} />
        </div>

        {/* Purpose */}
        {profile.purpose && (
          <div className="w-full max-w-sm glass rounded-2xl p-4 mb-4">
            <p className="text-xs text-[#B7F7AC]/60 mb-1">Tu propósito</p>
            <p className="text-sm leading-snug line-clamp-2">{profile.purpose}</p>
          </div>
        )}

        {/* Quick links */}
        <div className="w-full max-w-sm space-y-3 mb-4">
          <Link
            href="/hub/devotional"
            className="flex items-center justify-between glass rounded-xl px-4 py-3.5 hover:border-[#00F511]/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📖</span>
              <div>
                <p className="text-sm font-medium">Devocional de Hoy</p>
                <p className="text-xs text-[#B7F7AC]/50">+ Salvation</p>
              </div>
            </div>
            <span className="text-[#00F511]">→</span>
          </Link>

          <Link
            href="/hub/health"
            className="flex items-center justify-between glass rounded-xl px-4 py-3.5 hover:border-[#00F511]/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-sm font-medium">Health</p>
                <p className="text-xs text-[#B7F7AC]/50">Ejercicio · Sol · Sueño · Alimentación</p>
              </div>
            </div>
            <span className="text-[#00F511]">→</span>
          </Link>

          <Link
            href="/hub/calendar"
            className="flex items-center justify-between glass rounded-xl px-4 py-3.5 hover:border-[#00F511]/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-sm font-medium">Calendario de disciplina</p>
                <p className="text-xs text-[#B7F7AC]/50">Salvation · Health · Freedom</p>
              </div>
            </div>
            <span className="text-[#00F511]">→</span>
          </Link>


          <Link
            href="/hub/badges"
            className="flex items-center justify-between glass rounded-xl px-4 py-3.5 hover:border-[#00F511]/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏅</span>
              <div>
                <p className="text-sm font-medium">Insignias</p>
                <p className="text-xs text-[#B7F7AC]/50">Virtud y constancia</p>
              </div>
            </div>
            <span className="text-[#00F511]">→</span>
          </Link>

          <button
            onClick={() => setShowActions(!showActions)}
            className="w-full flex items-center justify-between glass rounded-xl px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-sm font-medium">Registrar acción</p>
                <p className="text-xs text-[#B7F7AC]/50">
                  {todayActions.length} acción{todayActions.length !== 1 ? 'es' : ''} hoy
                </p>
              </div>
            </div>
            <span className="text-[#00F511]">{showActions ? '−' : '+'}</span>
          </button>
        </div>

        {showActions && (
          <div className="w-full max-w-sm glass rounded-2xl p-4 space-y-2 mb-4">
            <p className="text-xs text-[#B7F7AC]/60 mb-2">Acciones rápidas</p>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {Object.entries(ACTION_CATALOG).map(([key, val]) => {
                const stage = profile.birthDate
                  ? getLifeStage(calculateAge(profile.birthDate))
                  : 'adult';
                const pts = getPointsForAction(key, stage);
                if (pts <= 0) return null;
                return (
                <button
                  key={key}
                  onClick={() => handleLog(key)}
                  className="flex justify-between items-center text-left px-3 py-2 rounded-lg border border-[#00B10C]/30 hover:border-[#00F511]/50 text-sm"
                >
                  <span className="truncate pr-2">{val.label}</span>
                  <span className="text-[#00F511] text-xs whitespace-nowrap">
                    +{pts}
                  </span>
                </button>
                );
              })}
            </div>
            <button
              onClick={async () => {
                await resetScores();
                refresh();
              }}
              className="w-full text-xs text-red-400/70 mt-2 py-1"
            >
              Reset scores (demo)
            </button>
          </div>
        )}

        {todayActions.length > 0 && (
          <div className="w-full max-w-sm">
            <p className="text-xs text-[#B7F7AC]/50 mb-2">Hoy</p>
            <div className="space-y-1.5">
              {todayActions.slice(-5).reverse().map(a => (
                <div key={a.id} className="flex justify-between text-xs px-2">
                  <span className="text-[#D8E1D9]/70 truncate">{a.label}</span>
                  <span className="text-[#00F511]">+{a.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#040404]/95 border-t border-[#00B10C]/25 backdrop-blur-md px-6 py-3">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavItem href="/hub/dashboard" label="Home" icon="🏠" active />
          <NavItem href="/hub/bible" label="Bible" icon="📖" />
          <NavItem href="/hub/health" label="Health" icon="⚡" />
          <NavItem href="/hub/freedom" label="Freedom" icon="📚" />
          <NavItem href="/hub/profile" label="Profile" icon="👤" />
        </div>
      </nav>
    </div>
  );
}

function ScoreCard({
  label, value, streak, multiplier
}: { label: string; value: number; streak: number; multiplier: number }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[#B7F7AC]/60 mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#00F511]">{value}</p>
      {streak > 0 && (
        <p className="text-[10px] text-[#B7F7AC]/50 mt-0.5">
          {streak}d · ×{multiplier.toFixed(2)}
        </p>
      )}
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
