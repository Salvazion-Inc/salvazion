'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import FingerprintMark from '@/components/auth/FingerprintMark';

/**
 * Jupiter-style lock chrome: identity + a large fingerprint.
 * The system sheet is the real unlock; the mark is visual + retry if cancelled.
 */
export default function BiometricUnlockScreen({
  title,
  subtitle,
  status,
  email,
  busy,
  error,
  promptLabel,
  onPrompt,
  footer,
}: {
  title: string;
  subtitle: string;
  status: string;
  email?: string | null;
  busy: boolean;
  error?: string | null;
  promptLabel: string;
  onPrompt: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <div className="w-16 h-16 mx-auto mb-5 rounded-full border border-[var(--border-strong)] flex items-center justify-center overflow-hidden lion-glow">
        <Image
          src="/logo.png"
          alt=""
          width={64}
          height={64}
          className="object-contain"
        />
      </div>
      <h1
        id="biometric-unlock-title"
        className="font-display text-2xl font-bold text-[var(--accent)] tracking-tight"
      >
        {title}
      </h1>
      <p className="text-sm text-[var(--sage)] mt-1.5">{subtitle}</p>
      {email ? (
        <p className="mt-2 text-[11px] text-[var(--sage)]/80 leading-relaxed">{email}</p>
      ) : null}

      <button
        type="button"
        onClick={onPrompt}
        disabled={busy}
        className={`fingerprint-unlock-btn mt-8 mx-auto w-28 h-28 rounded-full border border-[var(--accent)] bg-[var(--surface-active)] text-[var(--accent)] flex items-center justify-center transition disabled:opacity-70 ${
          busy ? 'fingerprint-unlock-btn-busy' : ''
        }`}
        aria-label={promptLabel}
      >
        <FingerprintMark size={44} />
      </button>
      <p
        className="mt-4 text-sm font-medium text-[var(--accent)]"
        aria-live="polite"
      >
        {status}
      </p>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {footer ? <div className="mt-10">{footer}</div> : null}
    </div>
  );
}
