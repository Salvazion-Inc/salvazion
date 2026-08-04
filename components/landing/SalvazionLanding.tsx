'use client';

import Image from 'next/image';
import Link from 'next/link';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import JupiterSwap from '@/components/wallet/JupiterSwap';
import { useI18n } from '@/components/I18nProvider';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/config/site';
import { PLAN_COPY } from '@/lib/billing/plans';
import FlatFlag from '@/components/ui/FlatFlag';
import LandingBlog from '@/components/landing/LandingBlog';

const JUPITER_BUY =
  'https://jup.ag/swap?inputMint=So11111111111111111111111111111111111111112&outputMint=7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2';
const MINT = '7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2';

/** Official X (Twitter) presence */
const X_ACCOUNT_URL = 'https://x.com/salvazion_';
const X_ARTICLES_URL = 'https://x.com/salvazion_/articles';

export default function SalvazionLanding() {
  const { lang, setLang } = useI18n();
  const t = copy[lang];

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9]">
      {/* Skip link — keyboard / a11y + crawlable landmark */}
      <a
        href="#main"
        className="absolute left-[-10000px] top-auto z-[100] overflow-hidden focus:left-3 focus:top-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--accent)] focus:text-[#0a120c] focus:text-sm focus:font-semibold focus:overflow-visible focus:w-auto focus:h-auto"
      >
        {lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}
      </a>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border-soft)]"
        aria-label={lang === 'es' ? 'Principal' : 'Primary'}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404] shrink-0">
              <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
            </div>
            <span className="font-brand text-lg text-[var(--accent)] neon-text hidden sm:inline">
              SALVAZION
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-5 xl:gap-6 text-[11px] uppercase tracking-[0.15em] text-[var(--sage)]">
            <a href="#app" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.app}
            </a>
            <a href="#pricing" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.pricing}
            </a>
            <a href="#token" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.token}
            </a>
            <a href="#team" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.team}
            </a>
            <a href="#blog" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.blog}
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language flags — flat USA (EN) / Chile (ES). No ES/EN text. */}
            <div
              className="flex items-center gap-2"
              role="group"
              aria-label={t.nav.language}
            >
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`relative overflow-hidden rounded-[3px] transition ring-offset-2 ring-offset-[#040404] shadow-sm ${
                  lang === 'en'
                    ? 'ring-2 ring-[var(--accent)] opacity-100'
                    : 'opacity-70 hover:opacity-100'
                }`}
                aria-pressed={lang === 'en'}
                aria-label="English"
                title="English"
              >
                <FlatFlag lang="en" size="md" className="rounded-[3px]" />
              </button>
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`relative overflow-hidden rounded-[3px] transition ring-offset-2 ring-offset-[#040404] shadow-sm ${
                  lang === 'es'
                    ? 'ring-2 ring-[var(--accent)] opacity-100'
                    : 'opacity-70 hover:opacity-100'
                }`}
                aria-pressed={lang === 'es'}
                aria-label="Español"
                title="Español"
              >
                <FlatFlag lang="es" size="md" className="rounded-[3px]" />
              </button>
            </div>
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-full bg-[var(--accent-fill)] text-[#0a120c] text-xs sm:text-sm font-semibold hover:bg-[var(--accent-hover)] transition"
            >
              {t.nav.enter}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — same Canva home video (green smoke) */}
      <main id="main">
      <section
        className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20"
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
        <div className="absolute inset-0 bg-[#040404]/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040404]/40 via-transparent to-[#040404]" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 text-center py-16 sm:py-24">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Salvazion Green Lion"
              width={200}
              height={200}
              className="lion-glow w-36 h-36 sm:w-48 sm:h-48 object-contain"
              priority
            />
          </div>

          <h1
            id="hero-heading"
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] neon-text whitespace-pre-line"
          >
            {t.hero.title}
          </h1>
          <p className="font-display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--accent)]">
            {t.hero.sub}
          </p>

          <p className="max-w-2xl mx-auto mt-6 text-base sm:text-lg text-[#D8E1D9]/90 leading-relaxed">
            {t.hero.tagline}
            <br />
            <span className="text-[var(--accent)] font-medium">{t.hero.tagline2}</span>
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="btn-primary sm:w-auto sm:min-w-[200px] px-8">
              {t.hero.ctaPrimary}
            </Link>
            <Link href="/auth/login" className="btn-secondary sm:w-auto sm:min-w-[200px] px-8">
              {t.hero.ctaLogin}
            </Link>
          </div>
        </div>
      </section>

      {/* One App + Purpose fused */}
      <section id="app" className="py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
              {t.app.eyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t.app.title}</h2>
            <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed text-[#D8E1D9]/85">
              {t.app.body}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {t.app.areas.map((area) => (
              <div
                key={area.name}
                className="card-soft p-6 flex flex-col min-h-[200px] border-t-2"
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
                <p className="mt-2 text-sm text-[#D8E1D9]/80 leading-relaxed flex-1">{area.body}</p>
                <p className="mt-4 text-[11px] text-[var(--sage)] uppercase tracking-wider">{area.inApp}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="btn-primary sm:w-auto sm:min-w-[220px] inline-flex">
              {t.app.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing — freemium as built */}
      <section id="pricing" className="py-16 sm:py-20 border-t border-[var(--border-soft)] bg-zinc-950/40">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
              {t.pricing.eyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              {t.pricing.title}
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-[var(--sage)] leading-relaxed">
              {t.pricing.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card-soft p-6 sm:p-8 flex flex-col">
              <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">
                {lang === 'es' ? PLAN_COPY.free.nameEs : PLAN_COPY.free.name}
              </p>
              <p className="mt-2 text-4xl font-bold text-white tracking-tight">$0</p>
              <p className="mt-1 text-xs text-[var(--sage)]">{t.pricing.freeNote}</p>
              <ul className="mt-5 space-y-2 text-sm text-[#D8E1D9]/85 flex-1">
                {t.pricing.freeItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--accent)] shrink-0">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="btn-secondary mt-6 sm:w-auto text-center"
              >
                {t.pricing.ctaFree}
              </Link>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 flex flex-col border border-[#8FD99A]/40 bg-[#8FD99A]/5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-wider text-[#8FD99A]">Premium</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8FD99A]/20 text-[#8FD99A]">
                  {t.pricing.bestValue}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {lang === 'es'
                    ? PLAN_COPY.premium_month.priceLabelEs
                    : PLAN_COPY.premium_month.priceLabel}
                </p>
                <p className="text-sm text-[#8FD99A]">
                  {lang === 'es'
                    ? PLAN_COPY.premium_year.priceLabelEs
                    : PLAN_COPY.premium_year.priceLabel}
                </p>
              </div>
              <p className="mt-3 text-xs text-[var(--sage)] leading-relaxed">
                {t.pricing.premiumNote}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-[#D8E1D9]/90 flex-1">
                {t.pricing.premiumItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[#8FD99A] shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="btn-primary mt-6 sm:w-auto text-center"
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

      {/* Token */}
      <section id="token" className="py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Solana</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter mb-2">$SALVAZION</h2>
          <p className="text-sm text-[var(--sage)] mb-6">{t.token.subtitle}</p>
          <div className="font-mono text-[10px] sm:text-xs bg-[#0a0a0a] border border-[var(--border-soft)] px-3 py-2.5 rounded-xl mb-8 inline-block break-all max-w-full">
            CA: {MINT}
          </div>

          <div className="max-w-md mx-auto text-left space-y-4">
            <p className="text-center text-xs text-[var(--sage)]">{t.token.connect}</p>
            <WalletConnectCard showJupiter={false} />
            <div className="card-soft p-3">
              <p className="text-center text-[10px] text-[var(--sage)] mb-2 uppercase tracking-wider">
                Jupiter · Solana
              </p>
              <JupiterSwap mode="modal" triggerLabel={t.token.buy} />
            </div>
            <a
              href={JUPITER_BUY}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              {t.token.openJupiter} ↗
            </a>
          </div>
        </div>
      </section>

      {/* Team — founders headshots + family portrait (Gobierno Corporativo) */}
      <section id="team" className="py-16 sm:py-20 border-t border-[var(--border-soft)] bg-zinc-950/30">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
              {t.team.eyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              {t.team.title}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#D8E1D9]/85 max-w-3xl mx-auto leading-relaxed">
              {t.team.intro}
            </p>
          </div>

          {/* Family founders portrait — polished brand banner */}
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
              <div className="flex items-start gap-4 mb-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent)]/40 shrink-0 bg-black ring-2 ring-[var(--border-soft)]">
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
                  <h3 className="text-xl font-semibold text-white">Cristian Cortés</h3>
                  <p className="text-[11px] text-[var(--sage)]">{t.team.cristianRole}</p>
                </div>
              </div>
              <p className="text-sm text-[#D8E1D9]/80 leading-relaxed">{t.team.cristian}</p>
            </div>
            <div className="card-soft p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent)]/40 shrink-0 bg-black ring-2 ring-[var(--border-soft)]">
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
                  <h3 className="text-xl font-semibold text-white">Beatriz Isler</h3>
                  <p className="text-[11px] text-[var(--sage)]">{t.team.beatrizRole}</p>
                </div>
              </div>
              <p className="text-sm text-[#D8E1D9]/80 leading-relaxed">{t.team.beatriz}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog last — all @salvazion_ X Articles · filter Salvation / Health / Freedom */}
      <LandingBlog lang={lang} copy={t.blog} />

      </main>

      <footer className="border-t border-[var(--border-soft)] py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--sage)]/80">
          <p>{t.footer.copy}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/login" className="hover:text-[var(--accent)]">
              {t.nav.enter}
            </Link>
            <a href="#blog" className="hover:text-[var(--accent)]">
              {t.nav.blog}
            </a>
            <a
              href={X_ARTICLES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)]"
            >
              {lang === 'es' ? 'Artículos X' : 'X Articles'}
            </a>
            <a
              href={X_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)]"
            >
              @salvazion_
            </a>
            <Link href="/terms" className="hover:text-[var(--accent)]">
              {t.footer.terms}
            </Link>
            <Link href="/privacy" className="hover:text-[var(--accent)]">
              {t.footer.privacy}
            </Link>
            <a href="https://salvazion.org" className="hover:text-[var(--accent)]">
              salvazion.org
            </a>
            <a href={SUPPORT_MAILTO} className="hover:text-[var(--accent)]">
              {SUPPORT_EMAIL}
            </a>
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
      title: 'MAKE SALVATION,\nHEALTH AND\nFREEDOM',
      sub: 'GREAT AGAIN',
      tagline: 'The secular world strips spirit, mind, body and soul.',
      tagline2: 'Salvazion gives them back — in one App.',
      ctaPrimary: 'Create free account',
      ctaLogin: 'I have an account',
    },
    app: {
      eyebrow: 'One App · Our Purpose',
      title: 'Everything fused into a single Hub',
      body:
        'Our Purpose is make Salvation, Health and Freedom great again, through a Global Community that defends Western Christian Culture and BioConservatism in a Spiritual Warfare. Salvation, Health and Freedom live together in one App: daily scores, Bible and devotionals, health with sensors and wearables, Freedom library, community invites, Salvazion AI and $SALVAZION on Solana.',
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
          inApp: 'Health hub · sensors · wearables · biomarkers',
        },
        {
          name: 'Freedom',
          icon: '/icons/agenda/freedom.jpg',
          accent: '#8FD99A',
          body: 'Freedom with responsibility: curated books, X articles, YouTube channels, Phalanx community and economic sovereignty on Solana.',
          inApp: 'Freedom hub · Community · $SALVAZION swap',
        },
      ],
    },
    pricing: {
      eyebrow: 'Freemium',
      title: 'Start free. Go Premium when ready.',
      subtitle:
        'Base access to Salvation, Health and Freedom is free. Premium unlocks Salvazion AI, unlimited AI devotionals, cloud wearables and advanced tools.',
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
      connect: 'Connect your Solana wallet',
      buy: 'Buy $SALVAZION',
      openJupiter: 'Open on Jupiter',
    },
    blog: {
      eyebrow: 'Blog · @salvazion_',
      title: 'Salvazion Articles on X',
      subtitle:
        'Long-form writing on Salvation, Health and Freedom — faith, family, body, sovereignty and Western Christian Culture. Every piece opens on X.',
      articleCountLabel: '{count} articles in the library',
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
      seoNote:
        'Filter by Salvation · Health · Freedom to explore the full library — each title links to the original article on X. Switch language to read titles and previews in Spanish.',
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
      copy: '© 2026 Salvazion Inc. · All rights reserved · Faith, family and exponential technology.',
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
      title: 'MAKE SALVATION,\nHEALTH AND\nFREEDOM',
      sub: 'GREAT AGAIN',
      tagline: 'El mundo secular te quita el espíritu, la mente, el cuerpo y el alma.',
      tagline2: 'Salvazion te los devuelve — en una sola App.',
      ctaPrimary: 'Crear cuenta gratis',
      ctaLogin: 'Ya tengo cuenta',
    },
    app: {
      eyebrow: 'Una sola App · Nuestro propósito',
      title: 'Todo fusionado en un solo Hub',
      body:
        'Nuestro Propósito es hacer Salvación, Salud y Libertad geniales otra vez, con una Comunidad Global que defiende la Cultura Cristiana Occidental y el BioConservadurismo en una Guerra Espiritual. Salvation, Health y Freedom viven juntos en una App: scores diarios, Biblia y devocionales, salud con sensores y wearables, biblioteca Freedom, comunidad Phalanx, Salvazion con IA y $SALVAZION en Solana.',
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
          inApp: 'Health hub · sensores · wearables · biomarcadores',
        },
        {
          name: 'Freedom',
          icon: '/icons/agenda/freedom.jpg',
          accent: '#8FD99A',
          body: 'Libertad con responsabilidad: libros curados, artículos en X, canales de YouTube, comunidad Phalanx y soberanía económica en Solana.',
          inApp: 'Freedom hub · Comunidad · Swap $SALVAZION',
        },
      ],
    },
    pricing: {
      eyebrow: 'Freemium',
      title: 'Empieza gratis. Pasa a Premium cuando quieras.',
      subtitle:
        'El acceso base a Salvation, Health y Freedom es gratis. Premium desbloquea Salvazion con IA, devocionales IA ilimitados, wearables en la nube y herramientas avanzadas.',
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
      connect: 'Conecta tu billetera Solana',
      buy: 'Comprar $SALVAZION',
      openJupiter: 'Abrir en Jupiter',
    },
    blog: {
      eyebrow: 'Blog · @salvazion_',
      title: 'Artículos de Salvazion en X',
      subtitle:
        'Textos de largo formato sobre Salvation, Health y Freedom — fe, familia, cuerpo, soberanía y Cultura Cristiana Occidental. Cada pieza se abre en X.',
      articleCountLabel: '{count} artículos en la biblioteca',
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
      seoNote:
        'Filtra por Salvation · Health · Freedom para explorar la biblioteca completa — cada título enlaza al artículo original en X. Cambia el idioma para ver títulos y previews en español.',
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
      copy: '© 2026 Salvazion Inc. · Todos los derechos reservados · Fe, familia y tecnología exponencial.',
      terms: 'Términos',
      privacy: 'Privacidad',
    },
  },
} as const;
