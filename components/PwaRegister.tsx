'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker so Android/Chrome can offer
 * “Install app” with the Salvazion icon from the web manifest.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Only register on secure contexts (HTTPS or localhost)
    if (!window.isSecureContext) return;

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[Salvazion] SW register failed', err);
    });
  }, []);

  return null;
}
