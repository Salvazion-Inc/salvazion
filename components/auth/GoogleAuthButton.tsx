'use client';

import { useState } from 'react';
import { signInWithGoogle } from '@/lib/auth/google-oauth';
import { useI18n } from '@/components/I18nProvider';
import { mapAuthError } from '@/lib/auth/paths';

interface Props {
  next?: string;
  className?: string;
  onError?: (msg: string) => void;
}

/** Login / sign-up with Gmail (Google) via Supabase OAuth */
export default function GoogleAuthButton({
  next = '/hub/dashboard',
  className = '',
  onError,
}: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const { error } = await signInWithGoogle({ next });
    if (error) {
      onError?.(mapAuthError(error));
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={loading}
      className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-[var(--border-strong)] bg-white/[0.06] text-[#D8E1D9] text-sm font-semibold hover:bg-[var(--surface-active)] transition disabled:opacity-50 ${className}`}
      aria-label={t('auth.continueWithGoogle')}
    >
      <GoogleLogo className="w-4 h-4 shrink-0" />
      <span>{loading ? t('auth.processing') : t('auth.continueWithGoogle')}</span>
    </button>
  );
}

function GoogleLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2 6.8 2.2 2.6 6.4 2.6 11.6S6.8 21 12 21c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5H12z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.5l3.2 2.3C8 7.6 9.8 6.3 12 6.3c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2 8.2 2.2 4.9 4.4 3.9 7.5z"
        opacity="0"
      />
      <path
        fill="#4285F4"
        d="M12 21c2.7 0 4.9-.9 6.5-2.4l-3.2-2.5c-.9.6-2 1-3.3 1-3.2 0-5.9-2.1-6.9-5l-3.2 2.5C3.9 18.6 7.6 21 12 21z"
      />
      <path
        fill="#FBBC05"
        d="M5.1 14.1c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2L1.9 7.6C1.3 8.9 1 10.2 1 11.6s.3 2.7.9 4l3.2-1.5z"
      />
      <path
        fill="#EA4335"
        d="M12 6.3c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2 8.2 2.2 4.9 4.4 3.9 7.5l3.2 2.3C8 7.6 9.8 6.3 12 6.3z"
      />
      <path
        fill="#4285F4"
        d="M21.1 11.6c0-.6-.1-1.1-.2-1.5H12v3.9h5.5c-.3 1.3-1.1 2.3-2.2 3l3.2 2.5c1.9-1.7 2.6-4.3 2.6-7.9z"
      />
    </svg>
  );
}
