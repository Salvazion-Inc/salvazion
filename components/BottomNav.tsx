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
    <nav className="bottom-nav-dock" aria-label={t('nav.main')}>
      <div className="bottom-nav-dock-inner" role="list">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.Icon;
          const label = t(item.labelKey);
          const color = item.color;
          const activeColor = color || 'var(--accent)';

          return (
            <Link
              key={item.key}
              href={item.href}
              role="listitem"
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              data-active={active ? 'true' : 'false'}
              className="bottom-nav-item"
              style={
                active
                  ? {
                      background: color
                        ? `${color}18`
                        : 'var(--surface-active)',
                      boxShadow: color
                        ? `0 0 0 1px ${color}33 inset`
                        : '0 0 0 1px rgba(143,217,154,0.2) inset',
                    }
                  : undefined
              }
            >
              <Icon size={22} active={active} color={color} />
              <span
                className="bottom-nav-label"
                style={{
                  color: active ? activeColor : 'var(--sage)',
                  opacity: active ? 1 : 0.82,
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
