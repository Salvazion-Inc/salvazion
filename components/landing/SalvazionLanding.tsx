'use client';

import Image from 'next/image';
import Link from 'next/link';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import JupiterSwap from '@/components/wallet/JupiterSwap';
import { useI18n } from '@/components/I18nProvider';
import {
  BibleIcon,
  DevotionalIcon,
  HealthIcon,
  FreedomIcon,
  InviteIcon,
  SwapIcon,
} from '@/components/Icons';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/config/site';
import { PLAN_COPY, PREMIUM_FEATURE_LIST } from '@/lib/billing/plans';
import FlatFlag from '@/components/ui/FlatFlag';

const JUPITER_BUY =
  'https://jup.ag/swap?inputMint=So11111111111111111111111111111111111111112&outputMint=7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2';
const MINT = '7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2';

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

          <div className="hidden lg:flex items-center gap-6 text-[11px] uppercase tracking-[0.15em] text-[var(--sage)]">
            <a href="#app" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.app}
            </a>
            <a href="#pricing" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.pricing}
            </a>
            <a href="#purpose" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.purpose}
            </a>
            <a href="#token" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.token}
            </a>
            <a href="#team" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.team}
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
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[var(--accent)] mb-5">
            {t.hero.eyebrow}
          </p>

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

          <p className="mt-4 text-[11px] text-[var(--sage)]">{t.hero.socialHint}</p>
        </div>
      </section>

      {/* One App — fused product (no separate AI pillars) */}
      <section id="app" className="py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
              {t.app.eyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t.app.title}</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-[var(--sage)] leading-relaxed">
              {t.app.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {t.app.areas.map((area) => (
              <div key={area.name} className="card-soft p-6 flex flex-col min-h-[200px]">
                <span className="text-2xl mb-3" aria-hidden>
                  {area.icon}
                </span>
                <h3 className="text-xl font-bold text-[var(--accent)] tracking-tight">{area.name}</h3>
                <p className="mt-2 text-sm text-[#D8E1D9]/80 leading-relaxed flex-1">{area.body}</p>
                <p className="mt-4 text-[11px] text-[var(--sage)] uppercase tracking-wider">{area.inApp}</p>
              </div>
            ))}
          </div>

          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-white tracking-tight">{t.app.featuresTitle}</h3>
            <p className="mt-1 text-xs text-[var(--sage)]">{t.app.featuresSubtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f) => {
              const Icon = f.Icon;
              return (
                <div
                  key={f.key}
                  className="flex gap-3 glass rounded-2xl p-4 border border-[var(--border-soft)]"
                >
                  <div className="shrink-0 mt-0.5">
                    <Icon size={28} active />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{t.app.features[f.key].title}</h3>
                    <p className="text-xs text-[var(--sage)] mt-1 leading-relaxed">
                      {t.app.features[f.key].body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
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
                {PREMIUM_FEATURE_LIST.map((f) => (
                  <li key={f.id} className="flex gap-2">
                    <span className="text-[#8FD99A] shrink-0">✓</span>
                    <span>{lang === 'es' ? f.es : f.en}</span>
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

      {/* Purpose */}
      <section id="purpose" className="py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
            {t.purpose.eyebrow}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-6">{t.purpose.title}</h2>
          <p className="text-base sm:text-lg leading-relaxed text-[#D8E1D9]/85">{t.purpose.body}</p>
          <div className="mt-8 grid sm:grid-cols-3 gap-3 text-left">
            {t.purpose.values.map((v) => (
              <div key={v.title} className="card-soft p-4">
                <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                  {v.title}
                </p>
                <p className="text-xs text-[var(--sage)] mt-1.5 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12 Salvators — epic reveal video (EN / ES) */}
      <section
        id="salvators"
        className="py-16 sm:py-20 border-t border-[var(--border-soft)]"
        aria-labelledby="salvators-heading"
      >
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
              {t.salvators.chapter}
            </p>
            <h2
              id="salvators-heading"
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight"
            >
              {t.salvators.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--sage)] max-w-lg mx-auto">
              {t.salvators.subtitle}
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden border border-[var(--border-soft)] card-soft bg-black">
            <video
              key={lang}
              className="w-full aspect-video object-cover"
              src={
                lang === 'es'
                  ? '/videos/12-salvators-es.mp4'
                  : '/videos/12-salvators-en.mp4'
              }
              poster={
                lang === 'es' ? '/12-salvators-es.jpg' : '/12-salvators.jpg'
              }
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              aria-label={t.salvators.title}
            />
            <p className="px-4 py-2 text-center text-[11px] text-[var(--sage)]/80 border-t border-[var(--border-soft)] bg-black/60">
              {t.salvators.audioHint}
            </p>
          </div>
          <p className="mt-5 text-center text-sm sm:text-base text-[#D8E1D9]/90 max-w-2xl mx-auto leading-relaxed">
            {t.salvators.caption}
          </p>
        </div>
      </section>

      {/* Matrix — Spiritual Revival (from salvazion.org Canva) */}
      <section
        id="revival"
        className="py-16 sm:py-20 border-t border-[var(--border-soft)] bg-zinc-950/40"
        aria-labelledby="revival-heading"
      >
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
              {t.revival.eyebrow}
            </p>
            <h2
              id="revival-heading"
              className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--accent)] neon-text"
            >
              {t.revival.title}
            </h2>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-[var(--border-soft)] card-soft bg-black">
            <video
              key={`matrix-${lang}`}
              className="w-full aspect-video object-cover"
              src={
                lang === 'es'
                  ? '/videos/matrix-spiritual-revival-es.mp4'
                  : '/videos/matrix-spiritual-revival-en.mp4'
              }
              poster="/videos/matrix-spiritual-revival-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              aria-label={t.revival.title}
            />
          </div>
          <p className="mt-5 text-center text-sm text-[var(--sage)] max-w-xl mx-auto leading-relaxed">
            {t.revival.body}
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

      {/* Team — founders + family portraits from salvazion.org Canva */}
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

          {/* Family dual portrait */}
          <div className="mb-8 rounded-3xl overflow-hidden border border-[var(--border-soft)] card-soft">
            <div className="grid sm:grid-cols-2">
              <div className="relative aspect-[4/5] sm:aspect-auto sm:min-h-[320px] bg-[#040404]">
                <Image
                  src="/founders/cristian.jpg"
                  alt="Cristian Cortés Fernández"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#040404] via-[#040404]/50 to-transparent p-4">
                  <p className="text-xs text-[var(--accent)] uppercase tracking-wider">
                    CEO & Founder
                  </p>
                  <p className="text-lg font-semibold text-white">Cristian Cortés</p>
                </div>
              </div>
              <div className="relative aspect-[4/5] sm:aspect-auto sm:min-h-[320px] bg-[#040404]">
                <Image
                  src="/founders/beatriz.jpg"
                  alt="Beatriz Isler Muñoz"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#040404] via-[#040404]/50 to-transparent p-4">
                  <p className="text-xs text-[var(--accent)] uppercase tracking-wider">
                    COO & Founder
                  </p>
                  <p className="text-lg font-semibold text-white">Beatriz Isler</p>
                </div>
              </div>
            </div>
            <p className="px-5 py-4 text-center text-sm text-[var(--sage)] border-t border-[var(--border-soft)]">
              {t.team.familyNote}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card-soft p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[var(--border-strong)] shrink-0 bg-black">
                  <Image
                    src="/founders/cristian.jpg"
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="64px"
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
                <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[var(--border-strong)] shrink-0 bg-black">
                  <Image
                    src="/founders/beatriz.jpg"
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="64px"
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

      {/* CTA final */}
      <section className="py-16 border-t border-[var(--border-soft)]">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">{t.final.title}</h2>
          <p className="text-sm text-[var(--sage)] mb-6">{t.final.body}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="btn-primary sm:w-auto sm:min-w-[180px]">
              {t.final.cta}
            </Link>
            <Link href="/terms" className="btn-ghost text-xs">
              {t.final.terms}
            </Link>
            <Link href="/privacy" className="btn-ghost text-xs">
              {t.final.privacy}
            </Link>
          </div>
        </div>
      </section>

      </main>

      <footer className="border-t border-[var(--border-soft)] py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--sage)]/80">
          <p>{t.footer.copy}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/login" className="hover:text-[var(--accent)]">
              {t.nav.enter}
            </Link>
            <Link href="/terms" className="hover:text-[var(--accent)]">
              {t.final.terms}
            </Link>
            <Link href="/privacy" className="hover:text-[var(--accent)]">
              {t.final.privacy}
            </Link>
            <a
              href="https://www.salvazion.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)]"
            >
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

const features = [
  { key: 'bible', Icon: BibleIcon },
  { key: 'devotional', Icon: DevotionalIcon },
  { key: 'health', Icon: HealthIcon },
  { key: 'freedom', Icon: FreedomIcon },
  { key: 'phalanx', Icon: InviteIcon },
  { key: 'web3', Icon: SwapIcon },
] as const;

const copy = {
  en: {
    nav: {
      app: 'The App',
      pricing: 'Pricing',
      purpose: 'Purpose',
      token: 'Token',
      team: 'Team',
      enter: 'Enter Hub',
      language: 'Language',
    },
    hero: {
      eyebrow: 'Digital Community · Faith · Family · Technology',
      title: 'MAKE SALVATION,\nHEALTH AND\nFREEDOM',
      sub: 'GREAT AGAIN',
      tagline: 'The secular world strips spirit, mind, body and soul.',
      tagline2: 'Salvazion gives them back — in one App.',
      ctaPrimary: 'Create free account',
      ctaLogin: 'I have an account',
      socialHint: 'Gmail · X · email · install as PWA',
    },
    app: {
      eyebrow: 'One App',
      title: 'Everything fused into a single Hub',
      subtitle:
        'Salvation, Health and Freedom live together in one App: daily scores, Bible and devotionals, health with sensors and wearables, Freedom library, community invites, Green Lion coach and $SALVAZION on Solana.',
      featuresTitle: 'What you can do today',
      featuresSubtitle: 'Live product — freemium Hub with Premium tools.',
      cta: 'Open the App',
      areas: [
        {
          name: 'Salvation',
          icon: '✝',
          body: 'Faith at the center. Full offline Bible, daily devotionals, prayer motives, discipline calendar and measurable spiritual scores.',
          inApp: 'Bible · Devotional · Prayer · Coach León Verde',
        },
        {
          name: 'Health',
          icon: '🌿',
          body: 'The body is a temple. Sleep, hydration, meals, sports, phone sensors, Bluetooth HR and cloud wearables (Premium).',
          inApp: 'Health hub · sensors · wearables · biomarkers',
        },
        {
          name: 'Freedom',
          icon: '🦅',
          body: 'Freedom with responsibility: curated books, X articles, YouTube channels, Phalanx community and economic sovereignty on Solana.',
          inApp: 'Freedom hub · Community · $SALVAZION swap',
        },
      ],
      features: {
        bible: {
          title: 'Full offline Bible',
          body: 'ES · EN · originals. Read, search and concordance. Log chapters for Salvation points.',
        },
        devotional: {
          title: 'Daily devotional',
          body: 'Rules-based daily reading free; unlimited AI devotionals with Premium — Scripture, virtue and BioConservatism.',
        },
        health: {
          title: 'Health + sensors + wearables',
          body: 'Manual logs, phone sensors, BLE heart rate. Premium: Fitbit, Oura, WHOOP, Garmin, biomarkers and clinical tools.',
        },
        freedom: {
          title: 'Freedom library & media',
          body: 'Books, Freedom articles from X and YouTube channels. Learn and contribute — not passive consumption.',
        },
        phalanx: {
          title: 'Phalanx community',
          body: 'Invite family, siblings, friends and colleagues. Grow scores and discipline together.',
        },
        web3: {
          title: '$SALVAZION on Solana',
          body: 'Connect Jupiter Mobile, Phantom or Solflare and swap via Jupiter. Patriotic Bitcoin — we never hold your keys.',
        },
      },
    },
    pricing: {
      eyebrow: 'Freemium',
      title: 'Start free. Go Premium when ready.',
      subtitle:
        'Base access to Salvation, Health and Freedom is free. Premium unlocks the Green Lion AI coach, AI devotionals, cloud wearables and advanced tools.',
      freeNote: 'Forever free to start the journey',
      freeItems: [
        'Dashboard, daily scores and onboarding',
        'Full offline Bible (ES · EN · originals)',
        'Daily rules-based devotional',
        'Manual health logging and basic Freedom browse',
        'Solana wallet connect and profile',
        'Basic Phalanx invites',
      ],
      premiumNote: 'Full access + advanced tools across the App',
      bestValue: 'Best value yearly',
      ctaFree: 'Create free account',
      ctaPremium: 'Join & upgrade to Premium',
      stripeNote:
        'Secure payments with Stripe (Salvazion, Inc.). Cancel or change plans anytime in the customer portal.',
    },
    purpose: {
      eyebrow: 'Massive Transformative Purpose',
      title: 'Our purpose',
      body: 'Our Purpose is make Salvation, Health and Freedom great again, through a Global Community that defends Western Christian Culture and BioConservatism in a Spiritual Warfare.',
      values: [
        {
          title: 'Faith',
          body: 'Christ at the center. Scripture, prayer and virtue as the foundation of every build.',
        },
        {
          title: 'Family',
          body: 'The Community starts at home: marriage, children, siblings and real community.',
        },
        {
          title: 'Freedom',
          body: 'Personal and economic sovereignty against relativism and centralized control.',
        },
      ],
    },
    salvators: {
      chapter: 'Chapter 01',
      title: 'The 12 Salvators',
      subtitle: 'Focusing on these 12 Salvators — watch each principle light up.',
      caption:
        'This is not a meme — it is a Spiritual Revival and a change of era. The App turns principles into daily actions and scores across Salvation, Health and Freedom.',
      audioHint: 'Unmute the player for the ambient score · soft crossfade between each principle',
    },
    token: {
      subtitle: 'Buy $SALVAZION Patriot Bitcoin on Solana',
      connect: 'Connect your Solana wallet',
      buy: 'Buy $SALVAZION',
      openJupiter: 'Open on Jupiter',
    },
    revival: {
      eyebrow: 'Spiritual Revival',
      title: "This is not a meme, it's a Spiritual Revival and a change of era.",
      body: 'Not entertainment. A call to faith, family, health and freedom — for a generation that refuses to sleep.',
    },
    team: {
      eyebrow: 'Founders',
      title: 'An ordinary family, but with “good genes”',
      intro:
        'Cristian Cortés and Beatriz Isler are a married couple, who have worked together for 20+ years in different health, education, technology and innovation startups, who complement each other and share values (excellence, integrity and deep respect for the service of people), adapting constantly to achieve its purpose: Make Salvation, Health and Freedom great again!',
      familyNote:
        'Husband and wife · four children · building Salvazion together for Salvation, Health and Freedom.',
      cristianRole: 'CEO at Salvazion Inc.',
      cristian:
        'Physical Therapist, Bachelor of Kinesiology. Master in Physical Therapy, Minor in Psychology and Diplomas in Rehabilitation, Exercise, Health and University Innovation. Sherpa and Instructor in “Evidence Based Entrepreneurship & Lean Innovation (EBELI)”. Former Singularity University Ambassador Santiago Chapter. “ExO Entrepreneur LATAM” for the ExO Community Award. “Fifty of the Most Influential Voices in Healthcare” for Medika Life, “Top 50 Global HealthTech Thought Leader and Influencers on Ecosystems” for Thinker 360 and “Top 200 Exponentialists in Digital Health”.',
      beatrizRole: 'COO at Salvazion Inc.',
      beatriz:
        'Physical Therapist, Bachelor of Kinesiology. Master in Physical Therapy with Diplomas in Rehabilitation, Exercise and Health, with experience as a University Professor and Researcher in Human Functionality, Digital Health and Aquatic Therapy. She did an International Clinical Internship in Hydrotherapy. She coordinated the “Choose Living Healthy” program of the Ministry of Health; however, her greatest achievement is to form a beautiful family (husband and four children), balancing her life as an entrepreneur. In 2022, she was recognized as a “Digital Health Champion” by the IDB (Inter-American Development Bank).',
    },
    final: {
      title: 'The Community awaits',
      body: 'Create your free account and walk with us in one App — upgrade to Premium anytime.',
      cta: 'Join now',
      terms: 'Terms',
      privacy: 'Privacy',
    },
    footer: {
      copy: '© 2026 Salvazion Inc. · All rights reserved · Faith, family and exponential technology.',
    },
  },
  es: {
    nav: {
      app: 'La App',
      pricing: 'Precios',
      purpose: 'Propósito',
      token: 'Token',
      team: 'Equipo',
      enter: 'Entrar al Hub',
      language: 'Idioma',
    },
    hero: {
      eyebrow: 'Comunidad digital · Fe · Familia · Tecnología',
      title: 'MAKE SALVATION,\nHEALTH AND\nFREEDOM',
      sub: 'GREAT AGAIN',
      tagline: 'El mundo secular te quita el espíritu, la mente, el cuerpo y el alma.',
      tagline2: 'Salvazion te los devuelve — en una sola App.',
      ctaPrimary: 'Crear cuenta gratis',
      ctaLogin: 'Ya tengo cuenta',
      socialHint: 'Gmail · X · email · PWA en el teléfono',
    },
    app: {
      eyebrow: 'Una sola App',
      title: 'Todo fusionado en un solo Hub',
      subtitle:
        'Salvation, Health y Freedom viven juntos en una App: scores diarios, Biblia y devocionales, salud con sensores y wearables, biblioteca Freedom, comunidad Phalanx, coach León Verde y $SALVAZION en Solana.',
      featuresTitle: 'Lo que ya puedes hacer',
      featuresSubtitle: 'Producto vivo — Hub freemium con herramientas Premium.',
      cta: 'Abrir la App',
      areas: [
        {
          name: 'Salvation',
          icon: '✝',
          body: 'La fe al centro. Biblia completa offline, devocional diario, motivos de oración, calendario de disciplina y scores espirituales medibles.',
          inApp: 'Biblia · Devocional · Oración · Coach León Verde',
        },
        {
          name: 'Health',
          icon: '🌿',
          body: 'El cuerpo es templo. Sueño, hidratación, comidas, deportes, sensores del celular, HR Bluetooth y wearables en la nube (Premium).',
          inApp: 'Health hub · sensores · wearables · biomarcadores',
        },
        {
          name: 'Freedom',
          icon: '🦅',
          body: 'Libertad con responsabilidad: libros curados, artículos en X, canales de YouTube, comunidad Phalanx y soberanía económica en Solana.',
          inApp: 'Freedom hub · Comunidad · Swap $SALVAZION',
        },
      ],
      features: {
        bible: {
          title: 'Biblia completa offline',
          body: 'ES · EN · originales. Lectura, búsqueda y concordancia. Marca capítulos y suma Salvation.',
        },
        devotional: {
          title: 'Devocional diario',
          body: 'Devocional por reglas gratis; devocionales con IA ilimitados en Premium — Escritura, virtud y BioConservadurismo.',
        },
        health: {
          title: 'Health + sensores + wearables',
          body: 'Registros manuales, sensores del teléfono, HR Bluetooth. Premium: Fitbit, Oura, WHOOP, Garmin, biomarcadores y herramientas clínicas.',
        },
        freedom: {
          title: 'Biblioteca y medios Freedom',
          body: 'Libros, artículos Freedom en X y canales de YouTube. Aprender y aportar — no consumo pasivo.',
        },
        phalanx: {
          title: 'Comunidad Phalanx',
          body: 'Invita familia, hermanos, amigos y colegas. Crezcan en scores y disciplina juntos.',
        },
        web3: {
          title: '$SALVAZION en Solana',
          body: 'Conecta Jupiter Mobile, Phantom o Solflare y swap con Jupiter. Patriot Bitcoin — no custodiamos tus llaves.',
        },
      },
    },
    pricing: {
      eyebrow: 'Freemium',
      title: 'Empieza gratis. Pasa a Premium cuando quieras.',
      subtitle:
        'El acceso base a Salvation, Health y Freedom es gratis. Premium desbloquea el coach León Verde con IA, devocionales IA, wearables en la nube y herramientas avanzadas.',
      freeNote: 'Gratis para siempre para empezar el camino',
      freeItems: [
        'Dashboard, scores diarios y onboarding',
        'Biblia completa offline (ES · EN · originales)',
        'Devocional diario por reglas',
        'Salud manual y Freedom básico',
        'Billetera Solana y perfil',
        'Invitaciones Phalanx básicas',
      ],
      premiumNote: 'Acceso completo + herramientas avanzadas en toda la App',
      bestValue: 'Mejor valor anual',
      ctaFree: 'Crear cuenta gratis',
      ctaPremium: 'Unirme y pasar a Premium',
      stripeNote:
        'Pagos seguros con Stripe (Salvazion, Inc.). Cancela o cambia de plan cuando quieras en el portal de cliente.',
    },
    purpose: {
      eyebrow: 'Massive Transformative Purpose',
      title: 'Nuestro propósito',
      body: 'Nuestro Propósito es hacer Salvación, Salud y Libertad geniales otra vez, con una Comunidad Global que defiende la Cultura Cristiana Occidental y el Bio Conservadurismo en una Guerra Espiritual.',
      values: [
        {
          title: 'Fe',
          body: 'Cristo al centro. Escritura, oración y virtud como base de toda construcción.',
        },
        {
          title: 'Familia',
          body: 'La Comunidad empieza en casa: matrimonio, hijos, hermanos y comunidad real.',
        },
        {
          title: 'Libertad',
          body: 'Soberanía personal y económica frente al relativismo y el control centralizado.',
        },
      ],
    },
    salvators: {
      chapter: 'Chapter 01',
      title: 'Los 12 Salvators',
      subtitle: 'Enfocándonos en estos 12 Salvators — mira cómo se enciende cada principio.',
      caption:
        'Esto no es un meme: es un avivamiento espiritual y un cambio de era. La App convierte principios en acciones diarias y scores de Salvation, Health y Freedom.',
      audioHint: 'Activa el sonido del reproductor para la banda ambiente · crossfade suave entre cada principio',
    },
    token: {
      subtitle: 'Compra $SALVAZION Patriot Bitcoin en Solana',
      connect: 'Conecta tu billetera Solana',
      buy: 'Comprar $SALVAZION',
      openJupiter: 'Abrir en Jupiter',
    },
    revival: {
      eyebrow: 'Avivamiento espiritual',
      title: 'Esto no es un meme: es un avivamiento espiritual y un cambio de era.',
      body: 'No es entretenimiento. Es un llamado a la fe, la familia, la salud y la libertad — para una generación que se niega a dormir.',
    },
    team: {
      eyebrow: 'Fundadores',
      title: 'Una familia común, pero con “buenos genes”',
      intro:
        'Cristian Cortés y Beatriz Isler son un matrimonio, quienes han trabajado juntos por +20 años en diferentes startups de salud, educación, tecnología e innovación, quienes se complementan y comparten valores (excelencia, integridad y respeto profundo al servicio de las personas), adaptándose constantemente para lograr su propósito: hacer Salvación, Salud y Libertad geniales otra vez!',
      familyNote:
        'Esposo y esposa · cuatro hijos · construyendo Salvazion juntos por Salvación, Salud y Libertad.',
      cristianRole: 'CEO de Salvazion Inc.',
      cristian:
        'Kinesiólogo, Licenciado en Kinesiología. Magíster en Terapia Física, Minor en Psicología y Diplomados en Rehabilitación, Ejercicio, Salud e Innovación Universitaria. Sherpa e Instructor en “Evidence Based Entrepreneurship & Lean Innovation (EBELI)”. Ex Embajador del Capítulo de Santiago en Singularity University. “ExO Entrepreneur LATAM” por la ExO Community Award. “Fifty of the Most Influential Voices in Healthcare” por Medika Life, “Top 50 Global HealthTech Thought Leader and Influencers on Ecosystems” por Thinker 360 y “Top 200 Exponencialistas en Salud Digital”.',
      beatrizRole: 'COO de Salvazion Inc.',
      beatriz:
        'Kinesióloga, Licenciada en Kinesiología. Magíster en Terapia Física con Diplomados en Rehabilitación, Ejercicio y Salud, con experiencia como Docente e Investigadora Universitaria en Funcionalidad Humana, Salud Digital y Terapia Acuática. Realizó una Pasantía Clínica Internacional en Hidroterapia. Coordinó el programa “Elige Vivir Sano” del Ministerio de Salud; sin embargo, su mayor logro es conformar una hermosa familia (esposo y cuatro hijos), balanceando su vida como emprendedora. En 2022, fue reconocida como “Campeona en Salud Digital” por el BID (Banco Interamericano de Desarrollo).',
    },
    final: {
      title: 'La Comunidad te espera',
      body: 'Crea tu cuenta gratis y camina con nosotros en una sola App — pasa a Premium cuando quieras.',
      cta: 'Unirme ahora',
      terms: 'Términos',
      privacy: 'Privacidad',
    },
    footer: {
      copy: '© 2026 Salvazion Inc. · Todos los derechos reservados · Fe, familia y tecnología exponencial.',
    },
  },
} as const;
