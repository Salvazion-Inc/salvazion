'use client';

import { Fragment, useEffect, useState, type ReactNode } from 'react';
import LegalShell, { H2, P, Ul } from '@/components/legal/LegalShell';
import { useI18n } from '@/components/I18nProvider';
import type { Language } from '@/lib/types';
import type { LegalDoc } from '@/lib/legal/terms';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/config/site';
import XLogo from '@/components/ui/XLogo';

/**
 * Renders a legal document. English is principal; user can switch EN/ES/PT.
 */
export default function LegalDocument({
  docs,
  relatedHref,
  relatedLabelEn,
  relatedLabelEs,
  relatedLabelPt,
}: {
  docs: Record<Language, LegalDoc>;
  relatedHref: string;
  relatedLabelEn: string;
  relatedLabelEs: string;
  relatedLabelPt?: string;
}) {
  const { lang } = useI18n();
  const [docLang, setDocLang] = useState<Language>('en');

  useEffect(() => {
    if (lang === 'en' || lang === 'es' || lang === 'pt') setDocLang(lang);
  }, [lang]);

  const doc = docs[docLang] || docs.en;
  const relatedLabel =
    docLang === 'es'
      ? relatedLabelEs
      : docLang === 'pt'
        ? relatedLabelPt || relatedLabelEn
        : relatedLabelEn;

  return (
    <LegalShell
      title={doc.title}
      updated={doc.updated}
      docLang={docLang}
      onDocLangChange={setDocLang}
    >
      {doc.sections.map((section, idx) => (
        <section key={`${section.heading || 'intro'}-${idx}`}>
          {section.heading ? (
            <H2>{renderLegalRichText(section.heading, relatedHref, relatedLabel)}</H2>
          ) : null}
          {section.intro ? (
            <P>{renderLegalRichText(section.intro, relatedHref, relatedLabel)}</P>
          ) : null}
          {section.paragraphs?.map((p, i) => (
            <P key={i}>{renderLegalRichText(p, relatedHref, relatedLabel)}</P>
          ))}
          {section.bullets ? (
            <Ul
              items={section.bullets.map((b) =>
                renderLegalRichText(b, relatedHref, relatedLabel)
              )}
            />
          ) : null}
        </section>
      ))}
    </LegalShell>
  );
}

/**
 * Legal copy: inject email/path links and replace standalone “X” with brand logo.
 */
function renderLegalRichText(
  text: string,
  relatedHref: string,
  relatedLabel: string
): ReactNode {
  if (!text.includes('X') && !text.includes(SUPPORT_EMAIL) && !text.includes('/privacy') && !text.includes('/terms')) {
    return text;
  }

  // Split platform X first, then linkify each plain fragment
  const parts = text.split(/(\bX\b)/g);
  return parts.map((part, i) => {
    if (part === 'X') {
      return (
        <XLogo
          key={`x-${i}`}
          className="inline-block w-[0.9em] h-[0.9em] align-[-0.12em] mx-0.5"
        />
      );
    }
    return (
      <Fragment key={`t-${i}`}>
        {linkifyContact(part, relatedHref, relatedLabel)}
      </Fragment>
    );
  });
}

/** Light link injection for email and related legal path */
function linkifyContact(
  text: string,
  relatedHref: string,
  relatedLabel: string
): ReactNode {
  if (!text) return text;
  // Related doc path mention
  if (text.includes('/privacy') || text.includes('/terms')) {
    const parts = text.split(/(\/privacy|\/terms)/);
    return parts.map((part, i) => {
      if (part === '/privacy' || part === '/terms') {
        return (
          <a
            key={i}
            href={relatedHref}
            className="text-[var(--accent)] hover:underline"
          >
            {relatedLabel}
          </a>
        );
      }
      return linkifyEmail(part, i);
    });
  }
  return linkifyEmail(text, 0);
}

function linkifyEmail(text: string, keyBase: number): ReactNode {
  if (!text || !text.includes(SUPPORT_EMAIL)) return text;
  const parts = text.split(SUPPORT_EMAIL);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    nodes.push(part);
    if (i < parts.length - 1) {
      nodes.push(
        <a
          key={`${keyBase}-em-${i}`}
          href={SUPPORT_MAILTO}
          className="text-[var(--accent)] hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      );
    }
  });
  return nodes;
}
