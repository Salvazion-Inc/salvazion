'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';
import { partnerCopy, sendPartnerEvent } from '../copy';

export default function PartnerWelcomePage() {
  const { lang } = useI18n();
  const c = partnerCopy(lang);
  useEffect(() => {
    // Server checks session + confirmed email before logging partner_verified.
    const key = 'slz_partner_verified_sent';
    if (typeof window !== 'undefined' && !window.localStorage.getItem(key)) {
      window.localStorage.setItem(key, '1');
      sendPartnerEvent('partner_verified', { lang: String(lang) });
    }
  }, [lang]);
  return (
    <div className="marketing-shell text-[var(--off-white)] flex items-center justify-center px-5 py-10">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--accent)] mb-3">{c.welcomeTitle}</h1>
        <p className="text-sm text-[var(--sage)]/90 mb-6">{c.welcomeBody}</p>
        <Link href="/hub" className="btn-primary inline-block">{c.welcomeCta}</Link>
      </div>
    </div>
  );
}
