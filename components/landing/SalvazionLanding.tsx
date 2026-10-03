'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import JupiterSwap from '@/components/wallet/JupiterSwap';
import { useI18n } from '@/components/I18nProvider';
import {
  PLAN_COPY,
  PREMIUM_FEATURE_LIST,
  PRICING_TABLE,
} from '@/lib/billing/plans';
import LanguageFlagSwitch from '@/components/ui/LanguageFlagSwitch';
import XLogo, { textWithXLogo } from '@/components/ui/XLogo';
import LandingBlog from '@/components/landing/LandingBlog';
import { SALVAZION_MINT } from '@/lib/solana/config';
import { welcomeUrlForLang } from '@/lib/config/site';
import { pickLang } from '@/lib/i18n/locale';
import UpgradeCta from '@/components/billing/UpgradeCta';
import { signupUrlForCheckout } from '@/lib/billing/checkout-intent';
import PlanStatus from '@/components/billing/PlanStatus';
import { useEntitlement } from '@/lib/billing/client';

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

function LandingPremiumCtas() {
  const { isPremium, signedIn, loading } = useEntitlement();
  const { t } = useI18n();

  // Anonymous visitors: link straight to signup with checkout intent.
  // Avoids disabled-while-loading Premium buttons (measured funnel friction).
  if (!loading && !signedIn && !isPremium) {
    return (
      <div className="mt-6 grid gap-2">
        <Link
          href={signupUrlForCheckout('month')}
          className="btn-primary font-display font-bold w-full min-h-[3rem] text-sm !whitespace-normal text-center text-balance leading-snug"
        >
          {t('premium.upgradeCta')}
        </Link>
        <Link
          href={signupUrlForCheckout('year')}
          className="btn-secondary font-display font-bold w-full min-h-[2.75rem] text-sm !whitespace-normal text-center text-balance leading-snug border-[#8FD99A]/45 text-[#8FD99A]"
        >
          {t('premium.ctaAnnual')}
        </Link>
        <p className="text-[11px] text-[var(--sage)]/85 text-center leading-snug">
          {t('premium.trustLine')}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <UpgradeCta showAnnual={!isPremium} />
    </div>
  );
}

export default function SalvazionLanding() {
  const { lang, setLang } = useI18n();
  const t = copy[lang];
  const welcomeHref = welcomeUrlForLang(lang);

  return (
    <div className="marketing-shell text-[var(--off-white)] selection:bg-[rgba(143,217,154,0.28)]">
      {/* Skip link — keyboard / a11y + crawlable landmark */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-full focus:bg-[var(--accent)] focus:text-[#0a120c] focus:text-sm focus:font-semibold focus:shadow-[var(--shadow-glow)]"
      >
        {pickLang(lang, { es: 'Saltar al contenido', en: 'Skip to content', pt: 'Pular para o conteúdo' })}
      </a>
      {/* Nav — floating glass bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-[var(--border-soft)]/80"
        aria-label={pickLang(lang, { es: 'Principal', en: 'Primary', pt: 'Principal' })}
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
            <a
              href={welcomeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link-marketing"
            >
              {t.nav.welcome}
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
              className="btn-primary nav-enter-cta shrink-0 !px-3 sm:!px-4 !min-h-10 !text-xs sm:!text-sm text-center leading-snug"
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
            {/* Transparent black fill so hero green-smoke video shows through the mark */}
            <Image
              src="/logo-transparent.png"
              alt="Salvazion"
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

      {/* One Platform + Purpose fused */}
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
                className="card-soft card-lift p-6 sm:p-7 flex flex-col min-h-[260px] border-t-2"
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
                <p className="mt-3 text-[13px] text-[var(--sage)] leading-snug text-pretty">
                  {area.problem}
                </p>
                <p className="mt-2.5 text-sm text-[#D8E1D9]/88 leading-relaxed flex-1 text-pretty">
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

          <div className="grid md:grid-cols-2 gap-4 items-stretch">
            <div className="card-soft p-6 sm:p-8 h-full flex flex-col">
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
              <p className="founder-bio text-sm text-[#D8E1D9]/80 leading-relaxed flex-1">{t.team.cristian}</p>
            </div>
            <div className="card-soft p-6 sm:p-8 h-full flex flex-col">
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
              <p className="founder-bio text-sm text-[#D8E1D9]/80 leading-relaxed flex-1">{t.team.beatriz}</p>
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
            <div className="mt-4 flex justify-center">
              <PlanStatus compact showUpgrade={false} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* Free — same typography / spacing / button size as Premium */}
            <div className="card-soft card-lift p-6 sm:p-8 flex flex-col h-full">
              <div className="flex items-center justify-between gap-2 min-h-[1.75rem]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--sage)]">
                  {pickLang(lang, {
                    es: PLAN_COPY.free.nameEs,
                    en: PLAN_COPY.free.name,
                    pt: PLAN_COPY.free.namePt,
                  })}
                </p>
                {/* Keeps header height aligned with Premium badge row */}
                <span className="invisible text-[10px] px-2.5 py-1 rounded-full font-semibold">
                  {pickLang(lang, PRICING_TABLE.bestValue)}
                </span>
              </div>

              <p className="mt-3 text-4xl font-bold text-white tracking-tight tabular-nums leading-none">
                $0
              </p>
              <p className="mt-2 text-sm text-[var(--sage)] leading-snug">
                {pickLang(lang, {
                  es: '/ mes · siempre gratis',
                  en: '/ month · always free',
                  pt: '/ mês · sempre grátis',
                })}
              </p>
              <p className="mt-1 text-sm text-[var(--sage)] leading-snug min-h-[1.25rem]">
                {pickLang(lang, PRICING_TABLE.freeAside)}
              </p>

              <p className="mt-3 text-xs text-[var(--sage)] leading-snug">
                {pickLang(lang, PRICING_TABLE.freeNote)}
              </p>

              <ul className="pricing-points mt-5 text-sm text-[#D8E1D9]/90 flex-1">
                {PRICING_TABLE.freeItems.map((item) => {
                  const label = pickLang(lang, item);
                  return (
                    <li key={item.en}>
                      <span className="text-[var(--accent)] shrink-0 w-4 text-center" aria-hidden>✓</span>
                      <span className="leading-snug">{textWithXLogo(label)}</span>
                    </li>
                  );
                })}
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
                  {pickLang(lang, PRICING_TABLE.bestValue)}
                </span>
              </div>

              <p className="mt-3 text-4xl font-bold text-white tracking-tight tabular-nums leading-none">
                ${PLAN_COPY.premium_month.priceUsd}
              </p>
              <p className="mt-2 text-sm text-[var(--sage)] leading-snug">
                {pickLang(lang, { es: '/ mes', en: '/ month', pt: '/ mês' })}
              </p>
              <p className="mt-1 text-sm text-[#8FD99A] leading-snug min-h-[1.25rem]">
                {pickLang(lang, {
                  es: PLAN_COPY.premium_year.priceLabelEs,
                  en: PLAN_COPY.premium_year.priceLabel,
                  pt: PLAN_COPY.premium_year.priceLabelPt,
                })}
              </p>

              <p className="mt-3 text-xs text-[var(--sage)] leading-snug">
                {pickLang(lang, PRICING_TABLE.premiumNote)}
              </p>

              <ul className="pricing-points mt-5 text-sm text-[#D8E1D9]/90 flex-1">
                {PREMIUM_FEATURE_LIST.map((item) => {
                  const label = pickLang(lang, item);
                  return (
                    <li key={item.id}>
                      <span className="text-[var(--accent)] shrink-0 w-4 text-center" aria-hidden>✓</span>
                      <span className="leading-snug">{textWithXLogo(label)}</span>
                    </li>
                  );
                })}
              </ul>

              <LandingPremiumCtas />
            </div>
          </div>

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
                Jupiter Ultra · Solana
              </p>
              {/*
                Direct link to jup.ag SOL → $SALVAZION.
                In-app Plugin modal was blocked by CSP (empty height:0 shell).
              */}
              <JupiterSwap
                mode="modal"
                modalStrategy="jup"
                triggerLabel={t.token.buy}
                showFallbackLink
              />
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
      app: 'Platform',
      blog: 'Blog',
      pricing: 'Pricing',
      token: 'Token',
      team: 'Team',
      enter: 'Enter Salvazion',
      welcome: 'Welcome',
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
      tagline2: 'Salvazion gives them back — in one Platform.',
      ctaPrimary: 'Create free account',
      ctaLogin: 'I have an account',
    },
    app: {
      eyebrow: 'Massive Transformative Purpose',
      title: 'The platform that restores the human person',
      body:
        'Our Purpose is Make Salvation, Health and Freedom Great Again — a Community of Green Lion Kings that defends Western Christian Culture and BioConservatism in Spiritual Warfare. Exponential technologies and innovation at the service of people.',
      cta: 'Open the Platform',
      areas: [
        {
          name: 'Salvation',
          icon: '/icons/agenda/salvation.jpg',
          accent: '#F5F7F5',
          problem: 'Prayer was replaced by mood. The Cross, by wellness.',
          body: 'You get the Word first: offline Bible, prayer by priority, a daily devotion and a Salvation score that measures constancy — not vibes without a Cross.',
          inApp: 'Bible · Devotional · Prayer · Score',
        },
        {
          name: 'Health',
          icon: '/icons/agenda/health.jpg',
          accent: '#4A9EFF',
          problem: 'The body is ignored — or treated as a machine to upgrade.',
          body: 'The body is a temple. Sleep, food, sun and training in one Health score, with sensors and wearables serving the person, not replacing them.',
          inApp: 'Sleep · meals · movement · wearables',
        },
        {
          name: 'Freedom',
          icon: '/icons/agenda/freedom.jpg',
          accent: '#8FD99A',
          problem: 'Feeds capture your attention, your community and your money.',
          body: 'You recover judgment, the Community and economic sovereignty on Solana — books, long-form and people, not another scroll.',
          inApp: 'Library · Community · $SALVAZION',
        },
      ],
    },
    pricing: {
      eyebrow: 'Plans',
      title: 'Start free. Go Premium when ready.',
      ctaFree: 'Create free account',
      ctaPremium: 'Join & upgrade to Premium',
    },
    token: {
      subtitle: 'Buy $SALVAZION on Solana',
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
      filterHints: {
        all: 'Salvation: faith, family, conservatism · Health: food, healthtech, exercise, sleep · Freedom: speech, entrepreneurship, politics, technology',
        salvation: 'Faith · Christianity · Family · Conservatism',
        health: 'Food · Healthtech · Exercise · Sleep',
        freedom: 'Free speech · Entrepreneurship · Political ideas · Technology',
      },
      searchPlaceholder: 'Search by keywords…',
      searchAria: 'Search articles by keywords',
      clearSearch: 'Clear search',
      readOnX: 'Read on X',
      showing: 'Showing',
      of: 'of',
      empty: 'No articles in this pillar yet.',
      emptySearch: 'No articles match those keywords. Try different terms.',
      viewAllOnX: 'Open full library on X',
      sortForYou: 'For you',
      sortRecent: 'Latest',
      sortAria: 'Sort articles',
      basedOnInterests: 'Based on your focus',
    },
    team: {
      eyebrow: 'Founders',
      title: 'An ordinary family, but with “good genes”',
      intro:
        'Cristian Cortés and Beatriz Isler are a married couple who have worked together for 20+ years in health, education, technology and innovation startups. They complement each other and share the same values — excellence, integrity and deep respect for serving people — adapting constantly.',
      cristianRole: 'CEO at Salvazion, Inc.',
      cristian:
        'Physical Therapist and kinesiologist. Master in Physical Therapy, Minor in Psychology, and diplomas in Rehabilitation, Exercise, Health and University Innovation. Sherpa and Instructor in EBELI. Former Singularity University Ambassador (Santiago) and ExO Entrepreneur LATAM. Named among Medika Life’s Fifty Most Influential Voices in Healthcare, Thinker 360’s Top 50 Global HealthTech leaders, and the Top 200 Exponentialists in Digital Health.',
      beatrizRole: 'COO at Salvazion, Inc.',
      beatriz:
        'Physical Therapist and kinesiologist. Master in Physical Therapy, with diplomas in Rehabilitation, Exercise and Health. University professor and researcher in Human Functionality, Digital Health and Aquatic Therapy, with an international internship in Hydrotherapy. She led Chile’s “Choose Living Healthy” program; her greatest work is her family — husband and four children — while building as an entrepreneur. IDB Digital Health Champion, 2022.',
    },
    footer: {
      copy: '© 2026 Salvazion, Inc. All rights reserved.',
      terms: 'Terms',
      privacy: 'Privacy',
    },
  },
  es: {
    nav: {
      app: 'Plataforma',
      blog: 'Blog',
      pricing: 'Precios',
      token: 'Token',
      team: 'Equipo',
      enter: 'Entrar a Salvazion',
      welcome: 'Welcome',
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
      tagline2: 'Salvazion te los devuelve — en una sola Plataforma.',
      ctaPrimary: 'Crear cuenta gratis',
      ctaLogin: 'Ya tengo cuenta',
    },
    app: {
      eyebrow: 'Propósito Transformador Masivo',
      title: 'La plataforma que restaura a la persona humana',
      body:
        'Nuestro Propósito es Make Salvation, Health and Freedom Great Again — una Comunidad de Green Lion Kings que defiende la Cultura Cristiana Occidental y el BioConservadurismo en Guerra Espiritual. Tecnologías exponenciales e innovación al servicio de las personas.',
      cta: 'Abrir la Plataforma',
      areas: [
        {
          name: 'Salvation',
          icon: '/icons/agenda/salvation.jpg',
          accent: '#F5F7F5',
          problem: 'La oración fue reemplazada por el ánimo. La Cruz, por el wellness.',
          body: 'Recuperas la Palabra primero: Biblia offline, oración por prioridad, devocional diario y un score Salvation que mide constancia — no vibras sin Cruz.',
          inApp: 'Biblia · Devocional · Oración · Score',
        },
        {
          name: 'Health',
          icon: '/icons/agenda/health.jpg',
          accent: '#4A9EFF',
          problem: 'El cuerpo se ignora — o se trata como una máquina que hay que mejorar.',
          body: 'El cuerpo es templo. Sueño, comida, sol y entrenamiento en un solo score Health, con sensores y wearables al servicio de la persona, no en su lugar.',
          inApp: 'Sueño · comidas · movimiento · wearables',
        },
        {
          name: 'Freedom',
          icon: '/icons/agenda/freedom.jpg',
          accent: '#8FD99A',
          problem: 'Los feeds capturan tu atención, tu comunidad y tu dinero.',
          body: 'Recuperas criterio, la Comunidad y soberanía económica en Solana — libros, long-form y personas, no otro scroll.',
          inApp: 'Biblioteca · Community · $SALVAZION',
        },
      ],
    },
    pricing: {
      eyebrow: 'Planes',
      title: 'Empieza gratis. Pasa a Premium cuando quieras.',
      ctaFree: 'Crear cuenta gratis',
      ctaPremium: 'Unirme y pasar a Premium',
    },
    token: {
      subtitle: 'Compra $SALVAZION en Solana',
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
      filterHints: {
        all: 'Salvation: fe, familia, conservadurismo · Health: alimentación, healthtech, ejercicio, sueño · Freedom: expresión, empresa, política, tecnología',
        salvation: 'Fe · Cristianismo · Familia · Conservadurismo',
        health: 'Alimentación · Healthtech · Ejercicio · Sueño',
        freedom: 'Libertad de expresión · Emprendimiento · Ideas políticas · Tecnología',
      },
      searchPlaceholder: 'Buscar por palabras clave…',
      searchAria: 'Buscar artículos por palabras clave',
      clearSearch: 'Limpiar búsqueda',
      readOnX: 'Leer en X',
      showing: 'Mostrando',
      of: 'de',
      empty: 'Aún no hay artículos en este pilar.',
      emptySearch: 'No hay artículos con esas palabras. Prueba otras claves.',
      viewAllOnX: 'Abrir biblioteca completa en X',
      sortForYou: 'Para ti',
      sortRecent: 'Recientes',
      sortAria: 'Ordenar artículos',
      basedOnInterests: 'Según tus focos',
    },
    team: {
      eyebrow: 'Fundadores',
      title: 'Una familia común, pero con “buenos genes”',
      intro:
        'Cristian Cortés y Beatriz Isler son un matrimonio que lleva +20 años trabajando juntos en startups de salud, educación, tecnología e innovación. Se complementan y comparten los mismos valores — excelencia, integridad y respeto profundo al servicio de las personas — adaptándose constantemente.',
      cristianRole: 'CEO de Salvazion, Inc.',
      cristian:
        'Kinesiólogo. Magíster en Terapia Física, Minor en Psicología y diplomados en Rehabilitación, Ejercicio, Salud e Innovación Universitaria. Sherpa e Instructor en EBELI. Ex embajador de Singularity University (Santiago) y ExO Entrepreneur LATAM. Reconocido entre las Fifty Most Influential Voices in Healthcare de Medika Life, Top 50 Global HealthTech de Thinker 360 y Top 200 Exponencialistas en Salud Digital.',
      beatrizRole: 'COO de Salvazion, Inc.',
      beatriz:
        'Kinesióloga. Magíster en Terapia Física y diplomados en Rehabilitación, Ejercicio y Salud. Docente e investigadora en Funcionalidad Humana, Salud Digital y Terapia Acuática, con pasantía internacional en Hidroterapia. Lideró “Elige Vivir Sano” del Ministerio de Salud; su mayor obra es su familia — esposo y cuatro hijos — mientras emprende. En 2022 el BID la nombró Campeona en Salud Digital.',
    },
    footer: {
      copy: '© 2026 Salvazion, Inc. Todos los derechos reservados.',
      terms: 'Términos',
      privacy: 'Privacidad',
    },
  },
  pt: {
    nav: {
      app: 'Plataforma',
      blog: 'Blog',
      pricing: 'Preços',
      token: 'Token',
      team: 'Equipe',
      enter: 'Entrar na Salvazion',
      welcome: 'Welcome',
      language: 'Idioma',
    },
    hero: {
      titleLines: [
        'MAKE SALVATION,',
        'HEALTH AND FREEDOM',
        'GREAT AGAIN',
      ] as const,
      tagline: 'O mundo secular tira espírito, mente, corpo e alma.',
      tagline2: 'A Salvazion os devolve — em uma só Plataforma.',
      ctaPrimary: 'Criar conta grátis',
      ctaLogin: 'Já tenho conta',
    },
    app: {
      eyebrow: 'Propósito Transformador Massivo',
      title: 'A plataforma que restaura a pessoa humana',
      body:
        'Nosso Propósito é Make Salvation, Health and Freedom Great Again — uma Comunidade de Green Lion Kings que defende a Cultura Cristã Ocidental e o BioConservadorismo em Guerra Espiritual. Tecnologias exponenciais e inovação a serviço das pessoas.',
      cta: 'Abrir a Plataforma',
      areas: [
        {
          name: 'Salvation',
          icon: '/icons/agenda/salvation.jpg',
          accent: '#F5F7F5',
          problem: 'A oração foi trocada pelo humor. A Cruz, pelo wellness.',
          body: 'Você volta à Palavra primeiro: Bíblia offline, oração por prioridade, devocional diário e um score Salvation que mede constância — não vibrações sem Cruz.',
          inApp: 'Bíblia · Devocional · Oração · Score',
        },
        {
          name: 'Health',
          icon: '/icons/agenda/health.jpg',
          accent: '#4A9EFF',
          problem: 'O corpo é ignorado — ou tratado como uma máquina a ser melhorada.',
          body: 'O corpo é templo. Sono, comida, sol e treino em um só score Health, com sensores e wearables a serviço da pessoa, não no lugar dela.',
          inApp: 'Sono · refeições · movimento · wearables',
        },
        {
          name: 'Freedom',
          icon: '/icons/agenda/freedom.jpg',
          accent: '#8FD99A',
          problem: 'Os feeds capturam sua atenção, sua comunidade e seu dinheiro.',
          body: 'Você recupera critério, a Comunidade e soberania econômica na Solana — livros, long-form e pessoas, não mais um scroll.',
          inApp: 'Biblioteca · Community · $SALVAZION',
        },
      ],
    },
    pricing: {
      eyebrow: 'Planos',
      title: 'Comece grátis. Passe para Premium quando quiser.',
      ctaFree: 'Criar conta grátis',
      ctaPremium: 'Entrar e passar para Premium',
    },
    token: {
      subtitle: 'Compre $SALVAZION na Solana',
      buy: 'Comprar $SALVAZION',
      copyCa: 'Copiar',
      copiedCa: 'Copiado',
    },
    blog: {
      eyebrow: 'Blog · @salvazion_',
      title: 'Artigos da Salvazion no X',
      subtitle:
        'Long-form em profundidade no X para crescer no espírito, fortalecer sua saúde e expandir sua liberdade. Cada peça abre no X.',
      filters: {
        all: 'Todos',
        salvation: 'Salvation',
        health: 'Health',
        freedom: 'Freedom',
      },
      filterHints: {
        all: 'Salvation: fé, família, conservadorismo · Health: alimentação, healthtech, exercício, sono · Freedom: expressão, empresa, política, tecnologia',
        salvation: 'Fé · Cristianismo · Família · Conservadorismo',
        health: 'Alimentação · Healthtech · Exercício · Sono',
        freedom: 'Liberdade de expressão · Empreendedorismo · Ideias políticas · Tecnologia',
      },
      searchPlaceholder: 'Buscar por palavras-chave…',
      searchAria: 'Buscar artigos por palavras-chave',
      clearSearch: 'Limpar busca',
      readOnX: 'Ler no X',
      showing: 'Mostrando',
      of: 'de',
      empty: 'Ainda não há artigos neste pilar.',
      emptySearch: 'Não há artigos com essas palavras. Tente outras chaves.',
      viewAllOnX: 'Abrir biblioteca completa no X',
      sortForYou: 'Para você',
      sortRecent: 'Recentes',
      sortAria: 'Ordenar artigos',
      basedOnInterests: 'Segundo os seus focos',
    },
    team: {
      eyebrow: 'Fundadores',
      title: 'Uma família comum, mas com “bons genes”',
      intro:
        'Cristian Cortés e Beatriz Isler são um casal que trabalha junto há mais de 20 anos em startups de saúde, educação, tecnologia e inovação. Complementam-se e compartilham os mesmos valores — excelência, integridade e respeito profundo ao serviço das pessoas — adaptando-se constantemente.',
      cristianRole: 'CEO da Salvazion, Inc.',
      cristian:
        'Fisioterapeuta e cinesiologista. Mestre em Terapia Física, Minor em Psicologia e diplomados em Reabilitação, Exercício, Saúde e Inovação Universitária. Sherpa e Instrutor em EBELI. Ex-embaixador da Singularity University (Santiago) e ExO Entrepreneur LATAM. Reconhecido entre as Fifty Most Influential Voices in Healthcare da Medika Life, Top 50 Global HealthTech da Thinker 360 e Top 200 Exponentialists in Digital Health.',
      beatrizRole: 'COO da Salvazion, Inc.',
      beatriz:
        'Fisioterapeuta e cinesiologista. Mestre em Terapia Física, com diplomados em Reabilitação, Exercício e Saúde. Docente e pesquisadora em Funcionalidade Humana, Saúde Digital e Terapia Aquática, com estágio internacional em Hidroterapia. Liderou o “Elige Vivir Sano” do Ministério da Saúde; sua maior obra é a família — marido e quatro filhos — enquanto empreende. Em 2022 o BID nomeou-a Campeã em Saúde Digital.',
    },
    footer: {
      copy: '© 2026 Salvazion, Inc. Todos os direitos reservados.',
      terms: 'Termos',
      privacy: 'Privacidade',
    },
  },
} as const;
