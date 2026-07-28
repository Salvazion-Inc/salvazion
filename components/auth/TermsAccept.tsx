'use client';

import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

/**
 * Required checkbox with links to /terms and /privacy (for X / Google app setup + legal).
 */
export default function TermsAccept({
  checked,
  onChange,
  id = 'accept-terms',
  className = '',
}: Props) {
  const { t } = useI18n();

  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 cursor-pointer select-none min-h-[44px] ${className}`}
    >
      <span className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 rounded border-[var(--border-strong)] bg-[var(--surface)] text-[var(--accent-fill)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] accent-[var(--accent-fill)]"
        />
      </span>
      <span className="text-[11px] leading-snug text-[var(--sage)] pt-2.5">
        {t('auth.acceptTermsPrefix')}{' '}
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] underline underline-offset-2 hover:opacity-90"
          onClick={(e) => e.stopPropagation()}
        >
          {t('auth.termsOfService')}
        </Link>{' '}
        {t('auth.acceptTermsAnd')}{' '}
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] underline underline-offset-2 hover:opacity-90"
          onClick={(e) => e.stopPropagation()}
        >
          {t('auth.privacyPolicy')}
        </Link>
        .
      </span>
    </label>
  );
}
