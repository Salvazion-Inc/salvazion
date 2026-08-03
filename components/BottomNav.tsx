'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BibleIcon,
  HealthIcon,
  FreedomIcon,
} from './Icons';
import { useI18n } from '@/components/I18nProvider';
import { PILLAR_COLORS } from '@/lib/theme/pillars';

type NavKey = 'home' | 'salvation' | 'health' | 'freedom';

interface NavItemConfig {
  href: string;
  labelKey: string;
  key: NavKey;
  Icon: React.FC<{ size?: number; active?: boolean; color?: string }>;
  match?: string[];
  /** Active color for this tab */
  color?: string;
}

/** Four tabs: Dashboard + three pillars. Profile lives under Dashboard avatar/name. */
const PILLAR_NAV: NavItemConfig[] = [
  {
    href: '/hub/dashboard',
    labelKey: 'nav.home',
    key: 'home',
    Icon: HomeIcon,
    // Profile is opened from the dashboard hero — keep Dashboard selected there.
    match: ['/hub/dashboard', '/hub/profile'],
  },
  {
    href: '/hub/bible',
    labelKey: 'nav.salvation',
    key: 'salvation',
    Icon: BibleIcon,
    match: ['/hub/bible', '/hub/devotional'],
    color: PILLAR_COLORS.salvation.solid,
  },
  {
    href: '/hub/health',
    labelKey: 'nav.health',
    key: 'health',
    Icon: HealthIcon,
    match: ['/hub/health'],
    color: PILLAR_COLORS.health.solid,
  },
  {
    href: '/hub/freedom',
    labelKey: 'nav.freedom',
    key: 'freedom',
    Icon: FreedomIcon,
    match: ['/hub/freedom', '/hub/swap'],
    color: PILLAR_COLORS.freedom.solid,
  },
];

interface BottomNavProps {
  /** @deprecated Always uses four-tab nav. Kept for call-site compatibility. */
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--true-black)]/95 border-t border-[var(--border-soft)] backdrop-blur-md px-2 py-1.5 safe-bottom"
      aria-label={t('nav.main')}
    >
      <div className="flex items-stretch max-w-md mx-auto gap-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.Icon;
          const label = t(item.labelKey);
          const color = item.color;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 h-12 px-0.5 rounded-xl transition-colors ${
                active ? '' : 'opacity-80 hover:opacity-100 hover:bg-white/[0.03]'
              }`}
              style={
                active && color
                  ? { background: `${color}14` }
                  : active
                    ? { background: 'var(--surface-active)' }
                    : undefined
              }
            >
              <Icon size={20} active={active} color={color} />
              <span
                className="text-[10px] tracking-wide font-medium w-full text-center leading-none truncate px-0.5"
                style={{
                  color: color
                    ? color
                    : active
                      ? 'var(--accent)'
                      : 'var(--sage)',
                  opacity: active ? 1 : color ? 0.88 : 0.8,
                }}
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
