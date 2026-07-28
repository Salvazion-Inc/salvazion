'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEntitlement } from '@/lib/billing/client';
import { useI18n } from '@/components/I18nProvider';

/**
 * Floating access to León Verde voice agent (hub pages).
 * Free users go to Premium; Premium to coach.
 */
export default function CoachFab() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isPremium, loading } = useEntitlement();

  if (!pathname?.startsWith('/hub')) return null;
  if (pathname.startsWith('/hub/coach') || pathname.startsWith('/hub/onboarding')) {
    return null;
  }
  if (pathname.startsWith('/hub/premium') && !isPremium) {
    return null;
  }

  const href = !loading && !isPremium ? '/hub/premium' : '/hub/coach';
  const label =
    !loading && !isPremium ? t('coach.fabPremium') : t('coach.fabLabel');

  return (
    <Link
      href={href}
      className="fixed z-[45] right-4 bottom-[4.75rem] sm:bottom-24 w-14 h-14 rounded-full border border-[var(--border-strong)] bg-[var(--true-black)]/95 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_22%,transparent)] lion-glow overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition"
      aria-label={label}
      title={label}
    >
      <Image
        src="/coach/leon-verde-thumb.jpg"
        alt=""
        width={56}
        height={56}
        className="object-cover w-full h-full"
      />
      <span
        className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--true-black)] ${
          isPremium ? 'bg-[var(--accent)]' : 'bg-[var(--sage)]'
        }`}
      />
    </Link>
  );
}
