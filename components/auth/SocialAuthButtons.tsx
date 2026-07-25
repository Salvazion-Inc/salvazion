'use client';

import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import XAuthButton from '@/components/auth/XAuthButton';
import { useI18n } from '@/components/I18nProvider';

interface Props {
  next?: string;
  onError?: (msg: string) => void;
  /** When false, social buttons are disabled (e.g. terms not accepted) */
  enabled?: boolean;
}

/** Stacked social providers: Google (Gmail) + X */
export default function SocialAuthButtons({
  next,
  onError,
  enabled = true,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-2.5">
      <GoogleAuthButton next={next} onError={onError} disabled={!enabled} />
      <XAuthButton next={next} onError={onError} disabled={!enabled} />
      {!enabled && (
        <p className="text-[10px] text-amber-400/90 text-center">
          {t('auth.acceptTermsRequired')}
        </p>
      )}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-px flex-1 bg-[var(--border-soft)]" />
        <span className="text-[10px] uppercase tracking-wider text-[var(--sage)]">
          {t('auth.orEmail')}
        </span>
        <div className="h-px flex-1 bg-[var(--border-soft)]" />
      </div>
    </div>
  );
}
