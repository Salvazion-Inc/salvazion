'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import JupiterSwap from '@/components/wallet/JupiterSwap';
import { useI18n } from '@/components/I18nProvider';

const SalvazionSite = () => {
  const { lang, setLang } = useI18n();

  const copy = {
    es: {
      purpose: 'Propósito',
      salvators: '12 Salvators',
      token: 'Token',
      team: 'Equipo',
      enterHub: 'Ingresar a Hub',
      heroTitle: 'MAKE SALVATION,\nHEALTH AND\nFREEDOM',
      heroSub: 'GREAT AGAIN',
      tagline: 'El mundo secular te quita el espíritu, mente, cuerpo y alma.',
      tagline2: 'Salvazion te los devuelve.',
      buyToken: 'Comprar $SALVAZION en Jupiter',
      connectWallet: 'Conecta tu billetera Solana',
      download: 'Entrar a la App',
      chapter: 'CHAPTER 01',
      salvatorsTitle: 'LOS 12 SALVATORS',
      purposeTitle: 'Nuestro Propósito',
      purposeBody:
        'Make Salvation, Health and Freedom Great Again. Defendemos la Cultura Occidental Cristiana y el BioConservadurismo en una Guerra Espiritual.',
      founders: 'Fundadores',
      footer:
        '© 2026 Salvazion Inc. • Defendiendo la Civilización Occidental con Fe, Familia y Tecnología Exponencial.',
    },
    en: {
      purpose: 'Purpose',
      salvators: '12 Salvators',
      token: 'Token',
      team: 'Team',
      enterHub: 'Enter Hub',
      heroTitle: 'MAKE SALVATION,\nHEALTH AND\nFREEDOM',
      heroSub: 'GREAT AGAIN',
      tagline: 'The secular world takes away your spirit, mind, body and soul.',
      tagline2: 'Salvazion gives them back to you.',
      buyToken: 'Buy $SALVAZION on Jupiter',
      connectWallet: 'Connect your Solana wallet',
      download: 'Enter the App',
      chapter: 'CHAPTER 01',
      salvatorsTitle: 'THE 12 SALVATORS',
      purposeTitle: 'Our Purpose',
      purposeBody:
        'Make Salvation, Health and Freedom Great Again. We defend Western Christian Culture and BioConservatism in a Spiritual Warfare.',
      founders: 'Founders',
      footer:
        '© 2026 Salvazion Inc. • Defending Western Civilization with Faith, Family and Exponential Technology.',
    },
  };

  const t = copy[lang];

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border-strong)]">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-[#8FD99A] flex items-center justify-center lion-glow overflow-hidden">
              <Image src="/logo.png" alt="Salvazion" width={36} height={36} className="object-contain" />
            </div>
            <div className="font-mono text-xl tracking-tighter neon-text text-[#8FD99A]">SALVAZION</div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest text-[var(--sage)]">
            <a href="#purpose" className="hover:text-[#8FD99A] transition-colors">
              {t.purpose}
            </a>
            <a href="#salvators" className="hover:text-[#8FD99A] transition-colors">
              {t.salvators}
            </a>
            <a href="#token" className="hover:text-[#8FD99A] transition-colors">
              {t.token}
            </a>
            <a href="#team" className="hover:text-[#8FD99A] transition-colors">
              {t.team}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-strong)] hover:bg-[var(--surface-active)] transition-all text-xs"
              aria-label="Toggle language"
            >
              {lang === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
            </button>
            <Link
              href="/auth/login"
              className="px-5 py-2.5 bg-[var(--accent-fill)] text-[#0a120c] font-semibold rounded-full hover:bg-[var(--accent-hover)] transition-all text-sm shadow-[0_0_0_3px_rgba(143,217,154,0.08)]"
            >
              {t.enterHub}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#8FD99A_0.8px,transparent_1px)] bg-[length:22px_22px] opacity-15" />

        <div className="max-w-5xl mx-auto px-5 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Salvazion Green Lion"
              width={220}
              height={220}
              className="lion-glow"
              priority
            />
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter mb-4 leading-none neon-text whitespace-pre-line">
            {t.heroTitle}
          </h1>
          <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#8FD99A] tracking-tighter mb-8">
            {t.heroSub}
          </div>

          <p className="max-w-2xl mx-auto text-lg md:text-xl mb-10 text-[#D8E1D9]/90">
            {t.tagline}
            <br />
            <span className="text-[#8FD99A] font-medium">{t.tagline2}</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://jup.ag/swap?inputMint=So11111111111111111111111111111111111111112&outputMint=7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-[var(--accent-fill)] hover:bg-[var(--accent-hover)] text-[#0a120c] text-lg font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-[0_0_0_3px_rgba(143,217,154,0.1)]"
            >
              {t.buyToken}
              <span className="group-hover:translate-x-0.5 transition">↗</span>
            </a>
            <Link
              href="/auth/login"
              className="px-8 py-4 border border-[var(--border-strong)] text-[var(--accent)] text-lg font-semibold rounded-2xl hover:bg-[var(--surface-active)] transition-all"
            >
              {t.download}
            </Link>
          </div>
        </div>
      </section>

      {/* 12 Salvators */}
      <section id="salvators" className="py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 text-[#8FD99A] text-xs tracking-[4px] mb-3">
              {t.chapter}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{t.salvatorsTitle}</h2>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-[var(--border-strong)]">
            <Image
              src="/12-salvators.jpg"
              alt="12 Salvators — focusing principles"
              width={1200}
              height={800}
              className="w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040404]/90 via-[#040404]/50 to-transparent" />
          </div>
        </div>
      </section>

      {/* Purpose */}
      <section id="purpose" className="py-20 bg-[#040404]">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-8">{t.purposeTitle}</h2>
          <p className="text-xl leading-relaxed text-[#D8E1D9]/85">{t.purposeBody}</p>
        </div>
      </section>

      {/* Token */}
      <section id="token" className="py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-5xl font-bold tracking-tighter mb-4">$SALVAZION</h2>
          <p className="text-lg mb-8 text-[var(--sage)]">Patriot Bitcoin on Solana</p>

          <div className="font-mono text-xs sm:text-sm bg-zinc-900/80 border border-[var(--border-soft)] p-3 rounded-xl mb-8 inline-block break-all">
            CA: 7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2
          </div>

          <div className="max-w-md mx-auto mb-8 text-left space-y-4">
            <p className="text-center text-sm text-[var(--sage)]">{t.connectWallet}</p>
            <WalletConnectCard showJupiter={false} />
            <div className="glass rounded-2xl p-3">
              <p className="text-center text-xs text-[var(--sage)] mb-2 uppercase tracking-wider">
                Jupiter · Solana
              </p>
              <JupiterSwap mode="modal" triggerLabel={t.buyToken} />
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-20 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-center mb-12">{t.founders}</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-3xl">
              <div className="text-[#8FD99A] text-xs uppercase tracking-wider mb-3">CEO & Founder</div>
              <h3 className="text-3xl font-semibold mb-4">Cristian Cortés</h3>
              <p className="text-[#D8E1D9]/80 leading-relaxed">
                Physical Therapist. Master in Physical Therapy. Ex Singularity University Ambassador.
                Top Exponentialist in Digital Health. Green Lion King.
              </p>
            </div>

            <div className="glass p-8 rounded-3xl">
              <div className="text-[#8FD99A] text-xs uppercase tracking-wider mb-3">COO & Founder</div>
              <h3 className="text-3xl font-semibold mb-4">Beatriz Isler</h3>
              <p className="text-[#D8E1D9]/80 leading-relaxed">
                Physical Therapist. University Professor. Digital Health Champion (IDB). Mother of
                four and co-builder of Salvazion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-soft)] py-12">
        <div className="max-w-7xl mx-auto px-5 text-center text-sm text-[var(--sage)]/80">
          {t.footer}
        </div>
      </footer>
    </div>
  );
};

export default SalvazionSite;
