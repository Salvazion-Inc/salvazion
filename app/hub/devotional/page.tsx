'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { Devotional, UserProfile } from '@/lib/types';
import { loadProfileAsync, calculateAge, getLifeStage } from '@/lib/store/profile';
import { logAction, getPointsForAction } from '@/lib/scoring/engine';
import { getLionShortNudge } from '@/lib/coach/engine';
import { useI18n } from '@/components/I18nProvider';
import { pickLang } from '@/lib/i18n/locale';
import AiUsageMeter from '@/components/billing/AiUsageMeter';

const CACHE_PREFIX = 'salvazion_devotional_';

export default function DevotionalPage() {
  const { t, lang } = useI18n();
  const tx = (en: string, es: string, pt: string) => pickLang(lang, { en, es, pt });
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [engineNote, setEngineNote] = useState<string | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      const p = await loadProfileAsync();
      if (p) {
        setProfile((prev) => ({
          ...prev,
          ...p,
          language: p.language || lang,
        }));
      } else {
        setProfile((prev) => ({ ...prev, language: lang }));
      }

      // Restore today's cached devotional
      try {
        const raw = localStorage.getItem(CACHE_PREFIX + today);
        if (raw) {
          const cached = JSON.parse(raw) as {
            data: Devotional;
            engine?: string;
            note?: string;
            completed?: boolean;
          };
          if (cached?.data?.date === today) {
            setDevotional(cached.data);
            setEngine(cached.engine || null);
            // Never surface provider brand names in the UI
            const note = cached.note || null;
            setEngineNote(
              note && /grok|xai/i.test(note) ? null : note
            );
            setCompleted(!!cached.completed);
          }
        }
      } catch {
        // ignore
      }
      setBooting(false);
    })();
  }, [lang, today]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setCompleted(false);
    try {
      const payload = {
        name: profile.name,
        language: profile.language || lang,
        spiritualMaturity: profile.spiritualMaturity,
        familyStatus: profile.familyStatus,
        currentFocus: profile.currentFocus,
        struggles: profile.struggles,
        preferredBibleVersion: profile.preferredBibleVersion,
        purpose: profile.purpose,
        city: profile.city,
        country: profile.country,
        birthDate: profile.birthDate,
        date: today,
      };

      const res = await fetch('/api/devotional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setDevotional(json.data);
        setEngine(json.engine || null);
        const note =
          typeof json.note === 'string' && !/grok|xai/i.test(json.note)
            ? json.note
            : null;
        setEngineNote(note);
        try {
          localStorage.setItem(
            CACHE_PREFIX + today,
            JSON.stringify({
              data: json.data,
              engine: json.engine,
              note,
              completed: false,
            })
          );
        } catch {
          // ignore quota
        }
      } else {
        setError(json.error || 'Error desconocido');
      }
    } catch {
      setError(tx('Could not reach the engine', 'No se pudo conectar con el motor', 'Não foi possível conectar ao motor'));
    } finally {
      setLoading(false);
    }
  };

  const markComplete = () => {
    if (completed || !devotional) return;
    logAction('devotional_complete');
    setCompleted(true);
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + today);
      if (raw) {
        const cached = JSON.parse(raw);
        localStorage.setItem(
          CACHE_PREFIX + today,
          JSON.stringify({ ...cached, completed: true })
        );
      }
    } catch {
      // ignore
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#8FD99A] animate-pulse">{t('common.lionPreparing')}</div>
      </div>
    );
  }

  const stage = profile.birthDate
    ? getLifeStage(calculateAge(profile.birthDate))
    : 'adult';
  const pts = getPointsForAction('devotional_complete', stage);
  const isAi =
    engine?.startsWith('grok') ||
    engine?.startsWith('ai') ||
    devotional?.source === 'grok';

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="page-header flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/hub/bible" className="back-btn" aria-label={tx('Back', 'Volver', 'Voltar')}>
            ←
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium">
              Salvation Hub
            </p>
            <h1 className="text-base font-bold text-[var(--accent)] leading-tight truncate">
              {tx('Devotional', 'Devocional', 'Devocional')}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`pill-soft ${isAi ? 'pill-soft-active' : ''}`}>
            {isAi
              ? lang === 'en'
                ? 'Personalized'
                : 'Personalizado'
              : lang === 'en'
                ? 'Standard'
                : 'Estándar'}
          </span>
          <div className="w-9 h-9 rounded-full border border-[var(--border-soft)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-8 pb-28 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 mt-4">
            <div className="mb-3">
              <AiUsageMeter feature="devotional_ai" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--accent)]">
              {tx('Personalized Devotional', 'Devocional Personalizado', 'Devocional Personalizado')}
            </h2>
            <p className="text-sm text-[var(--sage)] mt-1">
              {lang === 'en'
                ? 'Western Christian culture · BioConservatism · Virtue'
                : 'Cultura cristiano-occidental · BioConservadurismo · Virtud'}
            </p>
          </div>

          <div className="glass rounded-xl px-4 py-3 mb-6 flex items-start gap-3 border border-[var(--border-soft)]">
            <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[#040404]">
              <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
            </div>
            <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
              {getLionShortNudge('salvation')}
            </p>
          </div>

          {/* Profile summary used for personalization */}
          <div className="glass rounded-2xl p-5 mb-6 space-y-3">
            <p className="text-xs uppercase tracking-wider text-[var(--sage)]/80">
              {tx('Profile used for personalization', 'Perfil para personalizar', 'Perfil para personalizar')}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-[var(--sage)]/80">{tx('Name', 'Nombre', 'Nome')}</p>
                <p className="text-white">{profile.name || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--sage)]/80">{tx('Purpose', 'Propósito', 'Propósito')}</p>
                <p className="text-white line-clamp-2">{profile.purpose || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--sage)]/80">{tx('Maturity', 'Madurez', 'Maturidade')}</p>
                <p className="text-white">{profile.spiritualMaturity || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--sage)]/80">{tx('Family', 'Familia', 'Família')}</p>
                <p className="text-white">{profile.familyStatus || '—'}</p>
              </div>
            </div>
            {(profile.currentFocus?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.currentFocus!.map((f) => (
                  <span
                    key={f}
                    className="px-2 py-0.5 rounded-full text-[10px] border border-[var(--border-strong)] text-[#8FD99A]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-[var(--sage)]/70">
              {lang === 'en'
                ? 'Edit full profile under Profile. Generation uses your saved data.'
                : 'Edita el perfil completo en Perfil. La generación usa tus datos guardados.'}
            </p>

            <button
              onClick={generate}
              disabled={loading}
              className="btn-primary"
            >
              {loading
                ? lang === 'en'
                  ? 'Writing…'
                  : 'Escribiendo…'
                : devotional
                  ? lang === 'en'
                    ? 'Regenerate'
                    : 'Regenerar'
                  : lang === 'en'
                    ? "Generate today's devotional"
                    : 'Generar devocional de hoy'}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-red-500/40 text-red-400 mb-6 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="glass rounded-2xl p-8 mb-6 text-center space-y-3">
              <div className="w-10 h-10 mx-auto border-2 border-[var(--border-strong)] border-t-[#8FD99A] rounded-full animate-spin" />
              <p className="text-sm text-[#8FD99A]">
                {lang === 'en'
                  ? 'Crafting a longer, personalized biblical devotional…'
                  : 'Elaborando un devocional bíblico largo y personalizado…'}
              </p>
              <p className="text-xs text-[var(--sage)]/80">
                {lang === 'en'
                  ? 'Virtue · Scripture · Western Christian culture · BioConservatism'
                  : 'Virtud · Escritura · Cultura cristiano-occidental · BioConservadurismo'}
              </p>
            </div>
          )}

          {devotional && !loading && (
            <div className="glass rounded-2xl p-6 space-y-6">
              <div className="text-center">
                <p className="text-xs tracking-widest text-[#6B8F6E] uppercase mb-1">
                  {devotional.date} · +{devotional.points} Salvation
                  {devotional.virtue ? ` · ${devotional.virtue}` : ''}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-[#8FD99A] leading-tight">
                  {devotional.title}
                </h2>
                {devotional.personalizedFor && (
                  <p className="text-sm text-[var(--sage)] mt-1">
                    {tx('For', 'Para', 'Para')} {devotional.personalizedFor}
                  </p>
                )}
                {engineNote && !/grok|xai/i.test(engineNote) && (
                  <p className="text-[11px] text-[var(--sage)]/70 mt-2">{engineNote}</p>
                )}
              </div>

              <div className="bg-[#040404]/60 rounded-xl p-5 border border-[var(--border-soft)]">
                <p className="text-sm text-[#8FD99A] mb-2 font-medium">
                  {devotional.scripture.reference} · {devotional.scripture.version}
                </p>
                <p className="text-lg leading-relaxed italic text-[#D8E1D9]">
                  “{devotional.scripture.text}”
                </p>
              </div>

              {devotional.secondaryScripture && (
                <div className="bg-[#040404]/40 rounded-xl p-4 border border-[#6B8F6E]/15">
                  <p className="text-xs text-[#8FD99A] mb-1.5 font-medium">
                    {devotional.secondaryScripture.reference} ·{' '}
                    {devotional.secondaryScripture.version}
                  </p>
                  <p className="text-base leading-relaxed italic text-[#D8E1D9]/90">
                    “{devotional.secondaryScripture.text}”
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm uppercase tracking-wider text-[var(--sage)] mb-2">
                  {tx('Reflection', 'Reflexión', 'Reflexão')}
                </h3>
                <div className="leading-relaxed text-[#D8E1D9]/90 space-y-3 whitespace-pre-wrap">
                  {devotional.reflection}
                </div>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-[var(--sage)] mb-2">
                  {tx('Prayer', 'Oración', 'Oração')}
                </h3>
                <p className="leading-relaxed text-[#D8E1D9]/90 italic whitespace-pre-wrap">
                  {devotional.prayer}
                </p>
              </div>

              <div className="bg-[var(--surface-active)] border border-[var(--border-strong)] rounded-xl p-4">
                <h3 className="text-sm uppercase tracking-wider text-[#8FD99A] mb-2">
                  {tx("Today's action", 'Acción de hoy', 'Ação de hoje')}
                </h3>
                <p className="text-[#D8E1D9]">{devotional.action}</p>
              </div>

              {devotional.closing && (
                <div className="border-l-2 border-[var(--border-strong)] pl-4">
                  <h3 className="text-sm uppercase tracking-wider text-[var(--sage)] mb-1">
                    {tx('Charge', 'Consigna', 'Consigna')}
                  </h3>
                  <p className="text-sm text-[#D8E1D9]/90 leading-relaxed">{devotional.closing}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {devotional.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs border border-[var(--border-soft)] text-[var(--sage)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                onClick={markComplete}
                disabled={completed}
                className={completed ? 'btn-secondary opacity-80' : 'btn-primary'}
              >
                {completed
                  ? `✓ ${tx('Completed', 'Completado', 'Concluído')} · +${pts} Salvation`
                  : `${tx('Mark as completed', 'Marcar como completado', 'Marcar como concluído')} · +${pts} Salvation`}
              </button>
            </div>
          )}

          {!devotional && !loading && (
            <div className="text-center py-12 text-[var(--sage)]/70">
              <p>
                {lang === 'en'
                  ? 'Generate a longer personalized devotional from your profile.'
                  : 'Genera un devocional extenso y personalizado a partir de tu perfil.'}
              </p>
              <p className="text-sm mt-2">
                {lang === 'en'
                  ? 'Scripture · virtue · Western Christian culture · BioConservatism'
                  : 'Escritura · virtud · cultura cristiano-occidental · BioConservadurismo'}
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav variant="default" />
    </div>
  );
}
