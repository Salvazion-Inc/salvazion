'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  VALUE_JOURNEY_STEPS,
  getValueStepCopy,
} from '@/lib/value-journey/steps';
import {
  loadValueJourneyDone,
  loadValueJourneyStep,
  saveValueJourneyDone,
  saveValueJourneyStep,
} from '@/lib/freedom/x-articles';
import { useI18n } from '@/components/I18nProvider';
import { textWithXLogo } from '@/components/ui/XLogo';

interface Props {
  /** Show replay card after the journey is done (default true) */
  showReplay?: boolean;
  /**
   * Auto-open fullscreen on first visit. Default false so post-onboarding
   * dashboard stays clean; user opens via card.
   */
  autoOpen?: boolean;
  className?: string;
}

/**
 * In-app value proposition journey — benefits of Salvazion.
 * Optional fullscreen (autoOpen) or compact replay card.
 */
export default function ValueJourney({
  showReplay = true,
  autoOpen = false,
  className = '',
}: Props) {
  const { lang, t } = useI18n();
  const [done, setDone] = useState(true);
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDone = loadValueJourneyDone();
    const saved = loadValueJourneyStep();
    setDone(isDone);
    setStepIdx(Math.min(saved, VALUE_JOURNEY_STEPS.length - 1));
    if (!isDone && autoOpen) setOpen(true);
  }, [autoOpen]);

  const complete = useCallback(() => {
    saveValueJourneyDone();
    saveValueJourneyStep(VALUE_JOURNEY_STEPS.length - 1);
    setDone(true);
    setOpen(false);
  }, []);

  const next = useCallback(() => {
    if (stepIdx >= VALUE_JOURNEY_STEPS.length - 1) {
      complete();
      return;
    }
    const n = stepIdx + 1;
    setStepIdx(n);
    saveValueJourneyStep(n);
  }, [stepIdx, complete]);

  const prev = useCallback(() => {
    if (stepIdx <= 0) return;
    const n = stepIdx - 1;
    setStepIdx(n);
    saveValueJourneyStep(n);
  }, [stepIdx]);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  const replay = useCallback(() => {
    setStepIdx(0);
    saveValueJourneyStep(0);
    setOpen(true);
  }, []);

  if (!mounted) return null;

  const step = VALUE_JOURNEY_STEPS[stepIdx];
  const copy = getValueStepCopy(step, lang === 'en' ? 'en' : 'es');
  const progress = ((stepIdx + 1) / VALUE_JOURNEY_STEPS.length) * 100;
  const isLast = stepIdx === VALUE_JOURNEY_STEPS.length - 1;

  const journeyBody = (
    <div className="flex flex-col h-full max-w-md mx-auto w-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[var(--true-black)] shrink-0">
            <Image
              src="/logo-icon.png"
              alt="Salvazion"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
              {t('valueJourney.section')}
            </p>
            <p className="text-xs text-[var(--sage)]">
              {stepIdx + 1} / {VALUE_JOURNEY_STEPS.length}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={skip}
          className="text-[11px] text-[var(--sage)] hover:text-[var(--accent)] shrink-0"
        >
          {t('valueJourney.skip')}
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden mb-6">
        <div
          className="h-full bg-[var(--accent-fill)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 space-y-4">
        <div className="w-14 h-14 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-active)] flex items-center justify-center text-2xl">
          {step.icon}
        </div>
        <h2 className="font-display text-2xl font-bold text-white leading-tight">
          {textWithXLogo(copy.title)}
        </h2>
        <p className="text-sm text-[var(--off-white)]/90 leading-relaxed">
          {textWithXLogo(copy.body)}
        </p>
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-active)] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-1">
            {t('valueJourney.benefit')}
          </p>
          <p className="text-xs text-[var(--off-white)] leading-relaxed">
            {textWithXLogo(copy.benefit)}
          </p>
        </div>
        {step.href && step.id !== 'ready' && (
          <Link
            href={step.href}
            className="inline-flex text-xs text-[var(--accent)] hover:underline"
            onClick={() => saveValueJourneyStep(stepIdx)}
          >
            {t('valueJourney.explore')} →
          </Link>
        )}
      </div>

      <div className="flex gap-2 pt-6 pb-2">
        {stepIdx > 0 && (
          <button type="button" onClick={prev} className="btn-secondary flex-1">
            {t('common.previous')}
          </button>
        )}
        <button type="button" onClick={next} className="btn-primary flex-1">
          {copy.cta}
        </button>
      </div>
    </div>
  );

  if (open) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#040404]/97 backdrop-blur-md flex flex-col">
        <div className="flex-1 overflow-y-auto px-5 pt-8 pb-8">{journeyBody}</div>
      </div>
    );
  }

  if (done && showReplay) {
    return (
      <button
        type="button"
        onClick={replay}
        className={`w-full text-left glass rounded-2xl p-4 border border-[var(--border-soft)] hover:border-[var(--border-strong)] transition ${className}`}
      >
        <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">
          {t('valueJourney.section')}
        </p>
        <p className="text-sm font-semibold text-[var(--accent)] mt-0.5">
          {t('valueJourney.replay')}
        </p>
        <p className="text-[11px] text-[var(--sage)]/70 mt-1">
          {t('valueJourney.replayHint')}
        </p>
      </button>
    );
  }

  return null;
}
