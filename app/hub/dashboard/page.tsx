'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  loadProfile,
  loadProfileAsync,
  calculateAge,
  getLifeStage,
  getLifeStageLabel,
} from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';
import {
  computeScores,
  logAction,
  syncScoresFromServer,
} from '@/lib/scoring/engine';
import { ComputedScores } from '@/lib/scoring/types';
import { generateCoachGuidance, CoachMessage } from '@/lib/coach/engine';
import { evaluateBadges, getBadgeProgress, BadgeDef } from '@/lib/badges/engine';
import BottomNav from '@/components/BottomNav';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { useI18n } from '@/components/I18nProvider';
import {
  HealthIcon,
  FreedomIcon,
  BibleIcon,
  BadgesIcon,
} from '@/components/Icons';
import ProgressCharts from '@/components/progress/ProgressCharts';
import DailyAgenda from '@/components/calendar/DailyAgenda';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [scores, setScores] = useState<ComputedScores | null>(null);
  const [coach, setCoach] = useState<CoachMessage | null>(null);
  const [mounted, setMounted] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([]);
  const [badgeProgress, setBadgeProgress] = useState({ earned: 0, total: 0 });

  const refresh = useCallback((p?: Partial<UserProfile>, s?: ComputedScores) => {
    const scoresToUse = s || computeScores();
    setScores(scoresToUse);
    const profileToUse = p || loadProfile();
    if (profileToUse) {
      setCoach(generateCoachGuidance(profileToUse, scoresToUse));
      const newly = evaluateBadges({
        onboardingCompleted: profileToUse.onboardingCompleted,
      });
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
        const newly = evaluateBadges({
          onboardingCompleted: profile.onboardingCompleted,
        });
        if (newly.length) setNewBadges((prev) => [...newly, ...prev].slice(0, 5));
        setBadgeProgress(getBadgeProgress());
      }
    }
  };

  if (!mounted || !profile || !scores || !coach) {
    return (
      <div className="min-h-screen bg-[var(--true-black)] flex items-center justify-center">
        <div
          className="text-[var(--accent)] text-lg animate-pulse"
          aria-live="polite"
        >
          {t('common.lionPreparing')}
        </div>
      </div>
    );
  }

  const {
    salvation,
    health,
    freedom,
    global,
    multipliers,
    streaks,
  } = scores;

  const toneStyles = {
    encourage: 'border-[var(--border-strong)]',
    discipline: 'border-amber-500/40',
    challenge: 'border-[var(--accent)]/50',
    celebrate:
      'border-[var(--accent)]/60 shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_12%,transparent)]',
  };

  const scoreLabel = `${t('dashboard.salvazionScore')} ${global}: ${t('nav.salvation')} ${salvation}, ${t('nav.health')} ${health}, ${t('nav.freedom')} ${freedom}`;

  return (
    <div className="min-h-screen bg-[var(--true-black)] text-[var(--off-white)] flex flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-2 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/hub/profile" className="shrink-0" title={t('nav.profile')}>
            <ProfileAvatar
              avatarUrl={profile.avatarUrl}
              name={profile.name || 'Brother'}
              size="sm"
              editable={false}
            />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-[var(--sage)] tracking-wide">Salvazion</p>
            <p className="text-sm font-medium leading-tight truncate">
              {profile.name || 'Brother'}
              {profile.birthDate && calculateAge(profile.birthDate) !== null && (
                <span className="text-[var(--sage)]/70 font-normal text-xs ml-1.5">
                  · {calculateAge(profile.birthDate)} ·{' '}
                  {getLifeStageLabel(
                    getLifeStage(calculateAge(profile.birthDate))
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
        <WalletConnectCard variant="compact" />
      </header>

      <main className="flex-1 flex flex-col items-center px-5 pt-3 pb-32 max-w-lg mx-auto w-full">
        {/* Score dashboard */}
        <div
          className="relative w-52 h-52 flex items-center justify-center mb-3"
          role="img"
          aria-label={scoreLabel}
        >
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--sage-dim)" strokeWidth="3" opacity="0.25" />
            <circle
              cx="50" cy="50" r="46" fill="none" stroke="var(--accent)" strokeWidth="3.2"
              strokeDasharray={`${Math.min(salvation, 100) * 2.89} 289`}
              strokeLinecap="round"
              className="ring-glow transition-all duration-700"
            />
          </svg>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--sage-dim)" strokeWidth="3" opacity="0.25" />
            <circle
              cx="50" cy="50" r="38" fill="none" stroke="var(--soft-green)" strokeWidth="2.8"
              strokeDasharray={`${Math.min(health, 100) * 2.39} 239`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="30" fill="none" stroke="var(--sage-dim)" strokeWidth="3" opacity="0.25" />
            <circle
              cx="50" cy="50" r="30" fill="none" stroke="var(--accent-hover)" strokeWidth="2.6"
              strokeDasharray={`${Math.min(freedom, 100) * 1.88} 188`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="text-center z-10">
            <div className="font-display text-5xl font-bold text-white tracking-tighter">
              {global}
            </div>
            <div className="text-xs uppercase tracking-widest text-[var(--sage)] mt-1">
              {t('dashboard.salvazionScore')}
            </div>
            <div className="text-[10px] text-[var(--accent)] font-medium">
              {t('dashboard.global')}
              {badgeProgress.total > 0 && (
                <span className="text-[var(--sage)] font-normal">
                  {' '}
                  · {badgeProgress.earned}/{badgeProgress.total}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pillars */}
        <div className="w-full max-w-sm mb-4">
          <div className="grid grid-cols-3 gap-2.5">
            <PillarCard
              href="/hub/bible"
              label={t('nav.salvation')}
              value={salvation}
              streak={streaks.salvation}
              multiplier={multipliers.salvation}
              Icon={BibleIcon}
              ring="var(--accent)"
            />
            <PillarCard
              href="/hub/health"
              label={t('nav.health')}
              value={health}
              streak={streaks.health}
              multiplier={multipliers.health}
              Icon={HealthIcon}
              ring="var(--soft-green)"
            />
            <PillarCard
              href="/hub/freedom"
              label={t('nav.freedom')}
              value={freedom}
              streak={streaks.freedom}
              multiplier={multipliers.freedom}
              Icon={FreedomIcon}
              ring="var(--accent-hover)"
            />
          </div>
        </div>

        {/* Progress charts */}
        <div className="w-full max-w-sm mb-5">
          <ProgressCharts scores={scores} variant="full" />
        </div>

        {/* Daily agenda blocks */}
        <div className="w-full max-w-sm mb-5">
          <DailyAgenda onScored={() => refresh(profile)} />
        </div>

        {/* Coach compact */}
        <div
          className={`w-full max-w-sm glass rounded-2xl p-4 mb-4 ${toneStyles[coach.tone]}`}
        >
          <div className="flex items-start gap-3">
            <Link
              href="/hub/coach"
              className="w-12 h-12 rounded-full border border-[var(--border-strong)] flex-shrink-0 lion-glow overflow-hidden bg-[var(--true-black)] relative"
            >
              <Image
                src="/coach/leon-verde-thumb.jpg"
                alt={t('coach.agentLabel')}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-0.5">
                {t('coach.agentLabel')}
              </p>
              <h3 className="text-sm font-semibold text-white leading-snug mb-1">
                {coach.title}
              </h3>
              <p className="text-xs text-[var(--off-white)]/80 leading-relaxed line-clamp-2">
                {coach.body}
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {coach.recommendedAction && (
                  <button
                    type="button"
                    onClick={() => handleLog(coach.recommendedAction!.type)}
                    className="btn-primary flex-1 min-w-[7rem] py-2 text-sm"
                  >
                    {coach.recommendedAction.label} · +
                    {coach.recommendedAction.points}
                  </button>
                )}
                <Link
                  href="/hub/coach"
                  className="btn-secondary flex-1 min-w-[7rem] py-2 text-sm text-center"
                >
                  {t('coach.talk')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {newBadges.length > 0 && (
          <div className="w-full max-w-sm space-y-2 mb-4">
            {newBadges.map((b) => (
              <div
                key={b.id}
                className="glass rounded-xl p-3 border-[var(--border-strong)] flex items-center gap-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.iconSrc}
                  alt=""
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border border-[var(--border-strong)] lion-glow shrink-0"
                />
                <div>
                  <p className="text-[10px] text-[var(--accent)] uppercase">
                    {t('dashboard.newBadge')}
                  </p>
                  <p className="text-sm font-semibold text-white">{b.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {profile.purpose && (
          <div className="w-full max-w-sm card-soft p-4 mb-4">
            <p className="text-xs text-[var(--sage)] mb-1">{t('dashboard.purpose')}</p>
            <p className="text-sm leading-snug line-clamp-2">{profile.purpose}</p>
          </div>
        )}

        <div className="w-full max-w-sm mb-2">
          <Link
            href="/hub/badges"
            className="flex items-center justify-between card-soft px-4 py-3.5 hover:border-[var(--border-strong)] transition-all min-h-[52px]"
          >
            <div className="flex items-center gap-3">
              <BadgesIcon size={28} active />
              <div>
                <p className="text-sm font-medium">{t('dashboard.badgesTitle')}</p>
                <p className="text-xs text-[var(--sage)]">
                  {badgeProgress.earned}/{badgeProgress.total}
                </p>
              </div>
            </div>
            <span className="text-[var(--accent)]">→</span>
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function PillarCard({
  href,
  label,
  value,
  streak,
  multiplier,
  Icon,
  ring,
}: {
  href: string;
  label: string;
  value: number;
  streak: number;
  multiplier: number;
  Icon: React.FC<{ size?: number; active?: boolean }>;
  ring: string;
}) {
  return (
    <Link
      href={href}
      className="card-soft p-3 text-center hover:border-[var(--border-strong)] transition-all active:scale-[0.98] min-h-[100px] flex flex-col items-center justify-center gap-1"
      style={{ borderColor: `color-mix(in srgb, ${ring} 40%, transparent)` }}
    >
      <Icon size={26} active />
      <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">{label}</p>
      <p className="text-2xl font-bold leading-none" style={{ color: ring }}>
        {value}
      </p>
      {streak > 0 && (
        <p className="text-[10px] text-[var(--sage)]/70">
          {streak}d · ×{multiplier.toFixed(2)}
        </p>
      )}
    </Link>
  );
}
