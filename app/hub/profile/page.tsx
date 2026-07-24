'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  loadProfileAsync,
  saveProfile,
  clearProfile,
  signOut,
  calculateAge,
  getLifeStage,
  getLifeStageLabel,
} from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<UserProfile>>({});
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const p = await loadProfileAsync();
      if (!p?.onboardingCompleted) {
        router.replace('/hub/onboarding');
        return;
      }
      setProfile(p);
      setDraft(p);
    })();
  }, [router]);

  const handleSave = async () => {
    if (!draft.name?.trim()) return;
    await saveProfile({ ...draft, onboardingCompleted: true });
    setProfile({ ...draft, onboardingCompleted: true });
    setEditing(false);
  };

  const handleClear = async () => {
    await signOut();
    router.replace('/');
  };

  if (!mounted || !profile) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#00F511] text-lg animate-pulse">El León se prepara...</div>
      </div>
    );
  }

  const age = profile.birthDate ? calculateAge(profile.birthDate) : null;
  const stage = getLifeStage(age);

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border border-[#00F511]/40 flex items-center justify-center lion-glow">
            <span className="text-lg">🦁</span>
          </div>
          <div>
            <p className="text-xs text-[#B7F7AC]/60">Salvazion</p>
            <p className="text-sm font-medium">Perfil</p>
          </div>
        </div>
        <Link href="/hub/dashboard" className="text-sm text-[#00F511]">
          ← Dashboard
        </Link>
      </header>

      <main className="flex-1 px-5 pt-6 pb-28 max-w-md mx-auto w-full">
        {/* Avatar + name */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-[#00F511]/50 flex items-center justify-center lion-glow bg-[#00F511]/5">
            <span className="text-4xl">🦁</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{profile.name || 'Hermano'}</h1>
          {age !== null && (
            <p className="text-sm text-[#B7F7AC]/70 mt-1">
              {age} años · {getLifeStageLabel(stage)}
            </p>
          )}
          {(profile as any)._integrityWarning && (
            <p className="text-xs text-amber-400 mt-2">
              ⚠ Datos de perfil podrían haber sido modificados externamente
            </p>
          )}
        </div>

        {/* Info card */}
        <div className="glass rounded-2xl p-5 space-y-4 mb-6">
          {!editing ? (
            <>
              <Row label="Propósito" value={profile.purpose || '—'} />
              <Row label="Ciudad" value={profile.city || '—'} />
              <Row label="País" value={profile.country || '—'} />
              <Row
                label="Madurez espiritual"
                value={
                  {
                    new: 'Nuevo en la fe',
                    growing: 'Creciendo',
                    mature: 'Maduro',
                    leader: 'Líder / Mentor',
                  }[profile.spiritualMaturity || 'growing'] || '—'
                }
              />
              <Row
                label="Familia"
                value={
                  {
                    single: 'Soltero/a',
                    married: 'Casado/a',
                    parent: 'Padre / Madre',
                    family: 'Familia',
                    widow: 'Viudo/a',
                  }[profile.familyStatus || 'family'] || '—'
                }
              />
              <Row
                label="Focos"
                value={(profile.currentFocus || []).join(', ') || '—'}
              />
              <button
                onClick={() => setEditing(true)}
                className="w-full mt-2 py-3 rounded-xl border border-[#00F511]/50 text-[#00F511] text-sm font-medium hover:bg-[#00F511]/10"
              >
                Editar perfil
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#B7F7AC] mb-1">Nombre</label>
                <input
                  type="text"
                  value={draft.name || ''}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00F511]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#B7F7AC] mb-1">Propósito</label>
                <textarea
                  value={draft.purpose || ''}
                  onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
                  rows={3}
                  className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00F511] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#B7F7AC] mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={draft.city || ''}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                    className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00F511]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#B7F7AC] mb-1">País</label>
                  <input
                    type="text"
                    value={draft.country || ''}
                    onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                    className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00F511]"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setDraft(profile);
                    setEditing(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[#00B10C]/50 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-[#00F511] text-[#040404] font-semibold text-sm"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy note */}
        <div className="glass rounded-2xl p-4 mb-6 text-xs text-[#B7F7AC]/70 leading-relaxed">
          <p className="font-medium text-[#00F511] mb-1">Privacidad y datos</p>
          <p>
            Tu perfil está protegido por Row Level Security de Supabase. Solo tú (auth.uid)
            puedes leer y escribir tus filas. El caché local acelera la app; la fuente de
            verdad es el servidor. Soberanía + sincronización.
          </p>
        </div>

        <button
          onClick={async () => {
            await signOut();
            router.replace('/');
          }}
          className="w-full mb-4 py-3 rounded-xl border border-[#00B10C]/40 text-[#B7F7AC] text-sm hover:border-[#00F511]/50"
        >
          Cerrar sesión
        </button>

        {/* Danger zone */}
        <div className="border border-red-500/30 rounded-2xl p-4">
          <p className="text-sm text-red-400/90 mb-3">Zona de peligro</p>
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10"
            >
              Borrar perfil y scores de este dispositivo
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-[#D8E1D9]/70">
                Esto elimina permanentemente tu perfil, acciones y rachas de este navegador.
                No hay recuperación.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-2 rounded-xl border border-[#00B10C]/40 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium"
                >
                  Confirmar borrado
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#040404]/95 border-t border-[#00B10C]/25 backdrop-blur-md px-6 py-3">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavItem href="/hub/dashboard" label="Home" icon="🏠" />
          <NavItem href="/hub/bible" label="Bible" icon="📖" />
          <NavItem href="/hub/health" label="Health" icon="⚡" />
          <NavItem href="/hub/freedom" label="Freedom" icon="📚" />
          <NavItem href="/hub/profile" label="Profile" icon="👤" active />
        </div>
      </nav>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-[#B7F7AC]/60 shrink-0">{label}</span>
      <span className="text-right text-[#D8E1D9] line-clamp-2">{value}</span>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5">
      <span className={`text-xl ${active ? 'opacity-100' : 'opacity-50'}`}>{icon}</span>
      <span className={`text-[10px] ${active ? 'text-[#00F511]' : 'text-[#B7F7AC]/50'}`}>
        {label}
      </span>
    </Link>
  );
}
