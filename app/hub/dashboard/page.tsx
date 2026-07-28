'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  syncScoresFromServer,
} from '@/lib/scoring/engine';
import { ComputedScores } from '@/lib/scoring/types';
import {
  evaluateBadges,
  getBadgeProgress,
  getEarnedBadgesDetailed,
  BadgeDef,
} from '@/lib/badges/engine';
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
import { PILLAR_COLORS } from '@/lib/theme/pillars';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [scores, setScores] = useState<ComputedScores | null>(null);
  const [mounted, setMounted] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([]);
  const [badgeProgress, setBadgeProgress] = useState({ earned: 0, total: 0 });

  const refresh = useCallback((p?: Partial<UserProfile>, s?: ComputedScores) => {
    const scoresToUse = s || computeScores();
    setScores(scoresToUse);
    const profileToUse = p || loadProfile();
    if (profileToUse) {
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

  const recentBadges = useMemo(() => {
    if (!badgeProgress.earned) return [];
    return getEarnedBadgesDetailed().slice(-4).reverse();
  }, [badgeProgress.earned, newBadges.length]);

  if (!mounted || !profile || !scores) {
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

  const { salvation, health, freedom, global } = scores;

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
        {/* Purpose — above main score ring */}
        {profile.purpose && (
          <div className="w-full max-w-sm card-soft p-4 mb-4">
            <p className="text-xs text-[var(--sage)] mb-1">{t('dashboard.purpose')}</p>
            <p className="text-sm leading-snug line-clamp-3">{profile.purpose}</p>
          </div>
        )}

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
              cx="50" cy="50" r="46" fill="none" stroke="#F5F7F5" strokeWidth="3.2"
              strokeDasharray={`${Math.min(salvation, 100) * 2.89} 289`}
              strokeLinecap="round"
              className="ring-glow transition-all duration-700"
            />
          </svg>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--sage-dim)" strokeWidth="3" opacity="0.25" />
            <circle
              cx="50" cy="50" r="38" fill="none" stroke="#4A9EFF" strokeWidth="2.8"
              strokeDasharray={`${Math.min(health, 100) * 2.39} 239`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="30" fill="none" stroke="var(--sage-dim)" strokeWidth="3" opacity="0.25" />
            <circle
              cx="50" cy="50" r="30" fill="none" stroke="#7BC98A" strokeWidth="2.6"
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
              Icon={BibleIcon}
              ring={PILLAR_COLORS.salvation.solid}
            />
            <PillarCard
              href="/hub/health"
              label={t('nav.health')}
              value={health}
              Icon={HealthIcon}
              ring={PILLAR_COLORS.health.solid}
            />
            <PillarCard
              href="/hub/freedom"
              label={t('nav.freedom')}
              value={freedom}
              Icon={FreedomIcon}
              ring={PILLAR_COLORS.freedom.solid}
            />
          </div>
        </div>

        {/* Weekly score chart */}
        <div className="w-full max-w-sm mb-5">
          <ProgressCharts scores={scores} />
        </div>

        {/* Daily agenda */}
        <div className="w-full max-w-sm mb-5">
          <DailyAgenda onScored={() => refresh(profile || undefined, scores || undefined)} />
        </div>

        {/* Insignias y logros — unified */}
        <div className="w-full max-w-sm mb-2">
          <div className="card-soft p-4">
            <Link
              href="/hub/badges"
              className="flex items-start justify-between gap-3 mb-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BadgesIcon size={28} active />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--off-white)] group-hover:text-[var(--accent)] transition-colors">
                    {t('dashboard.badgesTitle')}
                  </p>
                  <p className="text-[11px] text-[var(--sage)]">
                    {t('dashboard.badgesSub')}
                  </p>
                </div>
              </div>
              <span className="text-[var(--accent)] shrink-0 mt-1">→</span>
            </Link>

            <div className="flex items-center gap-4">
              <BadgeRing earned={badgeProgress.earned} total={badgeProgress.total} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--off-white)]">
                  {badgeProgress.earned}/{badgeProgress.total} {t('charts.unlocked')}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent-fill)] transition-all duration-700"
                    style={{
                      width: `${
                        badgeProgress.total
                          ? (badgeProgress.earned / badgeProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {newBadges.length > 0 && (
              <div className="mt-4 space-y-2">
                {newBadges.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl p-2.5 border border-[var(--border-strong)] bg-[var(--surface)]/60 flex items-center gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.iconSrc}
                      alt=""
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border border-[var(--border-strong)] lion-glow shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--accent)] uppercase tracking-wide">
                        {t('dashboard.newBadge')}
                      </p>
                      <p className="text-sm font-semibold text-white truncate">{b.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recentBadges.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--border-soft)]">
                <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70 mb-2">
                  {t('charts.recentBadges')}
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recentBadges.map((b) => (
                    <div
                      key={b.id}
                      className="shrink-0 w-16 flex flex-col items-center gap-1"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.iconSrc}
                        alt=""
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover border border-[var(--border-strong)] lion-glow"
                      />
                      <p className="text-[9px] text-center text-[var(--off-white)]/85 leading-tight line-clamp-2">
                        {b.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
  Icon,
  ring,
}: {
  href: string;
  label: string;
  value: number;
  Icon: React.FC<{ size?: number; active?: boolean; color?: string }>;
  ring: string;
}) {
  return (
    <Link
      href={href}
      className="card-soft p-3 text-center transition-all active:scale-[0.98] min-h-[100px] flex flex-col items-center justify-center gap-1"
      style={{
        borderColor: `color-mix(in srgb, ${ring} 45%, transparent)`,
        background: `color-mix(in srgb, ${ring} 8%, #040404)`,
      }}
    >
      <Icon size={26} active color={ring} />
      <p className="text-[10px] uppercase tracking-wider" style={{ color: ring, opacity: 0.85 }}>
        {label}
      </p>
      <p className="text-2xl font-bold leading-none" style={{ color: ring }}>
        {value}
      </p>
    </Link>
  );
}

function BadgeRing({
  earned,
  total,
  size = 72,
}: {
  earned: number;
  total: number;
  size?: number;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const pct = total ? earned / total : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--border-soft)"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${pct * c} ${c}`}
        transform="rotate(-90 50 50)"
        className="transition-all duration-700"
        style={{
          filter: 'drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 40%, transparent))',
        }}
      />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--off-white)"
        fontSize="18"
        fontWeight="700"
        fontFamily="var(--font-cosmic-octo), system-ui"
      >
        {earned}
      </text>
    </svg>
  );
}
