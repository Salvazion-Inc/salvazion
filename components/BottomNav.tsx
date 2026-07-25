'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BibleIcon,
  HealthIcon,
  FreedomIcon,
  ProfileIcon,
  DevotionalIcon,
  CalendarIcon,
  BadgesIcon,
  SwapIcon,
} from './Icons';
import { useI18n } from '@/components/I18nProvider';

type NavKey =
  | 'home'
  | 'salvation'
  | 'health'
  | 'freedom'
  | 'profile'
  | 'bible'
  | 'devotional'
  | 'calendar'
  | 'badges'
  | 'swap';

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
 * Freedom → Freedom hub
 */
const DEFAULT: NavItemConfig[] = [
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

const EXTENDED: NavItemConfig[] = [
  { href: '/hub/dashboard', labelKey: 'nav.home', key: 'home', Icon: HomeIcon },
  { href: '/hub/bible', labelKey: 'nav.salvation', key: 'salvation', Icon: BibleIcon, match: ['/hub/bible', '/hub/devotional'] },
  { href: '/hub/health', labelKey: 'nav.health', key: 'health', Icon: HealthIcon },
  { href: '/hub/calendar', labelKey: 'nav.calendar', key: 'calendar', Icon: CalendarIcon },
  { href: '/hub/devotional', labelKey: 'nav.devotional', key: 'devotional', Icon: DevotionalIcon },
];

const BADGES: NavItemConfig[] = [
  { href: '/hub/dashboard', labelKey: 'nav.home', key: 'home', Icon: HomeIcon },
  { href: '/hub/health', labelKey: 'nav.health', key: 'health', Icon: HealthIcon },
  { href: '/hub/calendar', labelKey: 'nav.calendar', key: 'calendar', Icon: CalendarIcon },
  { href: '/hub/badges', labelKey: 'nav.badges', key: 'badges', Icon: BadgesIcon },
  { href: '/hub/devotional', labelKey: 'nav.devotional', key: 'devotional', Icon: DevotionalIcon },
];

const FREEDOM: NavItemConfig[] = [
  { href: '/hub/dashboard', labelKey: 'nav.home', key: 'home', Icon: HomeIcon },
  { href: '/hub/health', labelKey: 'nav.health', key: 'health', Icon: HealthIcon },
  { href: '/hub/freedom', labelKey: 'nav.freedom', key: 'freedom', Icon: FreedomIcon },
  { href: '/hub/swap', labelKey: 'nav.swap', key: 'swap', Icon: SwapIcon },
  { href: '/hub/profile', labelKey: 'nav.profile', key: 'profile', Icon: ProfileIcon },
];

interface BottomNavProps {
  variant?: 'default' | 'extended' | 'badges' | 'freedom';
}

function isActive(pathname: string, item: NavItemConfig): boolean {
  if (pathname === item.href) return true;
  if (item.match?.some((m) => pathname === m || pathname.startsWith(m + '/'))) return true;
  if (item.href !== '/hub/dashboard' && pathname.startsWith(item.href)) return true;
  return false;
}

export default function BottomNav({ variant = 'default' }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  let items = DEFAULT;
  if (variant === 'extended') items = EXTENDED;
  if (variant === 'badges') items = BADGES;
  if (variant === 'freedom') items = FREEDOM;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#040404]/95 border-t border-[var(--border-soft)] backdrop-blur-md px-3 py-2 safe-bottom">
      <div className="flex justify-between items-center max-w-md mx-auto gap-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.Icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] py-1.5 px-1 rounded-xl transition-all ${
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
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
