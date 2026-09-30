'use client';

import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';

export type SalvationTabId = 'bible' | 'prayer' | 'devotional' | 'hymns';

const TABS: { id: SalvationTabId; key: string; href: string }[] = [
  { id: 'bible', key: 'bible.title', href: '/hub/bible' },
  { id: 'prayer', key: 'bible.prayer', href: '/hub/bible?tab=prayer' },
  { id: 'devotional', key: 'bible.devotional', href: '/hub/devotional' },
  { id: 'hymns', key: 'bible.hymns', href: '/hub/hymns' },
];

type Props = {
  active: SalvationTabId;
  /** Keep Bible and Prayer on the current page when provided. */
  onSelect?: (tab: 'bible' | 'prayer') => void;
};

export default function SalvationTabs({ active, onSelect }: Props) {
  const { t } = useI18n();

  return (
    <div
      className="tabs-x mb-1 mt-2"
      style={{ ['--tab-accent' as string]: 'var(--pillar-salvation)' }}
      role="tablist"
      aria-label={t('nav.salvation')}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const inline = onSelect && (tab.id === 'bible' || tab.id === 'prayer');
        if (inline) {
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-active={isActive}
              aria-selected={isActive}
              onClick={() => onSelect(tab.id as 'bible' | 'prayer')}
            >
              {t(tab.key)}
            </button>
          );
        }
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            data-active={isActive ? 'true' : 'false'}
            aria-selected={isActive}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </div>
  );
}
