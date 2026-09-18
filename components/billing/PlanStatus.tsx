'use client';

import { useI18n } from '@/components/I18nProvider';
import { useEntitlement } from '@/lib/billing/client';
import { PLAN_COPY } from '@/lib/billing/plans';
import { pickLang } from '@/lib/i18n/locale';
import UpgradeCta from './UpgradeCta';

type Props = {
  className?: string;
  /** Show the primary Upgrade button next to plan (home / account). */
  showUpgrade?: boolean;
  compact?: boolean;
};

export default function PlanStatus({
  className = '',
  showUpgrade = false,
  compact = false,
}: Props) {
  const { t, lang } = useI18n();
  const { entitlement, isPremium, loading } = useEntitlement();
  if (!entitlement.signedIn && !isPremium) {
    return showUpgrade ? (
      <div className={className}>
        <UpgradeCta compact={compact} />
      </div>
    ) : null;
  }

  const locale = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es' : 'en';
  const renewal = entitlement.currentPeriodEnd
    ? new Date(entitlement.currentPeriodEnd).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const planLabel = isPremium
    ? entitlement.interval === 'year'
      ? pickLang(lang, {
          en: PLAN_COPY.premium_year.priceLabel,
          es: PLAN_COPY.premium_year.priceLabelEs,
          pt: PLAN_COPY.premium_year.priceLabelPt,
        })
      : pickLang(lang, {
          en: PLAN_COPY.premium_month.priceLabel,
          es: PLAN_COPY.premium_month.priceLabelEs,
          pt: PLAN_COPY.premium_month.priceLabelPt,
        })
    : pickLang(lang, {
        en: PLAN_COPY.free.name,
        es: PLAN_COPY.free.nameEs,
        pt: PLAN_COPY.free.namePt,
      });

  return (
    <div className={className}>
      <div
        className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'mb-2'}`}
      >
        <span
          className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-wider font-semibold ${
            isPremium
              ? 'border-[#8FD99A]/50 text-[#8FD99A] bg-[#8FD99A]/10'
              : 'border-[var(--border-soft)] text-[var(--sage)]'
          }`}
        >
          {loading
            ? '…'
            : isPremium
              ? t('premium.youArePremium')
              : t('premium.youAreFree')}
        </span>
        {!loading && isPremium && planLabel ? (
          <span className="text-[11px] text-[var(--sage)]">{planLabel}</span>
        ) : null}
      </div>
      {!loading && isPremium && renewal ? (
        <p className="text-[11px] text-[var(--sage)]/90 leading-snug">
          {entitlement.cancelAtPeriodEnd
            ? t('premium.ends')
            : t('premium.renews')}
          {': '}
          <span className="text-[#D8E1D9]">{renewal}</span>
        </p>
      ) : null}
      {showUpgrade && !isPremium && !loading ? (
        <div className={compact ? 'mt-2' : 'mt-3'}>
          <UpgradeCta compact={compact} />
        </div>
      ) : null}
    </div>
  );
}
