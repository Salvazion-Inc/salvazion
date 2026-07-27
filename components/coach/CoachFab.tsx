'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * Floating access to León Verde voice agent (hub pages).
 */
export default function CoachFab() {
  const pathname = usePathname();
  if (!pathname?.startsWith('/hub')) return null;
  if (pathname.startsWith('/hub/coach') || pathname.startsWith('/hub/onboarding')) {
    return null;
  }

  return (
    <Link
      href="/hub/coach"
      className="fixed z-[45] right-4 bottom-[4.75rem] sm:bottom-24 w-14 h-14 rounded-full border border-[var(--border-strong)] bg-[#040404]/95 shadow-[0_0_24px_rgba(143,217,154,0.22)] lion-glow overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition"
      aria-label="León Verde · Coach de voz"
      title="León Verde"
    >
      <Image
        src="/coach/leon-verde-thumb.jpg"
        alt=""
        width={56}
        height={56}
        className="object-cover w-full h-full"
      />
      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-[#040404]" />
    </Link>
  );
}
