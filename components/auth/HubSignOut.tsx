'use client';

import { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { signOut } from '@/lib/store/profile';

/** Always-visible sign out in the private app shell. */
export default function HubSignOut() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signOut();
        window.location.assign('/auth/logout');
      }}
      className="fixed right-3 top-[calc(0.5rem+env(safe-area-inset-top))] z-40 rounded-full border border-[var(--border-soft)] bg-[var(--bg,#040404)]/80 px-3 py-1 text-[11px] text-[var(--sage)] hover:text-white"
    >
      {t('profile.signOut')}
    </button>
  );
}
