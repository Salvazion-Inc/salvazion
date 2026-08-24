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
  syncBadgesFromServer,
  BadgeDef,
  BadgeCategory,
} from '@/lib/badges/engine';
import {
  getLifetimePoints,
  getTodayPointsRaw,
  computeScores,
} from '@/lib/scoring/engine';
import { loadProfile } from '@/lib/store/profile';
import BrandMarkIcon from '@/components/BrandMarkIcon';
import BrandLoader from '@/components/ui/BrandLoader';
import { useI18n } from '@/components/I18nProvider';
import { PILLAR_COLORS } from '@/lib/theme/pillars';

const CATEGORY_LABELS_ES: Record<BadgeCategory, string> = {
  salvation: 'Salvation',
  health: 'Health',
  freedom: 'Freedom',
  streak: 'Rachas',
  discipline: 'Disciplina',
  special: 'Especiales',
};

const CATEGORY_LABELS_EN: Record<BadgeCategory, string> = {
  salvation: 'Salvation',
  health: 'Health',
  freedom: 'Freedom',
  streak: 'Streaks',
  discipline: 'Discipline',
  special: 'Special',
};

const CATEGORY_LABELS_PT: Record<BadgeCategory, string> = {
  salvation: 'Salvation',
  health: 'Health',
  freedom: 'Freedom',
  streak: 'Sequências',
  discipline: 'Disciplina',
  special: 'Especiais',
};

