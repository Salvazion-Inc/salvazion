'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEntitlement } from '@/lib/billing/client';
import { useI18n } from '@/components/I18nProvider';
import { loadProfile } from '@/lib/store/profile';
import { computeScores } from '@/lib/scoring/engine';
import {
  buildFabNudges,
  type FabNudge,
  type FabNudgeTone,
} from '@/lib/coach/fab-nudges';
import { PILLAR_COLORS } from '@/lib/theme/pillars';

/** How often a new cloud appears (from start of one message to the next) */
const INTERVAL_MS = 60_000;
/** How long the cloud stays visible */
const SHOW_MS = 8_000;
/** Hidden gap until the next message */
const HIDE_MS = INTERVAL_MS - SHOW_MS;
/** First appearance delay so the page settles */
const FIRST_DELAY_MS = 4_000;
/** Refresh profile/scores for new nudges */
const REFRESH_MS = 120_000;
/** Session flag: user closed clouds for this browser tab session */
const SESSION_MUTE_KEY = 'salvazion_coach_clouds_muted';

function toneAccent(tone: FabNudgeTone, pillar?: FabNudge['pillar']): string {
  if (pillar === 'salvation') return PILLAR_COLORS.salvation.solid;
  if (pillar === 'health') return PILLAR_COLORS.health.solid;
  if (pillar === 'freedom') return PILLAR_COLORS.freedom.text;
  if (tone === 'celebrate') return PILLAR_COLORS.freedom.text;
  if (tone === 'premium') return '#8FD99A';
  if (tone === 'nudge') return PILLAR_COLORS.health.text;
  return 'var(--accent)';
}

function readSessionMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SESSION_MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSessionMuted(): void {
  try {
    sessionStorage.setItem(SESSION_MUTE_KEY, '1');
  } catch {
    // private mode / blocked storage — in-memory only
  }
}

/**
 * Floating Salvazion logo → Premium (free) or Coach (Premium).
 * Personalized cloud nudges with actionable deep-links + CTA.
 * Close (X) mutes clouds for the rest of the browser session.
 */
