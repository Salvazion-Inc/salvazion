'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import {
  loadProfileAsync,
  saveProfile,
  signOut,
  calculateAge,
  getLifeStage,
  getLifeStageLabel,
} from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<UserProfile>>({});
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
      } catch {
        // ignore — offline / missing env
      }

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
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border border-[#00F511]/50 flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="Salvazion" width={40} height={40} className="object-cover" />
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
          <ProfileAvatar
            avatarUrl={profile.avatarUrl}
            name={profile.name || 'Hermano'}
            editable
            size="xl"
            className="mb-1"
            onChange={(url) => {
              setProfile((p) => (p ? { ...p, avatarUrl: url } : p));
              setDraft((d) => ({ ...d, avatarUrl: url }));
            }}
          />
          <h1 className="text-2xl font-bold text-white mt-2">{profile.name || 'Hermano'}</h1>
          {email && (
            <p className="text-xs text-[#B7F7AC]/50 mt-1 break-all">{email}</p>
          )}
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
              {email && <Row label="Email" value={email} />}
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

        {/* Phalanx / Familia */}
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#00F511]">Tu Phalanx Personal</h3>
            <span className="text-[11px] text-[#B7F7AC]/50">
              {(profile.familyLinks?.length || 0) + (profile.friendsLinks?.length || 0)} vínculos
            </span>
          </div>
          {[...(profile.familyLinks || []), ...(profile.friendsLinks || [])].length === 0 ? (
            <p className="text-xs text-[#B7F7AC]/50 leading-relaxed">
              Aún no has invitado a nadie. Vuelve al onboarding o invita desde aquí pronto.
              La familia es el núcleo de la civilización occidental cristiana.
            </p>
          ) : (
            <div className="space-y-2">
              {[...(profile.familyLinks || []), ...(profile.friendsLinks || [])].map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-[#00B10C]/15 last:border-0"
                >
                  <div>
                    <span className="text-[#D8E1D9]">{l.name}</span>
                    <span className="text-[11px] text-[#B7F7AC]/50 ml-2">
                      {
                        {
                          spouse: 'Cónyuge',
                          child: 'Hijo/a',
                          family: 'Familia',
                          friend: 'Amigo/a',
                          faith_community: 'Comunidad de fe',
                        }[l.relation]
                      }
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#00F511]/30 text-[#B7F7AC]">
                    {l.status === 'invited' ? 'Invitado' : l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Solana wallet */}
        <div className="mb-6">
          <WalletConnectCard />
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

      <BottomNav variant="default" />
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
