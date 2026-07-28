'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BibleIcon,
  HealthIcon,
  FreedomIcon,
  ProfileIcon,
} from './Icons';
import { useI18n } from '@/components/I18nProvider';

type NavKey = 'home' | 'salvation' | 'health' | 'freedom' | 'profile';

interface NavItemConfig {
  href: string;
  labelKey: string;
  key: NavKey;
  Icon: React.FC<{ size?: number; active?: boolean }>;
  /** Paths that also count as active for this tab */
  match?: string[];
}

/**
 * Primary nav = three pillars + home + profile
 * Salvation → Bible / Devotional
 * Health → Health hub
 * Freedom → Freedom hub / Swap
 */
const PILLAR_NAV: NavItemConfig[] = [
  { href: '/hub/dashboard', labelKey: 'nav.home', key: 'home', Icon: HomeIcon },
  {
    href: '/hub/bible',
    labelKey: 'nav.salvation',
    key: 'salvation',
    Icon: BibleIcon,
    match: ['/hub/bible', '/hub/devotional'],
  },
  {
    href: '/hub/health',
    labelKey: 'nav.health',
    key: 'health',
    Icon: HealthIcon,
    match: ['/hub/health'],
  },
  {
    href: '/hub/freedom',
    labelKey: 'nav.freedom',
    key: 'freedom',
    Icon: FreedomIcon,
    match: ['/hub/freedom', '/hub/swap'],
  },
  { href: '/hub/profile', labelKey: 'nav.profile', key: 'profile', Icon: ProfileIcon },
];

interface BottomNavProps {
  /** @deprecated Always uses three-pillar nav. Kept for call-site compatibility. */
  variant?: 'default' | 'extended' | 'badges' | 'freedom';
}

function isActive(pathname: string, item: NavItemConfig): boolean {
  if (pathname === item.href) return true;
  if (item.match?.some((m) => pathname === m || pathname.startsWith(m + '/'))) return true;
  if (item.href !== '/hub/dashboard' && pathname.startsWith(item.href)) return true;
  return false;
}

export default function BottomNav({ variant: _variant = 'default' }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = PILLAR_NAV;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--true-black)]/95 border-t border-[var(--border-soft)] backdrop-blur-md px-2.5 py-2 safe-bottom"
      aria-label={t('nav.main')}
    >
      <div className="flex justify-between items-center max-w-md mx-auto gap-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.Icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] py-1.5 px-1 rounded-2xl transition-all ${
                active
                  ? 'bg-[var(--surface-active)] scale-[1.02]'
                  : 'opacity-80 hover:opacity-100 hover:bg-white/[0.03]'
              }`}
            >
              <Icon size={22} active={active} />
              <span
                className={`text-[10px] tracking-wide font-medium max-w-[4.25rem] text-center leading-tight ${
                  active ? 'text-[var(--accent)]' : 'text-[var(--sage)]'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
