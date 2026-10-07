'use client';

import type { MouseEvent } from 'react';
import UpgradeCta from './UpgradeCta';
import { trackClientEvent } from '@/lib/analytics/client-events';
import type { AiFeature } from '@/lib/billing/ai-quota';

type Props = {
  feature: AiFeature;
  holderBonus: boolean;
  compact?: boolean;
  className?: string;
};

/**
 * Premium offer shown when the Free AI cap (incl. holder bonus) is used up.
 * Wraps the existing $49 UpgradeCta (lookup-key checkout, signed-in hub flow)
 * and records `upgrade_click` without modifying the shared CTA.
 */
export default function CapUpgradeOffer({ feature, holderBonus, compact = true, className = '' }: Props) {
  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement | null)?.closest('button');
    if (!btn || btn.disabled) return;
    trackClientEvent('upgrade_click', {
      source: 'ai_cap',
      feature,
      holder_bonus: holderBonus,
    });
  };
  return (
    <div onClickCapture={onClickCapture} className={className}>
      <UpgradeCta compact={compact} />
    </div>
  );
}
