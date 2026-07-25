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
      className={`flex items-start gap-2.5 cursor-pointer select-none ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border-strong)] bg-[#0a0a0a] text-[var(--accent-fill)] focus:ring-[var(--accent)] focus:ring-offset-0 accent-[#7BC98A]"
      />
      <span className="text-[11px] leading-snug text-[var(--sage)]">
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
