'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserProfile, LinkedProfile } from '@/lib/types';
import { saveProfile, calculateAge, getLifeStage, getLifeStageLabel } from '@/lib/store/profile';

type Step = 1 | 2 | 3 | 4 | 5;

const FOCUS_OPTIONS = [
  { id: 'fe', label: 'Fe' },
  { id: 'familia', label: 'Familia' },
  { id: 'proposito', label: 'Propósito' },
  { id: 'salud', label: 'Salud' },
  { id: 'libertad', label: 'Libertad' },
  { id: 'oracion', label: 'Oración' },
  { id: 'liderazgo', label: 'Liderazgo' },
  { id: 'perseverancia', label: 'Perseverancia' }
];

const RELATION_OPTIONS: { id: LinkedProfile['relation']; label: string }[] = [
  { id: 'spouse', label: 'Esposa / Cónyuge' },
  { id: 'child', label: 'Hijos' },
  { id: 'family', label: 'Familia extendida' },
  { id: 'friend', label: 'Amigos cercanos' },
  { id: 'faith_community', label: 'Comunidad de fe' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    language: 'es',
    purpose: '',
    city: '',
    country: '',
    birthDate: '',
    spiritualMaturity: 'growing',
    familyStatus: 'family',
    currentFocus: [],
    familyLinks: [],
    friendsLinks: [],
    hasAcceptedLionCoach: false,
    onboardingCompleted: false,
    preferredBibleVersion: 'rv1960'
  });

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRelation, setInviteRelation] = useState<LinkedProfile['relation'] | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  const update = (fields: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...fields }));
  };

  const toggleFocus = (id: string) => {
    const current = profile.currentFocus || [];
    if (current.includes(id)) {
      update({ currentFocus: current.filter(t => t !== id) });
    } else {
      update({ currentFocus: [...current, id] });
    }
  };

  const openInvite = (relation: LinkedProfile['relation']) => {
    setInviteRelation(relation);
    setInviteName('');
    setInviteCopied(false);
    setInviteOpen(true);
  };

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteRelation(null);
    setInviteName('');
    setInviteCopied(false);
  };

  const addLinkedMember = () => {
    if (!inviteRelation || !inviteName.trim()) return;
    const newLink: LinkedProfile = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `link_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name: inviteName.trim(),
      relation: inviteRelation,
      status: 'invited',
    };
    const isFamily = ['spouse', 'child', 'family'].includes(inviteRelation);
    if (isFamily) {
      const current = profile.familyLinks || [];
      update({ familyLinks: [...current, newLink] });
    } else {
      const current = profile.friendsLinks || [];
      update({ friendsLinks: [...current, newLink] });
    }
    closeInvite();
  };

  const shareInvite = async () => {
    const relationLabel =
      RELATION_OPTIONS.find((r) => r.id === inviteRelation)?.label || 'tu círculo';
    const text = `¡Únete a mi Phalanx en Salvazion!

Estoy construyendo Salvation, Health y Freedom con el León Verde. Quiero que formes parte de mi círculo (${relationLabel}).

Descarga / entra a la app y crecemos juntos en fe, familia y virtud.

https://salvazion.com

#Salvazion #Phalanx #GreenLionKings`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Únete a mi Phalanx — Salvazion',
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2500);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2500);
      } catch {}
    }
  };

  const next = () => setStep(s => Math.min(5, s + 1) as Step);
  const back = () => setStep(s => Math.max(1, s - 1) as Step);

  const finish = async () => {
    const finalProfile = {
      ...profile,
      hasAcceptedLionCoach: true,
      onboardingCompleted: true,
    };
    await saveProfile(finalProfile);
    router.push('/hub/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col" style={{ colorScheme: 'dark' }}>
      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-[#00F511]' : 'bg-[#00B10C]/30'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-[#B7F7AC]/50 mt-2 text-right">Paso {step} de 5</p>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        {/* STEP 1 — Bienvenida + Nombre + Propósito + Ubicación */}
        {step === 1 && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center pt-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full border border-[#00F511]/50 flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
                <Image src="/logo-icon.png" alt="Salvazion" width={80} height={80} className="object-cover" />
              </div>
              <h1 className="text-3xl font-bold text-[#00F511] tracking-tight">
                Bienvenido a la Phalanx
              </h1>
              <p className="text-[#B7F7AC]/80 mt-2 text-sm">
                Únete a la Salvación. Únete a la Salud. Únete a la Libertad.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#B7F7AC] mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={e => update({ name: e.target.value })}
                  placeholder="Tu nombre completo"
                  className="w-full bg-[#040404] text-[#D8E1D9] border border-[#00B10C]/40 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00F511] placeholder:text-[#B7F7AC]/40"
                />
              </div>

              <div>
                <label className="block text-sm text-[#B7F7AC] mb-1.5">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={profile.birthDate || ''}
                  onChange={e => update({ birthDate: e.target.value })}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-[#040404] text-[#D8E1D9] border border-[#00B10C]/40 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00F511]"
                />
                <p className="text-[11px] text-[#B7F7AC]/40 mt-1">
                  Nos permite personalizar tu experiencia según tu etapa de vida.
                </p>
              </div>

              <div>
                <label className="block text-sm text-[#B7F7AC] mb-1.5">Propósito de vida</label>
                <textarea
                  value={profile.purpose || ''}
                  onChange={e => update({ purpose: e.target.value })}
                  placeholder="¿Para qué estás en este mundo? ¿Qué legado quieres dejar?"
                  rows={3}
                  className="w-full bg-[#040404] text-[#D8E1D9] border border-[#00B10C]/40 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00F511] resize-none placeholder:text-[#B7F7AC]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#B7F7AC] mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    value={profile.city || ''}
                    onChange={e => update({ city: e.target.value })}
                    placeholder="Ciudad"
                    className="w-full bg-[#040404] text-[#D8E1D9] border border-[#00B10C]/40 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00F511] placeholder:text-[#B7F7AC]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#B7F7AC] mb-1.5">País</label>
                  <input
                    type="text"
                    value={profile.country || ''}
                    onChange={e => update({ country: e.target.value })}
                    placeholder="País"
                    className="w-full bg-[#040404] text-[#D8E1D9] border border-[#00B10C]/40 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00F511] placeholder:text-[#B7F7AC]/40"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={next}
              disabled={!profile.name || !profile.purpose || !profile.birthDate}
              className="w-full py-4 rounded-xl bg-[#00F511] text-[#040404] font-semibold text-lg disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        )}

        {/* STEP 2 — Madurez, Familia, Focos */}
        {step === 2 && (
          <div className="space-y-6 max-w-md mx-auto pt-4">
            <h2 className="text-2xl font-bold text-[#00F511]">Tu perfil espiritual</h2>

            <div>
              <label className="block text-sm text-[#B7F7AC] mb-1.5">Madurez espiritual</label>
              <select
                value={profile.spiritualMaturity}
                onChange={e => update({ spiritualMaturity: e.target.value as any })}
                className="w-full bg-[#040404] text-[#D8E1D9] border border-[#00B10C]/40 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00F511]"
              >
                <option value="new">Nuevo en la fe</option>
                <option value="growing">Creciendo</option>
                <option value="mature">Maduro</option>
                <option value="leader">Líder / Mentor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#B7F7AC] mb-1.5">Situación familiar</label>
              <select
                value={profile.familyStatus}
                onChange={e => update({ familyStatus: e.target.value as any })}
                className="w-full bg-[#040404] text-[#D8E1D9] border border-[#00B10C]/40 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00F511]"
              >
                <option value="single">Soltero/a</option>
                <option value="married">Casado/a</option>
                <option value="parent">Padre / Madre</option>
                <option value="family">Familia</option>
                <option value="widow">Viudo/a</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#B7F7AC] mb-2">¿En qué te quieres enfocar ahora?</label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => toggleFocus(opt.id)}
                    className={`px-3.5 py-2 rounded-full text-sm border transition-all ${
                      profile.currentFocus?.includes(opt.id)
                        ? 'bg-[#00F511]/20 border-[#00F511] text-[#00F511]'
                        : 'border-[#00B10C]/40 text-[#D8E1D9]/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={back} className="flex-1 py-3.5 rounded-xl border border-[#00B10C]/50">
                Atrás
              </button>
              <button
                onClick={next}
                className="flex-1 py-3.5 rounded-xl bg-[#00F511] text-[#040404] font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Vincular Familia y Amigos */}
        {step === 3 && (
          <div className="space-y-6 max-w-md mx-auto pt-4">
            <div>
              <h2 className="text-2xl font-bold text-[#00F511]">Tu Phalanx Personal</h2>
              <p className="text-[#B7F7AC]/70 text-sm mt-1">
                Vincula a tu familia y amigos dentro de Salvazion. Juntos son más fuertes.
              </p>
            </div>

            <div className="space-y-3">
              {RELATION_OPTIONS.map((rel) => {
                const links = [
                  ...(profile.familyLinks || []),
                  ...(profile.friendsLinks || []),
                ].filter((l) => l.relation === rel.id);
                return (
                  <div
                    key={rel.id}
                    className="glass rounded-xl px-4 py-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span>{rel.label}</span>
                      <button
                        onClick={() => openInvite(rel.id)}
                        className="px-4 py-1.5 rounded-lg border border-[#00F511]/50 text-[#00F511] text-sm hover:bg-[#00F511]/10"
                      >
                        Invitar
                      </button>
                    </div>
                    {links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {links.map((l) => (
                          <span
                            key={l.id}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-[#00F511]/10 border border-[#00F511]/30 text-[#B7F7AC]"
                          >
                            {l.name} · {l.status === 'invited' ? 'invitado' : l.status}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[#B7F7AC]/40 text-center">
              Podrás completar o editar estos vínculos más adelante desde tu perfil.
            </p>

            <div className="flex gap-3 pt-2">
              <button onClick={back} className="flex-1 py-3.5 rounded-xl border border-[#00B10C]/50">
                Atrás
              </button>
              <button
                onClick={next}
                className="flex-1 py-3.5 rounded-xl bg-[#00F511] text-[#040404] font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {inviteOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md glass rounded-2xl p-5 border border-[#00F511]/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#00F511]">
                  Invitar · {RELATION_OPTIONS.find((r) => r.id === inviteRelation)?.label}
                </h3>
                <button
                  onClick={closeInvite}
                  className="text-[#B7F7AC]/60 text-sm hover:text-[#00F511]"
                >
                  Cerrar
                </button>
              </div>

              <div>
                <label className="block text-sm text-[#B7F7AC] mb-1.5">Nombre de la persona</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ej: María, Juan, etc."
                  autoFocus
                  className="w-full bg-[#040404] text-[#D8E1D9] border border-[#00B10C]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00F511] placeholder:text-[#B7F7AC]/40"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={addLinkedMember}
                  disabled={!inviteName.trim()}
                  className="w-full py-3 rounded-xl bg-[#00F511] text-[#040404] font-semibold disabled:opacity-40"
                >
                  Agregar a mi Phalanx
                </button>
                <button
                  onClick={shareInvite}
                  className="w-full py-3 rounded-xl border border-[#00F511]/50 text-[#00F511] font-medium hover:bg-[#00F511]/10"
                >
                  {inviteCopied ? '✓ Mensaje copiado' : 'Compartir invitación'}
                </button>
              </div>

              <p className="text-[11px] text-[#B7F7AC]/40 text-center leading-relaxed">
                Por ahora los vínculos se guardan en este dispositivo. Pronto podrás
                conectarlos de verdad dentro de la Phalanx.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4 — Resumen rápido */}
        {step === 4 && (
          <div className="space-y-6 max-w-md mx-auto pt-4">
            <h2 className="text-2xl font-bold text-[#00F511]">Confirma tu identidad</h2>
            <div className="glass rounded-2xl p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#B7F7AC]/60">Nombre</span>
                <span>{profile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B7F7AC]/60">Edad / Etapa</span>
                <span>
                  {profile.birthDate
                    ? `${calculateAge(profile.birthDate) ?? '—'} años · ${getLifeStageLabel(getLifeStage(calculateAge(profile.birthDate)))}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B7F7AC]/60">Propósito</span>
                <span className="text-right max-w-[60%]">{profile.purpose?.slice(0, 40)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B7F7AC]/60">Ubicación</span>
                <span>{profile.city}, {profile.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B7F7AC]/60">Focos</span>
                <span>{profile.currentFocus?.join(', ')}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={back} className="flex-1 py-3.5 rounded-xl border border-[#00B10C]/50">
                Atrás
              </button>
              <button
                onClick={next}
                className="flex-1 py-3.5 rounded-xl bg-[#00F511] text-[#040404] font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 — León Verde Coach */}
        {step === 5 && (
          <div className="space-y-6 max-w-md mx-auto pt-2 text-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Conoce a tu <span className="text-[#00F511]">León Verde</span>
              </h2>
              <p className="text-[#B7F7AC]/80 mt-1">Tu coach de virtud y desarrollo integral</p>
            </div>

            {/* Lion visual */}
            <div className="relative mx-auto w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#00F511]/20 animate-pulse" />
              <div className="absolute inset-4 rounded-full border border-[#00B10C]/30" />
              <div className="w-36 h-36 rounded-full overflow-hidden lion-glow flex items-center justify-center bg-[#040404] border border-[#00F511]/40">
                <Image src="/logo-icon.png" alt="León Verde" width={144} height={144} className="object-cover" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="glass rounded-xl p-3">
                <p className="text-[#00F511] text-xs font-medium mb-1">Espiritual</p>
                <p className="text-sm">Biblia · Oración · Devocional</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[#00F511] text-xs font-medium mb-1">Físico</p>
                <p className="text-sm">Salud · Disciplina · Cuerpo</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[#00F511] text-xs font-medium mb-1">Mental</p>
                <p className="text-sm">Propósito · Libertad · Enfoque</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[#00F511] text-xs font-medium mb-1">Virtud</p>
                <p className="text-sm">Constancia · Excelencia</p>
              </div>
            </div>

            <p className="text-sm text-[#D8E1D9]/80 leading-relaxed px-2">
              Te entrenaré en virtud, constancia y excelencia para que{' '}
              <span className="text-[#00F511]">Salvation, Health y Freedom</span> crezcan cada día.
            </p>

            <p className="text-[11px] text-[#B7F7AC]/50 leading-relaxed px-1">
              Tus datos viven solo en este dispositivo. No enviamos perfil ni scores a ningún servidor
              todavía. Soberanía primero.
            </p>

            <button
              onClick={finish}
              className="w-full py-4 rounded-xl bg-[#00F511] text-[#040404] font-semibold text-lg shadow-[0_0_20px_rgba(0,245,17,0.3)]"
            >
              Acepto el llamado
            </button>

            <button onClick={back} className="text-sm text-[#B7F7AC]/50">
              Atrás
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
