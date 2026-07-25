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

const JUPITER_BUY =
  'https://jup.ag/swap?inputMint=So11111111111111111111111111111111111111112&outputMint=7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2';
const MINT = '7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2';

export default function SalvazionLanding() {
  const { lang, setLang } = useI18n();
  const t = copy[lang];

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border-soft)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404] shrink-0">
              <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
            </div>
            <span className="font-mono text-lg tracking-tighter text-[var(--accent)] neon-text hidden xs:inline">
              SALVAZION
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-[11px] uppercase tracking-[0.15em] text-[var(--sage)]">
            <a href="#app" className="hover:text-[var(--accent)] transition-colors">
              {t.nav.app}
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
            {/* Language: USA = English (principal), Chile = Español */}
            <div
              className="flex items-center gap-1 p-0.5 rounded-full border border-[var(--border-soft)] bg-[#0a0a0a]/80"
              role="group"
              aria-label={t.nav.language}
            >
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold transition ${
                  lang === 'en'
                    ? 'bg-[var(--accent-fill)] text-[#0a120c]'
                    : 'text-[var(--sage)] hover:bg-[var(--surface-active)]'
                }`}
                aria-pressed={lang === 'en'}
                title="English (USA)"
              >
                <span className="text-base leading-none" aria-hidden>
                  🇺🇸
                </span>
                <span className="hidden sm:inline">EN</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold transition ${
                  lang === 'es'
                    ? 'bg-[var(--accent-fill)] text-[#0a120c]'
                    : 'text-[var(--sage)] hover:bg-[var(--surface-active)]'
                }`}
                aria-pressed={lang === 'es'}
                title="Español (Chile)"
              >
                <span className="text-base leading-none" aria-hidden>
                  🇨🇱
                </span>
                <span className="hidden sm:inline">ES</span>
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
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20">
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

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95] neon-text whitespace-pre-line">
            {t.hero.title}
          </h1>
          <p className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--accent)] tracking-tighter">
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
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.app.title}</h2>
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

      {/* Purpose */}
      <section id="purpose" className="py-16 sm:py-20 border-t border-[var(--border-soft)] bg-zinc-950/40">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
            {t.purpose.eyebrow}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">{t.purpose.title}</h2>
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

      {/* 12 Salvators */}
      <section id="salvators" className="py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
              {t.salvators.chapter}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.salvators.title}</h2>
            <p className="mt-2 text-sm text-[var(--sage)] max-w-lg mx-auto">{t.salvators.subtitle}</p>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-[var(--border-soft)] card-soft">
            <Image
              src="/12-salvators.jpg"
              alt={t.salvators.title}
              width={1200}
              height={800}
              className="w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040404]/95 via-[#040404]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <p className="text-sm sm:text-base text-[#D8E1D9]/90 max-w-xl">{t.salvators.caption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Token */}
      <section id="token" className="py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Solana</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-2">$SALVAZION</h2>
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

      {/* Team */}
      <section id="team" className="py-16 sm:py-20 border-t border-[var(--border-soft)] bg-zinc-950/30">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">
              {t.team.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.team.title}</h2>
            <p className="mt-3 text-sm text-[var(--sage)] max-w-2xl mx-auto leading-relaxed">
              {t.team.intro}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card-soft p-6 sm:p-8">
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-2">
                CEO & Founder
              </p>
              <h3 className="text-2xl font-semibold text-white mb-3">Cristian Cortés</h3>
              <p className="text-sm text-[#D8E1D9]/80 leading-relaxed">{t.team.cristian}</p>
            </div>
            <div className="card-soft p-6 sm:p-8">
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-2">
                COO & Founder
              </p>
              <h3 className="text-2xl font-semibold text-white mb-3">Beatriz Isler</h3>
              <p className="text-sm text-[#D8E1D9]/80 leading-relaxed">{t.team.beatriz}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 border-t border-[var(--border-soft)]">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{t.final.title}</h2>
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
            <a href="mailto:info@salvazion.org" className="hover:text-[var(--accent)]">
              info@salvazion.org
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
      purpose: 'Purpose',
      token: 'Token',
      team: 'Team',
      enter: 'Enter Hub',
      language: 'Language',
    },
    hero: {
      eyebrow: 'Digital Phalanx · Faith · Family · Technology',
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
        'We no longer split the mission into separate products. Salvation, Health and Freedom live together in one App — habits, scores, community and Solana in your pocket.',
      featuresTitle: 'What you can do today',
      featuresSubtitle: 'Live product — not a pitch deck.',
      cta: 'Open the App',
      areas: [
        {
          name: 'Salvation',
          icon: '✝',
          body: 'Faith at the center. Offline Bible, Grok devotionals and measurable spiritual discipline.',
          inApp: 'Bible · Devotional · Green Lion Coach',
        },
        {
          name: 'Health',
          icon: '🌿',
          body: 'The body is a temple. Sleep, hydration, movement, phone sensors and wearables for virtue.',
          inApp: 'Health hub · sensors · wearables',
        },
        {
          name: 'Freedom',
          icon: '🦅',
          body: 'Freedom with responsibility: learn, connect, contribute and real economic sovereignty on Solana.',
          inApp: 'Freedom hub · Phalanx · $SALVAZION swap',
        },
      ],
      features: {
        bible: {
          title: 'Full offline Bible',
          body: 'ES · EN · originals. Read, search and concordance. Log chapters for Salvation points.',
        },
        devotional: {
          title: 'Grok-powered devotional',
          body: 'Profile-aware: Scripture, virtue, Western Christian culture and BioConservatism.',
        },
        health: {
          title: 'Health + sensors',
          body: 'Sleep, water, meals, sports. Steps, GPS and Bluetooth / wearables when you connect them.',
        },
        freedom: {
          title: 'Freedom · learn & contribute',
          body: 'Library, real connections and projects. Freedom is built with craft, not passive consumption.',
        },
        phalanx: {
          title: 'Phalanx',
          body: 'Invite family, siblings, friends and colleagues. Grow together in faith, health and freedom.',
        },
        web3: {
          title: '$SALVAZION on Solana',
          body: 'Connect Phantom/Solflare and swap via Jupiter. Patriotic Bitcoin — we never hold your keys.',
        },
      },
    },
    purpose: {
      eyebrow: 'Massive Transformative Purpose',
      title: 'Our purpose',
      body: 'Make Salvation, Health and Freedom Great Again. A global community defending Western Christian Culture and BioConservatism in Spiritual Warfare — with faith, family, excellence and exponential innovation at the service of people.',
      values: [
        {
          title: 'Faith',
          body: 'Christ at the center. Scripture, prayer and virtue as the foundation of every build.',
        },
        {
          title: 'Family',
          body: 'The Phalanx starts at home: marriage, children, siblings and real community.',
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
      subtitle: 'Focus principles for the Phalanx.',
      caption:
        'Twelve anchors of discipline and character. The App turns principles into daily actions and scores across Salvation, Health and Freedom.',
    },
    token: {
      subtitle: 'Patriotic Bitcoin on Solana',
      connect: 'Connect your Solana wallet',
      buy: 'Buy $SALVAZION',
      openJupiter: 'Open on Jupiter',
    },
    team: {
      eyebrow: 'Founders',
      title: 'A family with purpose',
      intro:
        'Cristian Cortés and Beatriz Isler: 20+ years together in health, education, technology and innovation. Excellence, integrity and service to people.',
      cristian:
        'Physical Therapist, Master in Physical Therapy. Former Singularity University Ambassador. Top Exponentialist in Digital Health. Green Lion King · CEO, Salvazion Inc.',
      beatriz:
        'Physical Therapist and university professor. Digital Health Champion (IDB). Mother of four and co-builder of Salvazion · COO.',
    },
    final: {
      title: 'The Phalanx awaits',
      body: 'Create your account and walk with us in one App.',
      cta: 'Join now',
      terms: 'Terms',
      privacy: 'Privacy',
    },
    footer: {
      copy: '© 2026 Salvazion · Faith, family and exponential technology.',
    },
  },
  es: {
    nav: {
      app: 'La App',
      purpose: 'Propósito',
      token: 'Token',
      team: 'Equipo',
      enter: 'Entrar al Hub',
      language: 'Idioma',
    },
    hero: {
      eyebrow: 'Phalanx digital · Fe · Familia · Tecnología',
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
        'Ya no separamos la misión en productos distintos. Salvation, Health y Freedom viven juntos en una App: hábitos, scores, comunidad y Solana en tu bolsillo.',
      featuresTitle: 'Lo que ya puedes hacer',
      featuresSubtitle: 'Producto vivo — no solo un pitch.',
      cta: 'Abrir la App',
      areas: [
        {
          name: 'Salvation',
          icon: '✝',
          body: 'La fe al centro. Biblia offline, devocional con Grok y disciplina espiritual medible.',
          inApp: 'Biblia · Devocional · Coach León Verde',
        },
        {
          name: 'Health',
          icon: '🌿',
          body: 'El cuerpo es templo. Sueño, hidratación, movimiento, sensores del celular y wearables al servicio de la virtud.',
          inApp: 'Health hub · sensores · wearables',
        },
        {
          name: 'Freedom',
          icon: '🦅',
          body: 'Libertad con responsabilidad: aprender, conectar, aportar y soberanía económica real en Solana.',
          inApp: 'Freedom hub · Phalanx · Swap $SALVAZION',
        },
      ],
      features: {
        bible: {
          title: 'Biblia completa offline',
          body: 'ES · EN · originales. Lectura, búsqueda y concordancia. Marca capítulos y suma Salvation.',
        },
        devotional: {
          title: 'Devocional con Grok',
          body: 'Personalizado a tu perfil: Escritura, virtud, cultura cristiano-occidental y BioConservadurismo.',
        },
        health: {
          title: 'Health con sensores',
          body: 'Sueño, agua, comida, deportes. Pasos, GPS y monitores Bluetooth / wearables cuando los conectas.',
        },
        freedom: {
          title: 'Freedom · aprender y aportar',
          body: 'Biblioteca, conexiones reales y proyectos. La libertad se construye con oficio, no con consumo pasivo.',
        },
        phalanx: {
          title: 'Phalanx',
          body: 'Invita familia, hermanos, amigos y colegas. Crezcan juntos en fe, salud y libertad.',
        },
        web3: {
          title: '$SALVAZION en Solana',
          body: 'Conecta Phantom/Solflare y swap con Jupiter. Patriot Bitcoin — no custodiamos tus llaves.',
        },
      },
    },
    purpose: {
      eyebrow: 'Massive Transformative Purpose',
      title: 'Nuestro propósito',
      body: 'Make Salvation, Health and Freedom Great Again. Una comunidad global que defiende la Cultura Occidental Cristiana y el BioConservadurismo en una Guerra Espiritual — con fe, familia, excelencia e innovación exponencial al servicio de las personas.',
      values: [
        {
          title: 'Fe',
          body: 'Cristo al centro. Escritura, oración y virtud como base de toda construcción.',
        },
        {
          title: 'Familia',
          body: 'La Phalanx empieza en casa: matrimonio, hijos, hermanos y comunidad real.',
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
      subtitle: 'Principios de enfoque para la Phalanx.',
      caption:
        'Doce anclas de disciplina y carácter. La App convierte principios en acciones diarias y scores de Salvation, Health y Freedom.',
    },
    token: {
      subtitle: 'Patriot Bitcoin on Solana',
      connect: 'Conecta tu billetera Solana',
      buy: 'Comprar $SALVAZION',
      openJupiter: 'Abrir en Jupiter',
    },
    team: {
      eyebrow: 'Fundadores',
      title: 'Una familia con propósito',
      intro:
        'Cristian Cortés y Beatriz Isler: más de 20 años juntos en salud, educación, tecnología e innovación. Excelencia, integridad y servicio a las personas.',
      cristian:
        'Kinesiólogo, Magíster en Kinesiología. Ex Embajador de Singularity University. Top Exponentialist en Digital Health. Green Lion King · CEO de Salvazion Inc.',
      beatriz:
        'Kinesióloga y académica. Digital Health Champion (BID). Madre de cuatro y co-constructora de Salvazion · COO.',
    },
    final: {
      title: 'La Phalanx te espera',
      body: 'Crea tu cuenta y camina con nosotros en una sola App.',
      cta: 'Unirme ahora',
      terms: 'Términos',
      privacy: 'Privacidad',
    },
    footer: {
      copy: '© 2026 Salvazion · Fe, familia y tecnología exponencial.',
    },
  },
} as const;
