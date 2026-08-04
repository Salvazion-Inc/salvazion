'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import JupiterSwap from '@/components/wallet/JupiterSwap';
import { useI18n } from '@/components/I18nProvider';
import { PLAN_COPY } from '@/lib/billing/plans';
import LanguageFlagSwitch from '@/components/ui/LanguageFlagSwitch';
import XLogo, { textWithXLogo } from '@/components/ui/XLogo';
import LandingBlog from '@/components/landing/LandingBlog';
import { SALVAZION_MINT } from '@/lib/solana/config';

const MINT = SALVAZION_MINT;

const X_ACCOUNT_URL = 'https://x.com/salvazion_';
const LINKEDIN_CRISTIAN =
  'https://www.linkedin.com/in/exponential-healthtech/';
const LINKEDIN_BEATRIZ = 'https://www.linkedin.com/in/beatriz-isler/';

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function TokenMintCopy({
  mint,
  copyLabel,
  copiedLabel,
}: {
  mint: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    const ok = await copyToClipboard(mint);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [mint]);

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="group mx-auto mb-8 flex max-w-full items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[#0a0a0a] px-3 py-2.5 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-active)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:scale-[0.99]"
      aria-label={copied ? copiedLabel : copyLabel}
      title={copied ? copiedLabel : copyLabel}
    >
      <span className="min-w-0 flex-1 break-all font-mono text-[10px] sm:text-xs text-[var(--off-white)]/90">
        <span className="text-[var(--sage)]">CA:</span> {mint}
      </span>
      <span
        className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider ${
          copied ? 'text-[var(--accent)]' : 'text-[var(--sage)] group-hover:text-[var(--accent)]'
        }`}
      >
        {copied ? copiedLabel : copyLabel}
      </span>
    </button>
  );
}

export default function SalvazionLanding() {
  const { lang, setLang } = useI18n();
  const t = copy[lang];

  return (
    <div className="min-h-screen bg-[var(--true-black)] text-[var(--off-white)] selection:bg-[rgba(143,217,154,0.28)]">
      {/* Skip link — keyboard / a11y + crawlable landmark */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-full focus:bg-[var(--accent)] focus:text-[#0a120c] focus:text-sm focus:font-semibold focus:shadow-[var(--shadow-glow)]"
      >
        {lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}
      </a>
      {/* Nav — floating glass bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-[var(--border-soft)]/80"
        aria-label={lang === 'es' ? 'Principal' : 'Primary'}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 min-w-0 rounded-full focus-visible:outline-none"
          >
            <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404] shrink-0">
              <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
            </div>
            <span className="font-brand text-lg text-[var(--accent)] neon-text hidden sm:inline">
              SALVAZION
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 xl:gap-7 text-[11px] uppercase tracking-[0.16em] text-[var(--sage)]">
            <a href="#app" className="nav-link-marketing">
              {t.nav.app}
            </a>
            <a href="#team" className="nav-link-marketing">
              {t.nav.team}
            </a>
            <a href="#pricing" className="nav-link-marketing">
              {t.nav.pricing}
            </a>
            <a href="#blog" className="nav-link-marketing">
              {t.nav.blog}
            </a>
            <a href="#token" className="nav-link-marketing">
              {t.nav.token}
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageFlagSwitch
              value={lang}
              onChange={setLang}
              ariaLabel={t.nav.language}
              size="md"
            />
            <Link
              href="/auth/login"
              className="btn-primary !w-[11.75rem] sm:!w-[12.5rem] shrink-0 !px-3 sm:!px-4 !min-h-10 !text-xs sm:!text-sm !whitespace-normal text-center leading-tight"
            >
              {t.nav.enter}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — same Canva home video (green smoke) */}
      <main id="main">
      <section
        className="relative min-h-[min(100dvh,920px)] flex items-center justify-center overflow-hidden pt-20"
        aria-labelledby="hero-heading"
      >
        {/*
          Same Canva home asset (green smoke). On salvazion.org the fill is
          mirrored horizontally so the dense plume sits on the right — match that.
        */}
        <video
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          src="/videos/hero-home.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[#040404]/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040404]/55 via-transparent to-[#040404]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#040404] to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 text-center py-16 sm:py-24">
          <div className="flex justify-center mb-7">
            <Image
              src="/logo.png"
              alt="Salvazion Green Lion"
              width={200}
              height={200}
              className="lion-glow w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-[0_0_40px_rgba(143,217,154,0.25)]"
              priority
            />
          </div>

          <h1
            id="hero-heading"
            className="font-display font-bold leading-[0.95] tracking-tight text-[clamp(1.5rem,6.6vw,4.5rem)]"
          >
            {/* Exactly 3 lines on mobile — each line never wraps */}
            <span className="block whitespace-nowrap neon-text">
              {t.hero.titleLines[0]}
            </span>
            <span className="block whitespace-nowrap neon-text">
              {t.hero.titleLines[1]}
            </span>
            <span className="block whitespace-nowrap text-[var(--accent)] drop-shadow-[0_0_24px_rgba(143,217,154,0.35)]">
              {t.hero.titleLines[2]}
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-none sm:max-w-xl text-[#D8E1D9]/92 leading-relaxed">
            {/* One line on mobile (fluid size so Spanish fits) */}
            <span className="block whitespace-nowrap text-[clamp(0.68rem,2.55vw+0.28rem,1.125rem)]">
              {t.hero.tagline}
            </span>
            <span className="mt-1.5 block text-sm sm:text-base text-[var(--accent)] font-medium text-pretty">
              {t.hero.tagline2}
            </span>
          </p>

          <div className="btn-marketing-pair mt-9">
            <Link
              href="/auth/signup"
              className="btn-primary !w-full !min-w-0 !whitespace-normal text-center leading-snug"
            >
              {t.hero.ctaPrimary}
            </Link>
            <Link
              href="/auth/login"
              className="btn-secondary !w-full !min-w-0 !whitespace-normal text-center leading-snug"
            >
              {t.hero.ctaLogin}
            </Link>
          </div>
        </div>
      </section>

      {/* One App + Purpose fused */}
      <section id="app" className="section-pad border-t border-[var(--border-soft)]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <p className="section-eyebrow mb-3">{t.app.eyebrow}</p>
            <h2 className="section-title text-3xl sm:text-4xl md:text-[2.65rem]">{t.app.title}</h2>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#D8E1D9]/88 text-pretty">
              {t.app.body}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mb-11">
            {t.app.areas.map((area) => (
              <div
                key={area.name}
                className="card-soft card-lift p-6 sm:p-7 flex flex-col min-h-[220px] border-t-2"
                style={{ borderTopColor: area.accent }}
              >
                <div
                  className="mb-4 w-16 h-16 rounded-2xl overflow-hidden border border-[var(--border-soft)] shrink-0 shadow-[0_0_24px_-8px_rgba(143,217,154,0.45)]"
                  style={{ boxShadow: `0 0 28px -8px ${area.accent}99` }}
                >
                  <Image
                    src={area.icon}
                    alt=""
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3
                  className="text-xl font-bold tracking-tight"
                  style={{ color: area.accent }}
                >
                  {area.name}
                </h3>
                <p className="mt-2 text-sm text-[#D8E1D9]/80 leading-relaxed flex-1">
                  {textWithXLogo(area.body)}
                </p>
                <p className="mt-4 text-[11px] text-[var(--sage)] uppercase tracking-wider">
                  {textWithXLogo(area.inApp)}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center flex justify-center">
            <Link href="/auth/login" className="btn-primary btn-marketing">
              {t.app.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* Team — founders (before pricing) */}
      <section id="team" className="section-pad border-t border-[var(--border-soft)] bg-zinc-950/35">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <p className="section-eyebrow mb-3">{t.team.eyebrow}</p>
            <h2 className="section-title text-3xl sm:text-4xl md:text-[2.65rem]">
              {t.team.title}
            </h2>
            <p className="mt-5 text-sm sm:text-base text-[#D8E1D9]/88 leading-relaxed text-pretty">
              {t.team.intro}
            </p>
          </div>

          <div className="mb-8 rounded-3xl overflow-hidden border border-[var(--border-soft)] card-soft shadow-[0_0_40px_-12px_rgba(34,197,94,0.25)]">
            <div className="relative aspect-[16/9] sm:aspect-[2/1] min-h-[240px] sm:min-h-[340px] bg-[#040404]">
              <Image
                src="/founders/family.jpg"
                alt="Cristian Cortés y Beatriz Isler — Founders de Salvazion"
                fill
                className="object-cover object-[center_30%]"
                sizes="(max-width: 1024px) 100vw, 960px"
                priority={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <p className="text-[10px] sm:text-xs text-[var(--accent)] uppercase tracking-[0.25em]">
                  Founders Family
                </p>
                <p className="mt-1 text-lg sm:text-2xl font-semibold text-white tracking-tight">
                  Cristian Cortés &amp; Beatriz Isler
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card-soft p-6 sm:p-8">
              <a
                href={LINKEDIN_CRISTIAN}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 mb-4 group rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label="Cristian Cortés — LinkedIn"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent)]/40 shrink-0 bg-black ring-2 ring-[var(--border-soft)] transition group-hover:border-[var(--accent)]/70">
                  <Image
                    src="/founders/cristian.jpg"
                    alt="Cristian Cortés"
                    fill
                    className="object-cover object-[center_18%]"
                    sizes="80px"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-1">
                    CEO & Founder
                  </p>
                  <h3 className="text-xl font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                    Cristian Cortés
                  </h3>
                  <p className="text-[11px] text-[var(--sage)]">{t.team.cristianRole}</p>
                  <p className="mt-1.5 text-[11px] font-medium text-[var(--accent)]">
                    LinkedIn ↗
                  </p>
                </div>
              </a>
              <p className="text-sm text-[#D8E1D9]/80 leading-relaxed">{t.team.cristian}</p>
            </div>
            <div className="card-soft p-6 sm:p-8">
              <a
                href={LINKEDIN_BEATRIZ}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 mb-4 group rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label="Beatriz Isler — LinkedIn"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent)]/40 shrink-0 bg-black ring-2 ring-[var(--border-soft)] transition group-hover:border-[var(--accent)]/70">
                  <Image
                    src="/founders/beatriz.jpg"
                    alt="Beatriz Isler"
                    fill
                    className="object-cover object-[center_18%]"
                    sizes="80px"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-1">
                    COO & Founder
                  </p>
                  <h3 className="text-xl font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                    Beatriz Isler
                  </h3>
                  <p className="text-[11px] text-[var(--sage)]">{t.team.beatrizRole}</p>
                  <p className="mt-1.5 text-[11px] font-medium text-[var(--accent)]">
                    LinkedIn ↗
                  </p>
                </div>
              </a>
              <p className="text-sm text-[#D8E1D9]/80 leading-relaxed">{t.team.beatriz}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — freemium as built */}
      <section id="pricing" className="section-pad border-t border-[var(--border-soft)] bg-zinc-950/40">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="section-eyebrow mb-3">{t.pricing.eyebrow}</p>
            <h2 className="section-title text-3xl sm:text-4xl md:text-[2.65rem]">
              {t.pricing.title}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* Free — same typography / spacing / button size as Premium */}
            <div className="card-soft card-lift p-6 sm:p-8 flex flex-col h-full">
              <div className="flex items-center justify-between gap-2 min-h-[1.75rem]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--sage)]">
                  {lang === 'es' ? PLAN_COPY.free.nameEs : PLAN_COPY.free.name}
                </p>
                {/* Keeps header height aligned with Premium badge row */}
                <span className="invisible text-[10px] px-2.5 py-1 rounded-full font-semibold">
                  {t.pricing.bestValue}
                </span>
              </div>

              <p className="mt-3 text-4xl font-bold text-white tracking-tight tabular-nums leading-none">
                $0
              </p>
              <p className="mt-2 text-sm text-[var(--sage)] leading-snug">
                {lang === 'es' ? '/ mes · siempre gratis' : '/ month · always free'}
              </p>
              {/* Spacer matches Premium annual price line */}
              <p className="mt-1 text-sm leading-snug min-h-[1.25rem] text-transparent select-none" aria-hidden>
                —
              </p>

              <p className="mt-3 text-xs text-[var(--sage)] leading-relaxed min-h-[2.5rem]">
                {t.pricing.freeNote}
              </p>

              <ul className="mt-5 space-y-2 text-sm text-[#D8E1D9]/90 flex-1">
                {t.pricing.freeItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--accent)] shrink-0 w-4 text-center">·</span>
                    <span>{textWithXLogo(item)}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/signup"
                className="btn-secondary font-display font-bold mt-6 w-full min-h-[3rem] !whitespace-normal text-center text-balance leading-snug"
              >
                {t.pricing.ctaFree}
              </Link>
            </div>

            {/* Premium — identical layout scale as Free */}
            <div className="card-soft card-lift p-6 sm:p-8 flex flex-col h-full border-[#8FD99A]/35 bg-gradient-to-b from-[#8FD99A]/10 to-transparent shadow-[var(--shadow-glow)]">
              <div className="flex items-center justify-between gap-2 min-h-[1.75rem]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8FD99A]">
                  Premium
                </p>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#8FD99A]/18 text-[#8FD99A] font-semibold border border-[#8FD99A]/25">
                  {t.pricing.bestValue}
                </span>
              </div>

              <p className="mt-3 text-4xl font-bold text-white tracking-tight tabular-nums leading-none">
                ${PLAN_COPY.premium_month.priceUsd}
              </p>
              <p className="mt-2 text-sm text-[var(--sage)] leading-snug">
                {lang === 'es' ? '/ mes' : '/ month'}
              </p>
              <p className="mt-1 text-sm text-[#8FD99A] leading-snug min-h-[1.25rem]">
                {lang === 'es'
                  ? PLAN_COPY.premium_year.priceLabelEs
                  : PLAN_COPY.premium_year.priceLabel}
              </p>

              <p className="mt-3 text-xs text-[var(--sage)] leading-relaxed min-h-[2.5rem]">
                {t.pricing.premiumNote}
              </p>

              <ul className="mt-5 space-y-2 text-sm text-[#D8E1D9]/90 flex-1">
                {t.pricing.premiumItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--accent)] shrink-0 w-4 text-center">·</span>
                    <span>{textWithXLogo(item)}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/signup"
                className="btn-primary font-display font-bold mt-6 w-full min-h-[3rem] !whitespace-normal text-center text-balance leading-snug"
              >
                {t.pricing.ctaPremium}
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-[var(--sage)]/80 leading-relaxed max-w-xl mx-auto">
            {t.pricing.stripeNote}
          </p>
        </div>
      </section>

      {/* Blog — @salvazion_ X Articles */}
      <LandingBlog lang={lang} copy={t.blog} />

      {/* Token — last section */}
      <section id="token" className="section-pad border-t border-[var(--border-soft)]">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <p className="section-eyebrow mb-3">Solana</p>
          <h2 className="section-title text-4xl sm:text-5xl tracking-tighter mb-3 text-[var(--accent)] neon-text">
            $SALVAZION
          </h2>
          <p className="text-sm text-[var(--sage)] mb-6">{t.token.subtitle}</p>
          <TokenMintCopy
            mint={MINT}
            copyLabel={t.token.copyCa}
            copiedLabel={t.token.copiedCa}
          />

          <div className="max-w-md mx-auto text-left space-y-4">
            <WalletConnectCard showJupiter={false} />
            <div className="card-soft p-3">
              <p className="text-center text-[10px] text-[var(--sage)] mb-2 uppercase tracking-wider">
                Jupiter · Solana
              </p>
              <JupiterSwap mode="modal" triggerLabel={t.token.buy} />
            </div>
          </div>
        </div>
      </section>

      </main>

      <footer className="border-t border-[var(--border-soft)] py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--sage)]/80">
          <p>{t.footer.copy}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/terms" className="hover:text-[var(--accent)]">
              {t.footer.terms}
            </Link>
            <a
              href={X_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border-soft)] text-[var(--off-white)] hover:text-[var(--accent)] hover:border-[var(--border-strong)] transition"
              aria-label="@salvazion_ on X"
              title="@salvazion_ on X"
            >
              <XLogo className="w-4 h-4" title="X" />
            </a>
            <Link href="/privacy" className="hover:text-[var(--accent)]">
              {t.footer.privacy}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const copy = {
  en: {
    nav: {
      app: 'The App',
      blog: 'Blog',
      pricing: 'Pricing',
      token: 'Token',
      team: 'Team',
      enter: 'Enter Salvazion',
      language: 'Language',
    },
    hero: {
      /** Full motto in exactly three lines */
      titleLines: [
        'MAKE SALVATION,',
        'HEALTH AND FREEDOM',
        'GREAT AGAIN',
      ] as const,
      tagline: 'The secular world strips spirit, mind, body and soul.',
      tagline2: 'Salvazion gives them back — in one App.',
      ctaPrimary: 'Create free account',
      ctaLogin: 'I have an account',
    },
    app: {
      eyebrow: 'Our Purpose · One App',
      title: 'Everything fused into a single App',
      body:
        'Our Purpose is make Salvation, Health and Freedom great again, through a Global Community that defends Western Christian Culture and BioConservatism in a Spiritual Warfare.',
      cta: 'Open the App',
      areas: [
        {
          name: 'Salvation',
          icon: '/icons/agenda/salvation.jpg',
          accent: '#F5F7F5',
          body: 'Faith at the center. Full offline Bible, daily devotionals, prayer motives, discipline calendar and measurable spiritual scores.',
          inApp: 'Bible · Devotional · Prayer · Salvazion',
        },
        {
          name: 'Health',
          icon: '/icons/agenda/health.jpg',
          accent: '#4A9EFF',
          body: 'The body is a temple. Sleep, hydration, meals, sports, phone sensors, Bluetooth HR and cloud wearables (Premium).',
          inApp: 'Health · sensors · wearables · biomarkers',
        },
        {
          name: 'Freedom',
          icon: '/icons/agenda/freedom.jpg',
          accent: '#8FD99A',
          body: 'Freedom with responsibility: curated books, X articles, YouTube channels, Phalanx community and economic sovereignty on Solana.',
          inApp: 'Freedom · Community · $SALVAZION swap',
        },
      ],
    },
    pricing: {
      eyebrow: 'Freemium',
      title: 'Start free. Go Premium when ready.',
      freeNote: 'Forever free to start the journey',
      freeItems: [
        'Dashboard, daily scores and onboarding',
        'Full offline Bible (ES · EN · originals) — read, search and concordance',
        'Daily rules-based devotional',
        'Manual health logs, phone sensors and BLE heart rate',
        'Freedom library browse — books, X articles and YouTube',
        'Basic Phalanx invites for family and friends',
        'Solana wallet connect (Jupiter Mobile, Phantom, Solflare)',
        '$SALVAZION swap via Jupiter — we never hold your keys',
        'Profile and basic badges',
      ],
      premiumNote: 'Everything in Free, plus full access and advanced tools',
      premiumItems: [
        'Salvazion AI (chat coach)',
        'Salvazion voice / TTS',
        'Unlimited AI devotionals — Scripture, virtue and BioConservatism',
        'Cloud wearables OAuth (Fitbit, Oura, WHOOP, Garmin)',
        'Advanced health: biomarkers, clinical record, women’s health',
        'Full calendar and discipline planner',
        'Advanced prayer motives tools',
        'Full Freedom library + swap terminal',
        'Unlimited Phalanx invites and tracking',
      ],
      bestValue: 'Best value yearly',
      ctaFree: 'Create free account',
      ctaPremium: 'Join & upgrade to Premium',
      stripeNote:
        'Secure payments with Stripe (Salvazion, Inc.). Cancel or change plans anytime in the customer portal.',
    },
    token: {
      subtitle: 'Buy $SALVAZION Patriot Bitcoin on Solana',
      buy: 'Buy $SALVAZION',
      copyCa: 'Copy',
      copiedCa: 'Copied',
    },
    blog: {
      eyebrow: 'Blog · @salvazion_',
      title: 'Salvazion Articles on X',
      subtitle:
        'Deep long-form on X to grow your spirit, strengthen your health and expand your freedom. Every piece opens on X.',
      filters: {
        all: 'All',
        salvation: 'Salvation',
        health: 'Health',
        freedom: 'Freedom',
      },
      readOnX: 'Read on X',
      showing: 'Showing',
      of: 'of',
      empty: 'No articles in this pillar yet.',
      viewAllOnX: 'Open full library on X',
    },
    team: {
      eyebrow: 'Founders',
      title: 'An ordinary family, but with “good genes”',
      intro:
        'Cristian Cortés and Beatriz Isler are a married couple, who have worked together for 20+ years in different health, education, technology and innovation startups, who complement each other and share values (excellence, integrity and deep respect for the service of people), adapting constantly to achieve its purpose: Make Salvation, Health and Freedom great again!',
      cristianRole: 'CEO at Salvazion Inc.',
      cristian:
        'Physical Therapist, Bachelor of Kinesiology. Master in Physical Therapy, Minor in Psychology and Diplomas in Rehabilitation, Exercise, Health and University Innovation. Sherpa and Instructor in “Evidence Based Entrepreneurship & Lean Innovation (EBELI)”. Former Singularity University Ambassador Santiago Chapter. “ExO Entrepreneur LATAM” for the ExO Community Award. “Fifty of the Most Influential Voices in Healthcare” for Medika Life, “Top 50 Global HealthTech Thought Leader and Influencers on Ecosystems” for Thinker 360 and “Top 200 Exponentialists in Digital Health”.',
      beatrizRole: 'COO at Salvazion Inc.',
      beatriz:
        'Physical Therapist, Bachelor of Kinesiology. Master in Physical Therapy with Diplomas in Rehabilitation, Exercise and Health, with experience as a University Professor and Researcher in Human Functionality, Digital Health and Aquatic Therapy. She did an International Clinical Internship in Hydrotherapy. She coordinated the “Choose Living Healthy” program of the Ministry of Health; however, her greatest achievement is to form a beautiful family (husband and four children), balancing her life as an entrepreneur. In 2022, she was recognized as a “Digital Health Champion” by the IDB (Inter-American Development Bank).',
    },
    footer: {
      copy: '© 2026 Salvazion Inc. All rights reserved.',
      terms: 'Terms',
      privacy: 'Privacy',
    },
  },
  es: {
    nav: {
      app: 'La App',
      blog: 'Blog',
      pricing: 'Precios',
      token: 'Token',
      team: 'Equipo',
      enter: 'Entrar a Salvazion',
      language: 'Idioma',
    },
    hero: {
      /** Motto completo en exactamente tres líneas */
      titleLines: [
        'MAKE SALVATION,',
        'HEALTH AND FREEDOM',
        'GREAT AGAIN',
      ] as const,
      tagline: 'El mundo secular te quita el espíritu, mente, cuerpo y alma.',
      tagline2: 'Salvazion te los devuelve — en una sola App.',
      ctaPrimary: 'Crear cuenta gratis',
      ctaLogin: 'Ya tengo cuenta',
    },
    app: {
      eyebrow: 'Nuestro propósito · Una sola App',
      title: 'Todo fusionado en una sola App',
      body:
        'Nuestro Propósito es hacer Salvación, Salud y Libertad geniales otra vez, con una Comunidad Global que defiende la Cultura Cristiana Occidental y el BioConservadurismo en una Guerra Espiritual.',
      cta: 'Abrir la App',
      areas: [
        {
          name: 'Salvation',
          icon: '/icons/agenda/salvation.jpg',
          accent: '#F5F7F5',
          body: 'La fe al centro. Biblia completa offline, devocional diario, motivos de oración, calendario de disciplina y scores espirituales medibles.',
          inApp: 'Biblia · Devocional · Oración · Salvazion',
        },
        {
          name: 'Health',
          icon: '/icons/agenda/health.jpg',
          accent: '#4A9EFF',
          body: 'El cuerpo es templo. Sueño, hidratación, comidas, deportes, sensores del celular, HR Bluetooth y wearables en la nube (Premium).',
          inApp: 'Health · sensores · wearables · biomarcadores',
        },
        {
          name: 'Freedom',
          icon: '/icons/agenda/freedom.jpg',
          accent: '#8FD99A',
          body: 'Libertad con responsabilidad: libros curados, artículos en X, canales de YouTube, comunidad Phalanx y soberanía económica en Solana.',
          inApp: 'Freedom · Comunidad · Swap $SALVAZION',
        },
      ],
    },
    pricing: {
      eyebrow: 'Freemium',
      title: 'Empieza gratis. Pasa a Premium cuando quieras.',
      freeNote: 'Gratis para siempre para empezar el camino',
      freeItems: [
        'Dashboard, scores diarios y onboarding',
        'Biblia completa offline (ES · EN · originales) — lectura, búsqueda y concordancia',
        'Devocional diario por reglas',
        'Salud manual, sensores del teléfono y HR Bluetooth',
        'Biblioteca Freedom — libros, artículos en X y YouTube',
        'Invitaciones Phalanx básicas para familia y amigos',
        'Billetera Solana (Jupiter Mobile, Phantom, Solflare)',
        'Swap $SALVAZION con Jupiter — no custodiamos tus llaves',
        'Perfil y badges básicos',
      ],
      premiumNote: 'Todo lo de Gratis, más acceso completo y herramientas avanzadas',
      premiumItems: [
        'Salvazion con IA (chat coach)',
        'Voz de Salvazion / TTS',
        'Devocionales IA ilimitados — Escritura, virtud y BioConservadurismo',
        'Wearables en la nube (Fitbit, Oura, WHOOP, Garmin)',
        'Salud avanzada: biomarcadores, registro clínico, salud femenina',
        'Calendario completo y planificador de disciplina',
        'Herramientas avanzadas de motivos de oración',
        'Biblioteca Freedom completa + terminal de swap',
        'Invitaciones Phalanx ilimitadas y seguimiento',
      ],
      bestValue: 'Mejor valor anual',
      ctaFree: 'Crear cuenta gratis',
      ctaPremium: 'Unirme y pasar a Premium',
      stripeNote:
        'Pagos seguros con Stripe (Salvazion, Inc.). Cancela o cambia de plan cuando quieras en el portal de cliente.',
    },
    token: {
      subtitle: 'Compra $SALVAZION Patriot Bitcoin en Solana',
      buy: 'Comprar $SALVAZION',
      copyCa: 'Copiar',
      copiedCa: 'Copiado',
    },
    blog: {
      eyebrow: 'Blog · @salvazion_',
      title: 'Artículos de Salvazion en X',
      subtitle:
        'Long-form en profundidad en X para crecer en espíritu, fortalecer tu salud y potenciar tu libertad. Cada pieza se abre en X.',
      filters: {
        all: 'Todos',
        salvation: 'Salvation',
        health: 'Health',
        freedom: 'Freedom',
      },
      readOnX: 'Leer en X',
      showing: 'Mostrando',
      of: 'de',
      empty: 'Aún no hay artículos en este pilar.',
      viewAllOnX: 'Abrir biblioteca completa en X',
    },
    team: {
      eyebrow: 'Fundadores',
      title: 'Una familia común, pero con “buenos genes”',
      intro:
        'Cristian Cortés y Beatriz Isler son un matrimonio, quienes han trabajado juntos por +20 años en diferentes startups de salud, educación, tecnología e innovación, quienes se complementan y comparten valores (excelencia, integridad y respeto profundo al servicio de las personas), adaptándose constantemente para lograr su propósito: hacer Salvación, Salud y Libertad geniales otra vez!',
      cristianRole: 'CEO de Salvazion Inc.',
      cristian:
        'Kinesiólogo, Licenciado en Kinesiología. Magíster en Terapia Física, Minor en Psicología y Diplomados en Rehabilitación, Ejercicio, Salud e Innovación Universitaria. Sherpa e Instructor en “Evidence Based Entrepreneurship & Lean Innovation (EBELI)”. Ex Embajador del Capítulo de Santiago en Singularity University. “ExO Entrepreneur LATAM” por la ExO Community Award. “Fifty of the Most Influential Voices in Healthcare” por Medika Life, “Top 50 Global HealthTech Thought Leader and Influencers on Ecosystems” por Thinker 360 y “Top 200 Exponencialistas en Salud Digital”.',
      beatrizRole: 'COO de Salvazion Inc.',
      beatriz:
        'Kinesióloga, Licenciada en Kinesiología. Magíster en Terapia Física con Diplomados en Rehabilitación, Ejercicio y Salud, con experiencia como Docente e Investigadora Universitaria en Funcionalidad Humana, Salud Digital y Terapia Acuática. Realizó una Pasantía Clínica Internacional en Hidroterapia. Coordinó el programa “Elige Vivir Sano” del Ministerio de Salud; sin embargo, su mayor logro es conformar una hermosa familia (esposo y cuatro hijos), balanceando su vida como emprendedora. En 2022, fue reconocida como “Campeona en Salud Digital” por el BID (Banco Interamericano de Desarrollo).',
    },
    footer: {
      copy: '© 2026 Salvazion Inc. All rights reserved.',
      terms: 'Terms',
      privacy: 'Privacy',
    },
  },
} as const;
