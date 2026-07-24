'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { Devotional, UserProfile } from '@/lib/types';
import { loadProfile, calculateAge, getLifeStage } from '@/lib/store/profile';
import { logAction, getPointsForAction } from '@/lib/scoring/engine';
import { getLionShortNudge } from '@/lib/coach/engine';

export default function DevotionalPage() {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: 'Juan Pérez',
    language: 'es',
    spiritualMaturity: 'growing',
    familyStatus: 'parent',
    currentFocus: ['familia', 'fe'],
    preferredBibleVersion: 'rv1960'
  });

  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (p?.name) setProfile(prev => ({ ...prev, ...p }));
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/devotional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const json = await res.json();
      if (json.success) {
        setDevotional(json.data);
      } else {
        setError(json.error || 'Error desconocido');
      }
    } catch (e) {
      setError('No se pudo conectar con el motor');
    } finally {
      setLoading(false);
    }
  };

  const toggleFocus = (tag: string) => {
    const current = profile.currentFocus || [];
    if (current.includes(tag)) {
      setProfile({ ...profile, currentFocus: current.filter(t => t !== tag) });
    } else {
      setProfile({ ...profile, currentFocus: [...current, tag] });
    }
  };

  const focusOptions = [
    { id: 'fe', label: 'Fe' },
    { id: 'familia', label: 'Familia' },
    { id: 'proposito', label: 'Propósito' },
    { id: 'salud', label: 'Salud' },
    { id: 'libertad', label: 'Libertad' },
    { id: 'oracion', label: 'Oración' },
    { id: 'liderazgo', label: 'Liderazgo' },
    { id: 'perseverancia', label: 'Perseverancia' }
  ];

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      {/* Top bar with back */}
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <Link
          href="/hub/dashboard"
          className="flex items-center gap-2 text-sm text-[#00F511] hover:opacity-80"
        >
          <span>←</span>
          <span>Inicio</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border border-[#00F511]/50 flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-8 pb-28 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 mt-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#00F511]">
                Devocional Personalizado
              </h1>
              <p className="text-sm text-[#B7F7AC]/70">Motor de IA Salvazion · v1</p>
            </div>
          </div>

        {/* León Verde nudge */}
        <div className="glass rounded-xl px-4 py-3 mb-6 flex items-start gap-3 border border-[#00F511]/20">
          <div className="w-9 h-9 rounded-full border border-[#00F511]/40 flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="León Verde" width={36} height={36} className="object-cover" />
          </div>
          <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
            {getLionShortNudge('salvation')}
          </p>
        </div>

        {/* Profile controls */}
        <div className="glass rounded-2xl p-6 mb-6 space-y-5">
          <div>
            <label className="block text-sm text-[#B7F7AC] mb-1">Nombre</label>
            <input
              type="text"
              value={profile.name || ''}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-4 py-3 text-[#D8E1D9] focus:outline-none focus:border-[#00F511]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#B7F7AC] mb-1">Madurez</label>
              <select
                value={profile.spiritualMaturity}
                onChange={e => setProfile({ ...profile, spiritualMaturity: e.target.value as any })}
                className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-4 py-3 text-[#D8E1D9]"
              >
                <option value="new">Nuevo en la fe</option>
                <option value="growing">Creciendo</option>
                <option value="mature">Maduro</option>
                <option value="leader">Líder</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#B7F7AC] mb-1">Familia</label>
              <select
                value={profile.familyStatus}
                onChange={e => setProfile({ ...profile, familyStatus: e.target.value as any })}
                className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-4 py-3 text-[#D8E1D9]"
              >
                <option value="single">Soltero/a</option>
                <option value="married">Casado/a</option>
                <option value="parent">Padre/Madre</option>
                <option value="family">Familia</option>
                <option value="widow">Viudo/a</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#B7F7AC] mb-2">Enfoque actual</label>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleFocus(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    profile.currentFocus?.includes(opt.id)
                      ? 'bg-[#00F511]/20 border-[#00F511] text-[#00F511]'
                      : 'border-[#00B10C]/40 text-[#D8E1D9]/70 hover:border-[#00F511]/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[#00F511] text-[#040404] font-semibold text-lg hover:bg-[#B7F7AC] transition-all disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Generar Devocional de Hoy'}
          </button>
        </div>

        {/* Result */}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/40 text-red-400 mb-6">
            {error}
          </div>
        )}

        {devotional && (
          <div className="glass rounded-2xl p-6 space-y-6 animate-in fade-in">
            <div className="text-center">
              <p className="text-xs tracking-widest text-[#00B10C] uppercase mb-1">
                {devotional.date} · +{devotional.points} Salvation
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#00F511] leading-tight">
                {devotional.title}
              </h2>
              {devotional.personalizedFor && (
                <p className="text-sm text-[#B7F7AC]/60 mt-1">
                  Personalizado para {devotional.personalizedFor}
                </p>
              )}
            </div>

            {/* Scripture */}
            <div className="bg-[#040404]/60 rounded-xl p-5 border border-[#00B10C]/20">
              <p className="text-sm text-[#00F511] mb-2 font-medium">
                {devotional.scripture.reference} · {devotional.scripture.version}
              </p>
              <p className="text-lg leading-relaxed italic text-[#D8E1D9]">
                “{devotional.scripture.text}”
              </p>
            </div>

            {/* Reflection */}
            <div>
              <h3 className="text-sm uppercase tracking-wider text-[#B7F7AC] mb-2">Reflexión</h3>
              <p className="leading-relaxed text-[#D8E1D9]/90">{devotional.reflection}</p>
            </div>

            {/* Prayer */}
            <div>
              <h3 className="text-sm uppercase tracking-wider text-[#B7F7AC] mb-2">Oración</h3>
              <p className="leading-relaxed text-[#D8E1D9]/90 italic">{devotional.prayer}</p>
            </div>

            {/* Action */}
            <div className="bg-[#00F511]/5 border border-[#00F511]/30 rounded-xl p-4">
              <h3 className="text-sm uppercase tracking-wider text-[#00F511] mb-2">Acción de hoy</h3>
              <p className="text-[#D8E1D9]">{devotional.action}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {devotional.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-xs border border-[#00B10C]/40 text-[#B7F7AC]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => {
                if (completed) return;
                logAction('devotional_complete');
                setCompleted(true);
              }}
              disabled={completed}
              className={`w-full py-3.5 rounded-xl border-2 font-medium transition-all ${
                completed
                  ? 'border-[#00B10C] text-[#B7F7AC] bg-[#00B10C]/10'
                  : 'border-[#00F511] text-[#00F511] hover:bg-[#00F511]/10'
              }`}
            >
              {(() => {
                const stage = profile.birthDate
                  ? getLifeStage(calculateAge(profile.birthDate))
                  : 'adult';
                const pts = getPointsForAction('devotional_complete', stage);
                return completed
                  ? `✓ Completado · +${pts} Salvation`
                  : `Marcar como completado · +${pts} Salvation`;
              })()}
            </button>
          </div>
        )}

        {!devotional && !loading && (
          <div className="text-center py-16 text-[#B7F7AC]/40">
            <p>Configura tu perfil y genera el devocional del día.</p>
            <p className="text-sm mt-2">El motor elige según tus focos, madurez y situación familiar.</p>
          </div>
        )}
        </div>
      </div>

      <BottomNav variant="default" />
    </div>
  );
}
