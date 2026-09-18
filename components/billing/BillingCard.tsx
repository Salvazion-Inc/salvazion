'use client';

import Link from 'next/link';
import { useEntitlement } from '@/lib/billing/client';
import { useI18n } from '@/components/I18nProvider';
import PlanStatus from './PlanStatus';
import UpgradeCta from './UpgradeCta';

export default function BillingCard({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const { isPremium, loading } = useEntitlement();

  return (
    <div className={`glass rounded-2xl p-5 space-y-4 ${className}`}>
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--sage)]">
          {t('premium.billing')}
        </p>
        <h3 className="text-lg font-semibold text-[#8FD99A] mt-0.5">
          {isPremium ? t('premium.activeTitle') : t('premium.freeTitle')}
        </h3>
        <p className="text-xs text-[var(--sage)]/80 mt-1">
          {isPremium ? t('premium.activeBody') : t('premium.freeBody')}
        </p>
      </div>

      {!loading ? <PlanStatus /> : null}

      <UpgradeCta showAnnual={!isPremium} />

      <Link
        href="/hub/premium"
        className="block text-center text-xs text-[#8FD99A] hover:underline"
      >
        {t('premium.seePlans')} →
      </Link>
    </div>
  );
}
