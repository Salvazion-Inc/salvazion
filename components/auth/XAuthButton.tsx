'use client';

import { useState } from 'react';
import { signInWithX } from '@/lib/auth/x-oauth';
import { useI18n } from '@/components/I18nProvider';
import { mapAuthError } from '@/lib/auth/paths';
import { textWithXLogo } from '@/components/ui/XLogo';

interface Props {
  /** Post-login path (onboarding for new users is resolved after callback) */
  next?: string;
  /** Visual variant */
  variant?: 'primary' | 'secondary';
  className?: string;
  onError?: (msg: string) => void;
  disabled?: boolean;
}

/** Login / sign-up with X via Supabase OAuth 2.0 only */
export default function XAuthButton({
  next = '/hub/dashboard',
  variant = 'secondary',
  className = '',
  onError,
  disabled = false,
}: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (disabled) {
      onError?.(t('auth.acceptTermsRequired'));
      return;
    }
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
      disabled={loading || disabled}
      className={`${base} ${className}`}
      aria-label={t('auth.continueWithX')}
    >
      <span className="inline-flex items-center gap-1.5">
        {loading
          ? t('auth.processing')
          : textWithXLogo(t('auth.continueWithX'), 'w-4 h-4 shrink-0')}
      </span>
    </button>
  );
}
