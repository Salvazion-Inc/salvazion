'use client';

import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';
import { useAiUsage } from '@/lib/billing/ai-usage-client';
import type { AiFeature } from '@/lib/billing/ai-quota';

const FEATURE_KEY: Record<AiFeature, string> = {
  coach_chat: 'quota.coach',
  coach_tts: 'quota.tts',
  devotional_ai: 'quota.devotional',
  vision_body: 'quota.visionBody',
  vision_meal: 'quota.visionMeal',
};

type Props = {
  feature: AiFeature;
  compact?: boolean;
  className?: string;
};

export default function AiUsageMeter({
  feature,
  compact = false,
  className = '',
}: Props) {
  const { t } = useI18n();
  const { overview, loading } = useAiUsage();
  const state = overview.features[feature];

  if (loading) {
    return (
      <p className={`text-[11px] text-[var(--sage)]/70 animate-pulse ${className}`}>
        {t('quota.checking')}
      </p>
    );
  }

  if (!overview.signedIn) {
    return (
      <p className={`text-[11px] text-[var(--sage)] ${className}`}>
        {t('quota.signIn')}
      </p>
    );
  }

  if (state.unlimited || overview.isPremium) {
    return (
      <p className={`text-[11px] text-[#8FD99A] ${className}`}>
        {t('quota.unlimited')}
      </p>
    );
  }

  const used = state.used;
  const limit = state.limit ?? 0;
  const remaining = state.remaining ?? 0;
  const periodKey = state.period === 'week' ? 'quota.usedWeek' : 'quota.usedDay';
  const label = t(FEATURE_KEY[feature]);

  if (compact) {
    return (
      <p className={`text-[11px] text-[var(--sage)] ${className}`}>
        {label}: {t(periodKey, { used, limit })}
        {overview.holderBonus ? ` · ${t('quota.holderShort')}` : ''}
      </p>
    );
  }

  if (!state.allowed || remaining <= 0) {
    return (
      <div
        className={`rounded-xl border border-[#8FD99A]/25 bg-[#8FD99A]/5 px-3.5 py-3 space-y-2 ${className}`}
      >
        <p className="text-[10px] uppercase tracking-wider text-[#8FD99A]">
          {label}
        </p>
        <p className="text-sm text-white font-medium">{t('quota.exhausted')}</p>
        <p className="text-xs text-[var(--sage)] leading-relaxed">
          {t('quota.exhaustedBody')}
        </p>
        {overview.holderBonus ? (
          <p className="text-[11px] text-[#8FD99A]">{t('quota.holderActive')}</p>
        ) : (
          <p className="text-[11px] text-[var(--sage)]">{t('quota.holderHint')}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/hub/premium" className="btn-primary text-xs px-3 py-2">
            {t('premium.upgrade')}
          </Link>
          <Link
            href="/hub/profile"
            className="text-xs text-[#8FD99A] hover:underline px-2 py-2"
          >
            {t('quota.connectToken')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-[11px] text-[var(--sage)] leading-relaxed ${className}`}>
      <span>
        {label}: {t(periodKey, { used, limit })}
      </span>
      {overview.holderBonus ? (
        <span className="ml-1.5 text-[#8FD99A]">{t('quota.holderShort')}</span>
      ) : (
        <Link href="/hub/profile" className="ml-1.5 text-[#8FD99A] hover:underline">
          {t('quota.holderHintShort')}
        </Link>
      )}
    </div>
  );
}
