'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEntitlement } from '@/lib/billing/client';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  /** When true, children render only for Premium */
  children?: ReactNode;
  /** Soft mode: show children dimmed + overlay instead of replacing */
  soft?: boolean;
  className?: string;
  title?: string;
  description?: string;
};

export default function PremiumGate({
  children = null,
  soft = false,
  className = '',
  title,
  description,
}: Props) {
  const { t } = useI18n();
  const { isPremium, loading } = useEntitlement();

  if (loading) {
    return (
      <div className={`glass rounded-2xl p-6 text-center text-sm text-[var(--sage)] animate-pulse ${className}`}>
        {t('premium.checking')}
      </div>
    );
  }

  if (isPremium) return <>{children}</>;

  const card = (
    <div className={`glass rounded-2xl p-5 sm:p-6 border border-[#8FD99A]/25 ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.25em] text-[#8FD99A] mb-2">
        Premium
      </p>
      <h3 className="text-lg font-semibold text-white mb-1">
        {title || t('premium.gateTitle')}
      </h3>
      <p className="text-sm text-[var(--sage)] leading-relaxed mb-4">
        {description || t('premium.gateBody')}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/hub/premium" className="btn-primary text-sm px-4 py-2.5">
          {t('premium.upgrade')}
        </Link>
        <Link
          href="/hub/premium"
          className="text-sm text-[#8FD99A] hover:underline px-2 py-2.5"
        >
          {t('premium.seePlans')}
        </Link>
      </div>
    </div>
  );

  if (!soft) return card;

  return (
    <div className={`relative ${className}`}>
      <div className="opacity-40 pointer-events-none select-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-3">
        {card}
      </div>
    </div>
  );
}