export default function CoachFab() {
  const pathname = usePathname();
  const { t, lang } = useI18n();
  const locale = lang === 'en' || lang === 'pt' ? lang : 'es';
  const { isPremium } = useEntitlement();

  const [nudges, setNudges] = useState<FabNudge[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(false);

  const hidden =
    !pathname?.startsWith('/hub') ||
    pathname.startsWith('/hub/coach') ||
    pathname.startsWith('/hub/onboarding') ||
    (pathname.startsWith('/hub/premium') && !isPremium);

  const cloudsEnabled = mounted && !hidden && !muted;

  const refreshNudges = useCallback(() => {
    try {
      const profile = loadProfile();
      const scores = computeScores();
      setNudges(buildFabNudges(profile, scores, locale, !!isPremium));
    } catch {
      setNudges(buildFabNudges(null, null, locale, !!isPremium));
    }
  }, [locale, isPremium]);

  const dismissClouds = useCallback(() => {
    setVisible(false);
    setMuted(true);
    writeSessionMuted();
  }, []);

  useEffect(() => {
    setMounted(true);
    setMuted(readSessionMuted());
  }, []);

  useEffect(() => {
    if (!cloudsEnabled) return;
    refreshNudges();
    const id = window.setInterval(refreshNudges, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [cloudsEnabled, refreshNudges, pathname]);

  // Cycle clouds: show → hide → next (stopped when muted)
  useEffect(() => {
    if (!cloudsEnabled || nudges.length === 0) {
      setVisible(false);
      return;
    }

    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    let gapTimer: number | undefined;
    let cancelled = false;

    const runCycle = (delay: number) => {
      showTimer = window.setTimeout(() => {
        if (cancelled) return;
        setVisible(true);
        hideTimer = window.setTimeout(() => {
          if (cancelled) return;
          setVisible(false);
          gapTimer = window.setTimeout(() => {
            if (cancelled) return;
            setIndex((i) => (i + 1) % Math.max(nudges.length, 1));
            runCycle(HIDE_MS);
          }, 320);
        }, SHOW_MS);
      }, delay);
    };

    runCycle(FIRST_DELAY_MS);

    return () => {
      cancelled = true;
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (gapTimer) window.clearTimeout(gapTimer);
    };
  }, [cloudsEnabled, nudges]);

  const current = nudges[index % Math.max(nudges.length, 1)] || null;
  const accent = useMemo(
    () => (current ? toneAccent(current.tone, current.pillar) : 'var(--accent)'),
    [current]
  );

  if (!mounted || hidden) return null;

  const fabHref = '/hub/coach';
  const label = t('coach.fabLabel');

  const cloudHref = current?.href || fabHref;
  const closeLabel =
    locale === 'es'
      ? 'Cerrar mensajes de Salvazion AI (esta sesión)'
      : locale === 'pt'
        ? 'Fechar mensagens da Salvazion AI (esta sessão)'
        : 'Close Salvazion AI messages (this session)';

  return (
    <div className="fixed z-[45] right-4 bottom-[4.75rem] sm:bottom-24 flex flex-col items-end gap-2 pointer-events-none">
      {/* Motivational cloud + actionable CTA */}
      {!muted && current && (
        <div
          role="status"
          aria-live="polite"
          className={`coach-fab-cloud pointer-events-auto max-w-[min(74vw,17rem)] transition-all duration-300 ease-out ${
            visible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
          }`}
          style={{
            borderColor: `${accent}55`,
            boxShadow: `0 0 20px color-mix(in srgb, ${accent} 18%, transparent)`,
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <p
              className="text-[10px] uppercase tracking-[0.12em] font-semibold pt-0.5"
              style={{ color: accent }}
            >
              Salvazion
            </p>
            <button
              type="button"
              onClick={dismissClouds}
              className="coach-fab-cloud-close shrink-0 -mr-0.5 -mt-0.5"
              aria-label={closeLabel}
              title={closeLabel}
            >
              <span aria-hidden>×</span>
            </button>
          </div>
          <p className="text-[12px] sm:text-[13px] text-white leading-snug font-medium text-pretty pr-1">
            {current.text}
          </p>
          <Link
            href={cloudHref}
            className="coach-fab-cloud-cta mt-2.5 inline-flex items-center justify-center gap-1 w-full min-h-[32px] px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition active:scale-[0.98]"
            style={{
              background: accent,
              color: current.pillar === 'salvation' ? '#0a120c' : '#041008',
            }}
            aria-label={`${current.cta}: ${current.text}`}
          >
            <span>{current.cta}</span>
            <span aria-hidden className="opacity-80 text-[10px]">
              →
            </span>
          </Link>
          {/* Tail pointing to FAB */}
          <span
            className="coach-fab-cloud-tail"
            style={{ borderTopColor: 'rgba(10, 14, 11, 0.96)' }}
            aria-hidden
          />
          <span
            className="coach-fab-cloud-tail-border"
            style={{ borderTopColor: `${accent}55` }}
            aria-hidden
          />
        </div>
      )}

      <Link
        href={fabHref}
        className="coach-fab-pulse pointer-events-auto w-14 h-14 rounded-full border border-[var(--border-strong)] bg-[var(--true-black)]/95 lion-glow overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        style={{ ['--now-glow' as string]: 'var(--accent)' }}
        aria-label={label}
        title={label}
      >
        <Image
          src="/logo-icon.png"
          alt="Salvazion"
          width={56}
          height={56}
          className="object-cover w-full h-full"
          priority
        />
        <span
          className={`coach-fab-pulse-dot absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--true-black)] ${
            isPremium ? 'bg-[var(--accent)]' : 'bg-[var(--sage)]'
          }`}
          aria-hidden
        />
      </Link>
    </div>
  );
}
