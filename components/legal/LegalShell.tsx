'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/config/site';
import { useI18n } from '@/components/I18nProvider';
import type { Language } from '@/lib/types';

const UI = {
  en: {
    legal: 'Legal',
    terms: 'Terms',
    privacy: 'Privacy',
    enter: 'Sign in',
    updated: 'Last updated',
    contact: 'Contact',
    langEn: 'EN',
    langEs: 'ES',
  },
  es: {
    legal: 'Legal',
    terms: 'Términos',
    privacy: 'Privacidad',
    enter: 'Entrar',
    updated: 'Última actualización',
    contact: 'Contacto',
    langEn: 'EN',
    langEs: 'ES',
  },
} as const;

export default function LegalShell({
  title,
  updated,
  children,
  docLang,
  onDocLangChange,
}: {
  title: string;
  updated: string;
  children: ReactNode;
  /** Language of the legal document body (EN principal) */
  docLang: Language;
  onDocLangChange: (lang: Language) => void;
}) {
  const { lang: appLang, setLang } = useI18n();
  const ui = UI[docLang] || UI.en;

  const switchLang = (next: Language) => {
    onDocLangChange(next);
    // Keep app locale aligned so TermsAccept / rest of app match
    if (appLang !== next) setLang(next);
  };

  return (
    <div className="min-h-screen bg-[var(--true-black)] text-[var(--off-white)]">
      <header className="border-b border-[var(--border-soft)] px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full border border-[var(--border-soft)] overflow-hidden lion-glow bg-[var(--true-black)] shrink-0">
              <Image
                src="/logo-icon.png"
                alt="Salvazion"
                width={36}
                height={36}
                className="object-cover"
              />
            </div>
            <span className="text-sm font-semibold text-[var(--accent)] truncate">
              Salvazion
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-xs text-[var(--sage)] shrink-0">
            <div
              className="flex rounded-lg border border-[var(--border-soft)] overflow-hidden"
              role="group"
              aria-label="Language"
            >
              <button
                type="button"
                onClick={() => switchLang('en')}
                className={`px-2.5 py-1.5 min-h-[36px] ${
                  docLang === 'en'
                    ? 'bg-[var(--surface-active)] text-[var(--accent)]'
                    : 'hover:text-[var(--accent)]'
                }`}
                aria-pressed={docLang === 'en'}
              >
                {ui.langEn}
              </button>
              <button
                type="button"
                onClick={() => switchLang('es')}
                className={`px-2.5 py-1.5 min-h-[36px] border-l border-[var(--border-soft)] ${
                  docLang === 'es'
                    ? 'bg-[var(--surface-active)] text-[var(--accent)]'
                    : 'hover:text-[var(--accent)]'
                }`}
                aria-pressed={docLang === 'es'}
              >
                {ui.langEs}
              </button>
            </div>
            <Link href="/terms" className="hover:text-[var(--accent)]">
              {ui.terms}
            </Link>
            <Link href="/privacy" className="hover:text-[var(--accent)]">
              {ui.privacy}
            </Link>
            <Link href="/auth/login" className="hover:text-[var(--accent)]">
              {ui.enter}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 pb-20">
        <p className="text-[10px] uppercase tracking-wider text-[var(--sage)] mb-2">
          {ui.legal}
        </p>
        <h1 className="text-3xl font-bold text-[var(--accent)] tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-xs text-[var(--sage)] mb-8">
          {ui.updated}: {updated}
        </p>
        <article className="prose-legal space-y-5 text-sm leading-relaxed text-[var(--off-white)]/90">
          {children}
        </article>
      </main>

      <footer className="border-t border-[var(--border-soft)] px-5 py-6 text-center text-[11px] text-[var(--sage)]/80">
        <p>
          © {new Date().getFullYear()} Salvazion ·{' '}
          <a
            href="https://app.salvazion.org"
            className="text-[var(--accent)] hover:underline"
          >
            app.salvazion.org
          </a>
        </p>
        <p className="mt-1">
          {ui.contact}:{' '}
          <a
            href={SUPPORT_MAILTO}
            className="text-[var(--accent)] hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </footer>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-white pt-2 border-t border-[var(--border-soft)] mt-6 first:border-0 first:mt-0 first:pt-0">
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[var(--off-white)]/85">{children}</p>;
}

export function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-[var(--off-white)]/85">
      {items.map((item) => (
        <li key={item.slice(0, 48)}>{item}</li>
      ))}
    </ul>
  );
}
