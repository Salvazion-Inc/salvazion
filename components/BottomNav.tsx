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
  | 'bible'
  | 'health'
  | 'freedom'
  | 'profile'
  | 'devotional'
  | 'calendar'
  | 'badges'
  | 'swap';

interface NavItemConfig {
  href: string;
  labelKey: string;
  key: NavKey;
  Icon: React.FC<{ size?: number; active?: boolean }>;
}

const DEFAULT: NavItemConfig[] = [
  { href: '/hub/dashboard', labelKey: 'nav.home', key: 'home', Icon: HomeIcon },
  { href: '/hub/bible', labelKey: 'nav.bible', key: 'bible', Icon: BibleIcon },
  { href: '/hub/swap', labelKey: 'nav.swap', key: 'swap', Icon: SwapIcon },
  { href: '/hub/freedom', labelKey: 'nav.freedom', key: 'freedom', Icon: FreedomIcon },
  { href: '/hub/profile', labelKey: 'nav.profile', key: 'profile', Icon: ProfileIcon },
];

const EXTENDED: NavItemConfig[] = [
  { href: '/hub/dashboard', labelKey: 'nav.home', key: 'home', Icon: HomeIcon },
  { href: '/hub/bible', labelKey: 'nav.bible', key: 'bible', Icon: BibleIcon },
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
  { href: '/hub/swap', labelKey: 'nav.swap', key: 'swap', Icon: SwapIcon },
  { href: '/hub/freedom', labelKey: 'nav.freedom', key: 'freedom', Icon: FreedomIcon },
  { href: '/hub/calendar', labelKey: 'nav.calendar', key: 'calendar', Icon: CalendarIcon },
  { href: '/hub/profile', labelKey: 'nav.profile', key: 'profile', Icon: ProfileIcon },
];

interface BottomNavProps {
  variant?: 'default' | 'extended' | 'badges' | 'freedom';
}

export default function BottomNav({ variant = 'default' }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  let items = DEFAULT;
  if (variant === 'extended') items = EXTENDED;
  if (variant === 'badges') items = BADGES;
  if (variant === 'freedom') items = FREEDOM;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#040404]/95 border-t border-[#00B10C]/30 backdrop-blur-md px-4 py-2.5">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/hub/dashboard' && pathname.startsWith(item.href));
          const Icon = item.Icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-all ${
                active ? 'scale-105' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <Icon size={22} active={active} />
              <span
                className={`text-[10px] tracking-wide font-medium ${
                  active ? 'text-[#00F511]' : 'text-[#B7F7AC]/70'
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