export default function BadgesPage() {
  const { t, lang } = useI18n();
  const [earned, setEarned] = useState<(BadgeDef & { earnedAt: string })[]>([]);
  const [progress, setProgress] = useState({ earned: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([]);
  const [lifetime, setLifetime] = useState({
    total: 0,
    salvation: 0,
    health: 0,
    freedom: 0,
    actionCount: 0,
  });
  const [todayPts, setTodayPts] = useState({
    total: 0,
    salvation: 0,
    health: 0,
    freedom: 0,
    actionCount: 0,
  });
  const [scores, setScores] = useState({
    global: 0,
    salvation: 0,
    health: 0,
    freedom: 0,
  });

  useEffect(() => {
    setMounted(true);
    (async () => {
      await syncBadgesFromServer();
      const profile = loadProfile();
      const newly = evaluateBadges({
        onboardingCompleted: profile.onboardingCompleted,
      });
      setNewBadges(newly);
      setEarned(getEarnedBadgesDetailed());
      setProgress(getBadgeProgress());
      setLifetime(getLifetimePoints());
      setTodayPts(getTodayPointsRaw());
      const s = computeScores();
      setScores({
        global: s.global,
        salvation: s.salvation,
        health: s.health,
        freedom: s.freedom,
      });
    })();
  }, []);

  if (!mounted) {
    return <BrandLoader fullscreen />;
  }

  const categoryLabels =
    lang === 'en' ? CATEGORY_LABELS_EN : lang === 'pt' ? CATEGORY_LABELS_PT : CATEGORY_LABELS_ES;
  const categories = Object.keys(categoryLabels) as BadgeCategory[];

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="px-5 pt-6 pb-4 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-2.5 mb-3">
          <Link href="/hub/dashboard" className="text-[var(--sage)] text-sm">
            ←
          </Link>
          <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
            <Image
              src="/logo-icon.png"
              alt="Salvazion"
              width={36}
              height={36}
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#8FD99A]">
              {t('dashboard.badgesTitle')}
            </h1>
            <p className="text-[10px] text-[var(--sage)]/80">
              {t('dashboard.badgesSub')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white">
            {progress.earned} / {progress.total}{' '}
            {lang === 'en' ? 'unlocked' : lang === 'pt' ? 'desbloqueadas' : 'desbloqueadas'}
          </p>
          <div className="h-2 w-32 rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full bg-[#7BC98A] transition-all"
              style={{
                width: `${(progress.earned / Math.max(progress.total, 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 overflow-y-auto">
        {/* Points summary */}
        <section className="mb-5 grid grid-cols-2 gap-2.5">
          <div className="glass rounded-xl p-3.5 border border-[var(--border-soft)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
              {t('dashboard.pointsLabel')} · {t('dashboard.today')}
            </p>
            <p className="text-2xl font-bold text-[#8FD99A] tabular-nums mt-0.5">
              +{todayPts.total}
            </p>
            <p className="text-[10px] text-[var(--sage)]/75 mt-1 tabular-nums">
              {todayPts.actionCount} {t('dashboard.actionsToday')}
            </p>
            <div className="flex gap-2 mt-2 text-[10px] tabular-nums">
              <span style={{ color: PILLAR_COLORS.salvation.solid }}>
                S {todayPts.salvation}
              </span>
              <span style={{ color: PILLAR_COLORS.health.solid }}>
                H {todayPts.health}
              </span>
              <span style={{ color: PILLAR_COLORS.freedom.solid }}>
                F {todayPts.freedom}
              </span>
            </div>
          </div>
          <div className="glass rounded-xl p-3.5 border border-[var(--border-soft)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
              {t('dashboard.pointsLifetime')}
            </p>
            <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
              {lifetime.total}
            </p>
            <p className="text-[10px] text-[var(--sage)]/75 mt-1 tabular-nums">
              {lifetime.actionCount}{' '}
              {lang === 'en' ? 'actions total' : lang === 'pt' ? 'ações no total' : 'acciones total'}
            </p>
            <div className="flex gap-2 mt-2 text-[10px] tabular-nums">
              <span style={{ color: PILLAR_COLORS.salvation.solid }}>
                S {lifetime.salvation}
              </span>
              <span style={{ color: PILLAR_COLORS.health.solid }}>
                H {lifetime.health}
              </span>
              <span style={{ color: PILLAR_COLORS.freedom.solid }}>
                F {lifetime.freedom}
              </span>
            </div>
          </div>
        </section>

        {/* Live scores */}
        <div className="glass rounded-xl px-3.5 py-3 mb-5 border border-[var(--border-soft)] flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
              {t('dashboard.salvazionScore')}
            </p>
            <p className="text-xl font-bold text-white tabular-nums">
              {scores.global}
            </p>
          </div>
          <div className="flex gap-2 text-center">
            {(
              [
                {
                  k: 'S',
                  v: scores.salvation,
                  c: PILLAR_COLORS.salvation.solid,
                },
                { k: 'H', v: scores.health, c: PILLAR_COLORS.health.solid },
                { k: 'F', v: scores.freedom, c: PILLAR_COLORS.freedom.solid },
              ] as const
            ).map((p) => (
              <div
                key={p.k}
                className="rounded-lg px-2.5 py-1.5 border min-w-[3rem]"
                style={{
                  borderColor: `color-mix(in srgb, ${p.c} 35%, transparent)`,
                  background: `color-mix(in srgb, ${p.c} 10%, transparent)`,
                }}
              >
                <p className="text-[9px] uppercase" style={{ color: p.c }}>
                  {p.k}
                </p>
                <p
                  className="text-sm font-bold tabular-nums"
                  style={{ color: p.c }}
                >
                  {p.v}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Newly earned toast list */}
        {newBadges.length > 0 && (
          <div className="mb-5 space-y-2">
            {newBadges.map((b) => (
              <div
                key={b.id}
                className="glass rounded-xl p-3 border border-[#8FD99A] flex items-center gap-3 shadow-[0_0_20px_rgba(143, 217, 154,0.15)]"
              >
                <BrandMarkIcon
                  src={b.iconSrc}
                  alt={b.name}
                  fallback={b.icon}
                  size={44}
                />
                <div>
                  <p className="text-[10px] text-[var(--accent)] uppercase tracking-wider">
                    {t('dashboard.newBadge')}
                  </p>
                  <p className="text-sm font-semibold text-white">{b.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="glass rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5 border border-[var(--border-soft)]">
          <div className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[#040404]">
            <Image
              src="/logo-icon.png"
              alt="Salvazion"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
            {lang === 'en'
              ? 'Badges are not empty trophies. They are memory of faithful decisions. Salvazion AI only recognizes what is lived with consistency.'
              : lang === 'pt'
                ? 'As insígnias não são troféus vazios. São memória de decisões fiéis. A Salvazion AI só reconhece o que se vive com constância.'
                : 'Las insignias no son trofeos vacíos. Son memoria de decisiones fieles. Salvazion AI solo reconoce lo que se vive con constancia.'}
          </p>
        </div>

        {earned.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-[var(--sage)] mb-3">
              {lang === 'en'
                ? 'Recently unlocked'
                : lang === 'pt'
                  ? 'Recém desbloqueadas'
                  : 'Recién desbloqueadas'}
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
              {[...earned]
                .reverse()
                .slice(0, 6)
                .map((b) => (
                  <div
                    key={b.id + b.earnedAt}
                    className="glass rounded-xl p-2.5 border border-[var(--border-strong)] min-w-[7.5rem] shrink-0"
                  >
                    <BrandMarkIcon
                      src={b.iconSrc}
                      alt={b.name}
                      fallback={b.icon}
                      size={36}
                    />
                    <p className="text-xs font-medium text-white mt-1.5 line-clamp-2">
                      {b.name}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {categories.map((cat) => {
          const badges = BADGE_CATALOG.filter((b) => b.category === cat);
          return (
            <section key={cat} className="mb-6">
              <h2 className="text-sm font-semibold text-[var(--sage)] mb-3">
                {categoryLabels[cat]}
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {badges.map((badge) => {
                  const unlocked = hasBadge(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`glass rounded-xl p-3 border transition-all ${
                        unlocked
                          ? 'border-[var(--border-strong)] bg-[var(--surface-active)]'
                          : 'border-[var(--border-soft)] opacity-45'
                      }`}
                    >
                      <div className="mb-2">
                        <BrandMarkIcon
                          src={badge.iconSrc}
                          alt={badge.name}
                          fallback={badge.icon}
                          size={48}
                          muted={!unlocked}
                        />
                      </div>
                      <p
                        className={`text-sm font-medium ${
                          unlocked ? 'text-white' : 'text-[#D8E1D9]/60'
                        }`}
                      >
                        {badge.name}
                      </p>
                      <p className="text-[10px] text-[var(--sage)]/80 mt-1 leading-snug">
                        {badge.requirement}
                      </p>
                      {unlocked && (
                        <p className="text-[10px] text-[#8FD99A] mt-1.5">
                          ✓ {lang === 'en' ? 'Unlocked' : lang === 'pt' ? 'Desbloqueada' : 'Desbloqueada'}
                        </p>
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
