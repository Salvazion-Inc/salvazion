import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9]">
      <header className="border-b border-[var(--border-soft)] px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full border border-[var(--border-soft)] overflow-hidden lion-glow bg-[#040404] shrink-0">
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
          <nav className="flex gap-3 text-xs text-[var(--sage)] shrink-0">
            <Link href="/terms" className="hover:text-[var(--accent)]">
              Términos
            </Link>
            <Link href="/privacy" className="hover:text-[var(--accent)]">
              Privacidad
            </Link>
            <Link href="/auth/login" className="hover:text-[var(--accent)]">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 pb-20">
        <p className="text-[10px] uppercase tracking-wider text-[var(--sage)] mb-2">
          Legal
        </p>
        <h1 className="text-3xl font-bold text-[var(--accent)] tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-xs text-[var(--sage)] mb-8">
          Última actualización: {updated}
        </p>
        <article className="prose-legal space-y-5 text-sm leading-relaxed text-[#D8E1D9]/90">
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
          Contacto:{' '}
          <a
            href="mailto:info@salvazion.org"
            className="text-[var(--accent)] hover:underline"
          >
            info@salvazion.org
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
  return <p className="text-[#D8E1D9]/85">{children}</p>;
}

export function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-[#D8E1D9]/85">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
