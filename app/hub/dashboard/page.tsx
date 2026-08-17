'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  loadProfile,
  loadProfileAsync,
  refreshProfileFromServer,
  saveProfile,
  subscribeProfileUpdated,
} from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';
import {
  computeScores,
  getTodayPointsRaw,
  syncScoresFromServer,
} from '@/lib/scoring/engine';
import { ComputedScores } from '@/lib/scoring/types';
import {
  evaluateBadges,
  getBadgeProgress,
  getEarnedBadgesDetailed,
  syncBadgesFromServer,
  BadgeDef,
} from '@/lib/badges/engine';
import BottomNav from '@/components/BottomNav';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { useI18n } from '@/components/I18nProvider';
import { BadgesIcon } from '@/components/Icons';
import ProgressCharts from '@/components/progress/ProgressCharts';
import DailyAgenda from '@/components/calendar/DailyAgenda';
import ActivationChecklist from '@/components/hub/ActivationChecklist';
import { PILLAR_COLORS } from '@/lib/theme/pillars';
import { useFlashToast } from '@/components/ui/FlashToast';
import { runPassiveHealthSync } from '@/lib/health/wearables';
import { logAction } from '@/lib/scoring/engine';

export default function DashboardPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { flash, toast: saveToast } = useFlashToast();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [scores, setScores] = useState<ComputedScores | null>(null);
  const [mounted, setMounted] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([]);
  const [badgeProgress, setBadgeProgress] = useState({ earned: 0, total: 0 });
  const [todayPts, setTodayPts] = useState({ total: 0, actionCount: 0 });
  const [editingPurpose, setEditingPurpose] = useState(false);
  const [purposeDraft, setPurposeDraft] = useState('');
  const [purposeSaving, setPurposeSaving] = useState(false);
  const [purposeError, setPurposeError] = useState<string | null>(null);

  const refresh = useCallback((p?: Partial<UserProfile>, s?: ComputedScores) => {
    const scoresToUse = s || computeScores();
    setScores(scoresToUse);
    setTodayPts(getTodayPointsRaw());
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
      // Pull last 7 days so weekly charts work across devices
      const synced = await syncScoresFromServer({ days: 7 });
      await syncBadgesFromServer();
      refresh(p, synced);

      // Wearables → score without opening Settings
      try {
        const passive = await runPassiveHealthSync({
          lang: p.language === 'en' || p.language === 'pt' ? p.language : 'es',
          onLog: (type) => {
            logAction(type);
          },
        });
        if (passive.autoLogged.length) {
          refresh(p);
          flash(t('health.devices.autoLogged'));
        } else {
          refresh(p);
        }
      } catch {
        /* offline / no wearables */
      }
    })();

    // Keep hero avatar/name in sync when profile is saved elsewhere (e.g. Profile page)
    const unsub = subscribeProfileUpdated(() => {
      const p = loadProfile();
      if (p) setProfile(p);
    });

    // Mobile/web resume: pull latest avatar + re-check wearables
    const onResume = () => {
      void refreshProfileFromServer().then((p) => {
        if (p?.onboardingCompleted) setProfile(p);
      });
      void runPassiveHealthSync({
        onLog: (type) => logAction(type),
      }).then((r) => {
        if (r.autoLogged.length) refresh();
      });
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') onResume();
    };
    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      unsub();
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + resume only
  }, [router, refresh]);

  const recentBadges = useMemo(() => {
    if (!badgeProgress.earned) return [];
    return getEarnedBadgesDetailed().slice(-4).reverse();
  }, [badgeProgress.earned, newBadges.length]);

  const startEditPurpose = () => {
    setPurposeDraft(profile?.purpose || '');
    setPurposeError(null);
    setEditingPurpose(true);
  };

  const cancelEditPurpose = () => {
    setEditingPurpose(false);
    setPurposeDraft(profile?.purpose || '');
    setPurposeError(null);
  };

  const savePurpose = async () => {
    const next = purposeDraft.trim();
    if (!next) {
      setPurposeError(t('dashboard.purposeRequired'));
      return;
    }
    if (next.length > 500) {
      setPurposeError(t('dashboard.purposeTooLong'));
      return;
    }
    setPurposeSaving(true);
    setPurposeError(null);
    try {
      const base = profile || loadProfile() || {};
      const merged: Partial<UserProfile> = {
        ...base,
        purpose: next,
        onboardingCompleted: true,
      };
      await saveProfile(merged);
      setProfile(merged);
      setEditingPurpose(false);
      flash(t('common.changesSaved'));
    } catch {
      setPurposeError(t('dashboard.purposeSaveError'));
    } finally {
      setPurposeSaving(false);
    }
  };

  if (!mounted || !profile || !scores) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3">
        <div
          className="skeleton-pulse w-12 h-12 rounded-full"
          aria-hidden
        />
        <p className="text-[var(--accent)] text-sm font-medium" aria-live="polite">
          {t('common.lionPreparing')}
        </p>
      </div>
    );
  }

  const { salvation, health, freedom, global } = scores;

  const scoreLabel = `${t('dashboard.salvazionScore')} ${global}: ${t('nav.salvation')} ${salvation}, ${t('nav.health')} ${health}, ${t('nav.freedom')} ${freedom}`;

  return (
    <div className="min-h-[100dvh] text-[var(--off-white)] flex flex-col">
      {saveToast}
      <main className="flex-1 flex flex-col items-center px-5 pt-5 pb-8 max-w-lg mx-auto w-full">
        {/* Hero: identity + purpose + score — one surface */}
        <section
          className="relative w-full max-w-sm mb-5 overflow-hidden rounded-[1.5rem] border border-[var(--border-soft)] card-soft"
          style={{
            background:
              'linear-gradient(165deg, color-mix(in srgb, var(--accent) 9%, #0a0f0b) 0%, #050505 48%, #040404 100%)',
            boxShadow:
              '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 20px 50px rgba(0,0,0,0.42)',
          }}
        >
          {/* Soft pillar glow accents */}
          <div
            className="pointer-events-none absolute -top-16 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30"
            style={{ background: PILLAR_COLORS.salvation.solid }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-24 -left-12 w-36 h-36 rounded-full blur-3xl opacity-20"
            style={{ background: PILLAR_COLORS.health.solid }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-8 right-0 w-32 h-32 rounded-full blur-3xl opacity-25"
            style={{ background: PILLAR_COLORS.freedom.solid }}
            aria-hidden
          />

          {/* Identity row — X-style compact profile entry (avatar + name + handle) */}
          <Link
            href="/hub/profile"
            className="relative z-[1] flex items-center gap-3.5 px-4 pt-4 pb-3 group"
            title={t('nav.profile')}
            aria-label={t('nav.profile')}
          >
            <div
              className="relative shrink-0 rounded-full p-[2px]"
              style={{
                background: `conic-gradient(from 200deg, ${PILLAR_COLORS.salvation.solid}, ${PILLAR_COLORS.health.solid}, ${PILLAR_COLORS.freedom.solid}, ${PILLAR_COLORS.salvation.solid})`,
                boxShadow:
                  '0 0 20px color-mix(in srgb, var(--accent) 22%, transparent)',
              }}
            >
              <div className="rounded-full bg-[var(--true-black)] p-[2px]">
                <ProfileAvatar
                  avatarUrl={profile.avatarUrl}
                  name={profile.name || 'Brother'}
                  size="md"
                  editable={false}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold text-white leading-snug break-words tracking-tight group-hover:text-[var(--accent)] transition-colors">
                {profile.name || 'Brother'}
              </p>
              <p className="text-[12px] text-[var(--sage)] group-hover:text-[var(--accent)]/85 transition-colors mt-0.5">
                {profile.xUsername
                  ? `@${profile.xUsername.replace(/^@+/, '')}`
                  : t('nav.profile')}
              </p>
            </div>
            <span
              className="shrink-0 w-8 h-8 rounded-full border border-[var(--border-soft)] flex items-center justify-center text-[var(--sage)]/60 group-hover:text-[var(--accent)] group-hover:border-[var(--border-strong)] transition-colors text-sm"
              aria-hidden
            >
              ›
            </span>
          </Link>

          {/* Purpose — compact when set */}
          <div className="relative z-[1] px-4 pb-2">
            <div
              className={`rounded-xl border ${
                editingPurpose ? 'px-3.5 py-3' : 'px-3 py-2'
              }`}
              style={{
                borderColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[9px] uppercase tracking-[0.14em] text-[var(--sage)]/65">
                  {t('dashboard.purpose')}
                </p>
                {!editingPurpose && (
                  <button
                    type="button"
                    onClick={startEditPurpose}
                    className="btn-outline-sm"
                  >
                    {profile.purpose
                      ? t('dashboard.editPurpose')
                      : t('dashboard.setPurpose')}
                  </button>
                )}
              </div>

              {editingPurpose ? (
                <div className="space-y-2.5">
                  <textarea
                    value={purposeDraft}
                    onChange={(e) => setPurposeDraft(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder={t('dashboard.purposePlaceholder')}
                    className="w-full bg-[#040404]/90 border border-[var(--border-soft)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--off-white)] placeholder:text-[var(--sage)]/50 focus:outline-none focus:border-[var(--accent)] resize-none leading-relaxed"
                    autoFocus
                    aria-label={t('dashboard.purpose')}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-[var(--sage)]/60 tabular-nums">
                      {purposeDraft.trim().length}/500
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={cancelEditPurpose}
                        disabled={purposeSaving}
                        className="btn-outline-sm"
                      >
                        {t('dashboard.cancelPurpose')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void savePurpose()}
                        disabled={purposeSaving}
                        className="btn-sm"
                      >
                        {purposeSaving
                          ? t('dashboard.savingPurpose')
                          : t('dashboard.savePurpose')}
                      </button>
                    </div>
                  </div>
                  {purposeError && (
                    <p className="text-[11px] text-red-400" role="alert">
                      {purposeError}
                    </p>
                  )}
                </div>
              ) : profile.purpose ? (
                <button
                  type="button"
                  onClick={startEditPurpose}
                  className="w-full text-left group"
                >
                  <p className="text-[12px] leading-snug text-[var(--off-white)]/90 line-clamp-2 group-hover:text-white transition-colors">
                    <span className="text-[var(--accent)]/70 font-display text-sm leading-none mr-0.5">
                      “
                    </span>
                    {profile.purpose}
                    <span className="text-[var(--accent)]/70 font-display text-sm leading-none ml-0.5">
                      ”
                    </span>
                  </p>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startEditPurpose}
                  className="w-full text-left text-[11px] text-[var(--sage)]/80 leading-relaxed hover:text-[var(--accent)] transition-colors"
                >
                  {t('dashboard.purposeEmpty')}
                </button>
              )}
            </div>
          </div>

          {/* Score rings */}
          <div className="relative z-[1] flex flex-col items-center px-4 pt-1 pb-5">
            <div
              className="relative w-[13.5rem] h-[13.5rem] flex items-center justify-center"
              role="img"
              aria-label={scoreLabel}
            >
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 100 100"
                aria-hidden
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="var(--sage-dim)"
                  strokeWidth="3"
                  opacity="0.22"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={PILLAR_COLORS.salvation.solid}
                  strokeWidth="3.2"
                  strokeDasharray={`${Math.min(salvation, 100) * 2.89} 289`}
                  strokeLinecap="round"
                  className="ring-glow transition-all duration-700"
                />
              </svg>
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 100 100"
                aria-hidden
              >
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="var(--sage-dim)"
                  strokeWidth="3"
                  opacity="0.22"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={PILLAR_COLORS.health.solid}
                  strokeWidth="2.8"
                  strokeDasharray={`${Math.min(health, 100) * 2.39} 239`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                  style={{
                    filter:
                      'drop-shadow(0 0 6px color-mix(in srgb, #4A9EFF 40%, transparent))',
                  }}
                />
              </svg>
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 100 100"
                aria-hidden
              >
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="var(--sage-dim)"
                  strokeWidth="3"
                  opacity="0.22"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke={PILLAR_COLORS.freedom.solid}
                  strokeWidth="2.6"
                  strokeDasharray={`${Math.min(freedom, 100) * 1.88} 188`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                  style={{
                    filter:
                      'drop-shadow(0 0 6px color-mix(in srgb, #7BC98A 40%, transparent))',
                  }}
                />
              </svg>
              <div className="text-center z-10">
                <div className="font-display text-5xl font-bold text-white tracking-tighter leading-none">
                  {global}
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--sage)] mt-1.5">
                  {t('dashboard.salvazionScore')}
                </div>
                <div className="text-[10px] text-[var(--accent)] font-medium mt-0.5">
                  {t('dashboard.global')}
                </div>
                {todayPts.total > 0 && (
                  <p className="text-[10px] text-[#8FD99A]/90 mt-1.5 tabular-nums">
                    +{todayPts.total} {t('dashboard.pointsToday')}
                    {todayPts.actionCount > 0
                      ? ` · ${todayPts.actionCount} ${t('dashboard.actionsToday')}`
                      : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Compact pillar legend chips */}
            <div className="flex items-center justify-center gap-2 mt-1 w-full">
              {(
                [
                  {
                    href: '/hub/bible',
                    label: t('nav.salvation'),
                    value: salvation,
                    color: PILLAR_COLORS.salvation.solid,
                  },
                  {
                    href: '/hub/health',
                    label: t('nav.health'),
                    value: health,
                    color: PILLAR_COLORS.health.solid,
                  },
                  {
                    href: '/hub/freedom',
                    label: t('nav.freedom'),
                    value: freedom,
                    color: PILLAR_COLORS.freedom.solid,
                  },
                ] as const
              ).map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="flex-1 min-w-0 rounded-xl px-2 py-2 text-center border transition-all active:scale-[0.98]"
                  style={{
                    borderColor: `color-mix(in srgb, ${p.color} 40%, transparent)`,
                    background: `color-mix(in srgb, ${p.color} 10%, #040404)`,
                  }}
                >
                  <p
                    className="text-[9px] uppercase tracking-wider truncate"
                    style={{ color: p.color, opacity: 0.9 }}
                  >
                    {p.label}
                  </p>
                  <p
                    className="text-lg font-bold tabular-nums leading-none mt-0.5"
                    style={{ color: p.color }}
                  >
                    {p.value}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* First-run: 3 gestures (hides when done) */}
        <div className="w-full max-w-sm mb-4">
          <ActivationChecklist
            refreshKey={scores.todayActions.length + scores.global}
          />
        </div>

        {/* Daily agenda first — primary daily action */}
        <div className="w-full max-w-sm mb-5">
          <DailyAgenda onScored={() => refresh(profile || undefined)} />
        </div>

        {/* Weekly discipline / score / body charts */}
        <div className="w-full max-w-sm mb-5">
          <ProgressCharts scores={scores} />
        </div>

        {/* Badges — compact */}
        <div className="w-full max-w-sm mb-2">
          <div className="card-soft p-3">
            <Link
              href="/hub/badges"
              className="flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BadgesIcon size={22} active />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--off-white)] group-hover:text-[var(--accent)] transition-colors">
                    {t('dashboard.badgesTitle')}
                  </p>
                  <p className="text-[10px] text-[var(--sage)]">
                    {badgeProgress.earned}/{badgeProgress.total}{' '}
                    {t('charts.unlocked')}
                    {recentBadges.length > 0
                      ? ` · ${t('dashboard.badgesSub')}`
                      : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <BadgeRing
                  earned={badgeProgress.earned}
                  total={badgeProgress.total}
                  size={44}
                />
                <span className="text-[var(--accent)] text-sm">→</span>
              </div>
            </Link>

            {newBadges.length > 0 && (
              <div className="mt-3 space-y-1.5 pt-2 border-t border-[var(--border-soft)]">
                {newBadges.slice(0, 2).map((b) => (
                  <div
                    key={b.id}
                    className="rounded-lg p-2 border border-[var(--border-strong)] bg-[var(--surface)]/60 flex items-center gap-2.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.iconSrc}
                      alt=""
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover border border-[var(--border-strong)] lion-glow shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[9px] text-[var(--accent)] uppercase tracking-wide">
                        {t('dashboard.newBadge')}
                      </p>
                      <p className="text-xs font-semibold text-white truncate">
                        {b.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
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
