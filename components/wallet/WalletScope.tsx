'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Loads the Solana/Reown wallet stack only where wallet UI is rendered
 * (perf: keeps ~400 KiB of wallet JS and Reown fonts off pages without it).
 * `lazy` defers loading until the section is near the viewport.
 */
const SolanaWalletProvider = dynamic(
  () => import('@/components/wallet/SolanaWalletProvider'),
  { ssr: false }
);

export default function WalletScope({
  children,
  lazy = false,
  minHeight,
}: {
  children: ReactNode;
  lazy?: boolean;
  /** Reserved height while loading (avoids layout shift). */
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (visible || !ref.current) return;
    const el = ref.current;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} style={minHeight ? { minHeight } : undefined}>
      {visible ? <SolanaWalletProvider>{children}</SolanaWalletProvider> : null}
    </div>
  );
}
