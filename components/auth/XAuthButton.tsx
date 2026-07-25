'use client';

import { useState } from 'react';
import { signInWithX } from '@/lib/auth/x-oauth';
import { useI18n } from '@/components/I18nProvider';
import { mapAuthError } from '@/lib/auth/paths';

interface Props {
  /** Post-login path (onboarding for new users is resolved after callback) */
  next?: string;
  /** Visual variant */
  variant?: 'primary' | 'secondary';
  className?: string;
  onError?: (msg: string) => void;
}

/** Login / sign-up with X (Twitter) via Supabase OAuth */
export default function XAuthButton({
  next = '/hub/dashboard',
  variant = 'secondary',
  className = '',
  onError,
}: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const { error } = await signInWithX({ next });
    if (error) {
      const msg = mapAuthError(error);
      onError?.(msg);
      setLoading(false);
      // OAuth redirects on success; only stop loading on error
    }
  }

  const base =
    variant === 'primary'
      ? 'btn-primary'
      : 'w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-[var(--border-strong)] bg-black/40 text-[#D8E1D9] text-sm font-semibold hover:bg-[var(--surface-active)] transition disabled:opacity-50';

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={loading}
      className={`${base} ${className}`}
      aria-label={t('auth.continueWithX')}
    >
      <XLogo className="w-4 h-4 shrink-0" />
      <span>{loading ? t('auth.processing') : t('auth.continueWithX')}</span>
    </button>
  );
}

function XLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}
