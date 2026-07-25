'use client';

import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import XAuthButton from '@/components/auth/XAuthButton';
import { useI18n } from '@/components/I18nProvider';

interface Props {
  next?: string;
  onError?: (msg: string) => void;
}

/** Stacked social providers: Google (Gmail) + X */
export default function SocialAuthButtons({ next, onError }: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-2.5">
      <GoogleAuthButton next={next} onError={onError} />
      <XAuthButton next={next} onError={onError} />
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
