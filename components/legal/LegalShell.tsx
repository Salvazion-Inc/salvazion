'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { useI18n } from '@/components/I18nProvider';
import LanguageFlagSwitch from '@/components/ui/LanguageFlagSwitch';
import type { Language } from '@/lib/types';

const UI = {
  en: {
    legal: 'Legal',
    terms: 'Terms',
    privacy: 'Privacy',
    enter: 'Enter Salvazion',
    updated: 'Last updated',
    language: 'Language',
    rights: '© 2026 Salvazion, Inc. All rights reserved.',
  },
  es: {
    legal: 'Legal',
    terms: 'Términos',
    privacy: 'Privacidad',
    enter: 'Entrar a Salvazion',
    updated: 'Última actualización',
    language: 'Idioma',
    rights: '© 2026 Salvazion, Inc. Todos los derechos reservados.',
  },
  pt: {
    legal: 'Legal',
    terms: 'Termos',
    privacy: 'Privacidade',
    enter: 'Entrar na Salvazion',
    updated: 'Última atualização',
    language: 'Idioma',
    rights: '© 2026 Salvazion, Inc. Todos os direitos reservados.',
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
    <div className="marketing-shell text-[var(--off-white)]">
      <header className="glass-strong border-b border-[var(--border-soft)]/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 min-w-0 rounded-full focus-visible:outline-none"
          >
            <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404] shrink-0">
              <Image
                src="/logo-icon.png"
                alt="Salvazion"
                width={36}
                height={36}
                className="object-cover"
              />
            </div>
            <span className="font-brand text-lg text-[var(--accent)] neon-text hidden sm:inline">
              SALVAZION
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label={ui.legal}>
            <LanguageFlagSwitch
              value={docLang}
              onChange={switchLang}
              ariaLabel={ui.language}
              size="md"
            />
            <Link
              href="/auth/login"
              className="btn-primary nav-enter-cta !w-[11.75rem] shrink-0 !px-2 sm:!px-4 !min-h-10 !text-[11px] sm:!text-sm !whitespace-nowrap text-center leading-none"
            >
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
        <p>{ui.rights}</p>
        <p className="mt-2 flex items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-[var(--accent)]">
            {ui.terms}
          </Link>
          <Link href="/privacy" className="hover:text-[var(--accent)]">
            {ui.privacy}
          </Link>
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

export function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-[var(--off-white)]/85">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
