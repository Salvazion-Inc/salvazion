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

const CACHE_PREFIX = 'salvazion_devotional_';

export default function DevotionalPage() {
  const { t, lang } = useI18n();
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

      // Restore today's cached Grok/rules devotional
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
            setEngineNote(cached.note || null);
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
        setEngineNote(json.note || null);
        try {
          localStorage.setItem(
            CACHE_PREFIX + today,
            JSON.stringify({
              data: json.data,
              engine: json.engine,
              note: json.note,
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
      setError(lang === 'en' ? 'Could not reach the engine' : 'No se pudo conectar con el motor');
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
  const isGrok = engine?.startsWith('grok') || devotional?.source === 'grok';

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <Link
          href="/hub/dashboard"
          className="flex items-center gap-2 text-sm text-[#8FD99A] hover:opacity-80"
        >
          <span>←</span>
          <span>{lang === 'en' ? 'Home' : 'Inicio'}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-1 rounded-full border ${
              isGrok
                ? 'border-[#8FD99A] text-[#8FD99A]'
                : 'border-[#6B8F6E]/40 text-[#B7F7AC]/60'
            }`}
          >
            {isGrok ? 'Grok · xAI' : lang === 'en' ? 'Rules engine' : 'Motor reglas'}
          </span>
          <div className="w-9 h-9 rounded-full border border-[#8FD99A]/50 flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-8 pb-28 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 mt-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#8FD99A]">
              {lang === 'en' ? 'Personalized Devotional' : 'Devocional Personalizado'}
            </h1>
            <p className="text-sm text-[#B7F7AC]/70 mt-1">
              {lang === 'en'
                ? 'Grok · Western Christian culture · BioConservatism · Virtue'
                : 'Grok · Cultura cristiano-occidental · BioConservadurismo · Virtud'}
            </p>
          </div>

          <div className="glass rounded-xl px-4 py-3 mb-6 flex items-start gap-3 border border-[#8FD99A]/20">
            <div className="w-9 h-9 rounded-full border border-[#8FD99A]/40 flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[#040404]">
              <Image src="/logo-icon.png" alt="León Verde" width={36} height={36} className="object-cover" />
            </div>
            <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
              {getLionShortNudge('salvation')}
            </p>
          </div>

          {/* Profile summary used for personalization */}
          <div className="glass rounded-2xl p-5 mb-6 space-y-3">
            <p className="text-xs uppercase tracking-wider text-[#B7F7AC]/50">
              {lang === 'en' ? 'Profile used for Grok' : 'Perfil usado por Grok'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-[#B7F7AC]/50">{lang === 'en' ? 'Name' : 'Nombre'}</p>
                <p className="text-white">{profile.name || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#B7F7AC]/50">{lang === 'en' ? 'Purpose' : 'Propósito'}</p>
                <p className="text-white line-clamp-2">{profile.purpose || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#B7F7AC]/50">{lang === 'en' ? 'Maturity' : 'Madurez'}</p>
                <p className="text-white">{profile.spiritualMaturity || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#B7F7AC]/50">{lang === 'en' ? 'Family' : 'Familia'}</p>
                <p className="text-white">{profile.familyStatus || '—'}</p>
              </div>
            </div>
            {(profile.currentFocus?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.currentFocus!.map((f) => (
                  <span
                    key={f}
                    className="px-2 py-0.5 rounded-full text-[10px] border border-[#8FD99A]/30 text-[#8FD99A]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-[#B7F7AC]/40">
              {lang === 'en'
                ? 'Edit full profile under Profile. Generation uses your saved data.'
                : 'Edita el perfil completo en Perfil. La generación usa tus datos guardados.'}
            </p>

            <button
              onClick={generate}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[#7BC98A] text-[#040404] font-semibold text-base hover:bg-[#B7F7AC] transition-all disabled:opacity-50"
            >
              {loading
                ? lang === 'en'
                  ? 'Grok is writing…'
                  : 'Grok está escribiendo…'
                : devotional
                  ? lang === 'en'
                    ? 'Regenerate with Grok'
                    : 'Regenerar con Grok'
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
              <div className="w-10 h-10 mx-auto border-2 border-[#8FD99A]/30 border-t-[#8FD99A] rounded-full animate-spin" />
              <p className="text-sm text-[#8FD99A]">
                {lang === 'en'
                  ? 'Grok is crafting a longer, personalized biblical devotional…'
                  : 'Grok está elaborando un devocional bíblico largo y personalizado…'}
              </p>
              <p className="text-xs text-[#B7F7AC]/50">
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
                  <p className="text-sm text-[#B7F7AC]/60 mt-1">
                    {lang === 'en' ? 'For' : 'Para'} {devotional.personalizedFor}
                  </p>
                )}
                {engineNote && (
                  <p className="text-[11px] text-[#B7F7AC]/40 mt-2">{engineNote}</p>
                )}
              </div>

              <div className="bg-[#040404]/60 rounded-xl p-5 border border-[#6B8F6E]/20">
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
                <h3 className="text-sm uppercase tracking-wider text-[#B7F7AC] mb-2">
                  {lang === 'en' ? 'Reflection' : 'Reflexión'}
                </h3>
                <div className="leading-relaxed text-[#D8E1D9]/90 space-y-3 whitespace-pre-wrap">
                  {devotional.reflection}
                </div>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-[#B7F7AC] mb-2">
                  {lang === 'en' ? 'Prayer' : 'Oración'}
                </h3>
                <p className="leading-relaxed text-[#D8E1D9]/90 italic whitespace-pre-wrap">
                  {devotional.prayer}
                </p>
              </div>

              <div className="bg-[#7BC98A]/5 border border-[#8FD99A]/30 rounded-xl p-4">
                <h3 className="text-sm uppercase tracking-wider text-[#8FD99A] mb-2">
                  {lang === 'en' ? "Today's action" : 'Acción de hoy'}
                </h3>
                <p className="text-[#D8E1D9]">{devotional.action}</p>
              </div>

              {devotional.closing && (
                <div className="border-l-2 border-[#8FD99A]/50 pl-4">
                  <h3 className="text-sm uppercase tracking-wider text-[#B7F7AC] mb-1">
                    {lang === 'en' ? 'Charge' : 'Consigna'}
                  </h3>
                  <p className="text-sm text-[#D8E1D9]/90 leading-relaxed">{devotional.closing}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {devotional.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs border border-[#6B8F6E]/40 text-[#B7F7AC]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                onClick={markComplete}
                disabled={completed}
                className={`w-full py-3.5 rounded-xl border-2 font-medium transition-all ${
                  completed
                    ? 'border-[#6B8F6E] text-[#B7F7AC] bg-[#6B8F6E]/10'
                    : 'border-[#8FD99A] text-[#8FD99A] hover:bg-[#7BC98A]/10'
                }`}
              >
                {completed
                  ? `✓ ${lang === 'en' ? 'Completed' : 'Completado'} · +${pts} Salvation`
                  : `${lang === 'en' ? 'Mark as completed' : 'Marcar como completado'} · +${pts} Salvation`}
              </button>
            </div>
          )}

          {!devotional && !loading && (
            <div className="text-center py-12 text-[#B7F7AC]/40">
              <p>
                {lang === 'en'
                  ? 'Generate a longer Grok-powered devotional from your profile.'
                  : 'Genera un devocional extenso con Grok a partir de tu perfil.'}
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
