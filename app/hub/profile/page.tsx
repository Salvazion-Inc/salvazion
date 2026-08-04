'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import {
  loadProfile,
  loadProfileAsync,
  refreshProfileFromServer,
  saveProfile,
  signOut,
  calculateAge,
  getLifeStage,
  getLifeStageLabel,
  subscribeProfileUpdated,
} from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import BillingCard from '@/components/billing/BillingCard';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ClinicalRecordPanel from '@/components/health/ClinicalRecordPanel';
import PhoneSensorsPanel from '@/components/health/PhoneSensorsPanel';
import WearablesPanel from '@/components/health/WearablesPanel';
import CloudNativeSyncPanel from '@/components/health/CloudNativeSyncPanel';
import TextScaleControl from '@/components/settings/TextScaleControl';
import ThemeControl from '@/components/settings/ThemeControl';
import LanguageControl from '@/components/settings/LanguageControl';
import { useI18n } from '@/components/I18nProvider';
import XLogo, { textWithXLogo } from '@/components/ui/XLogo';
import { useFlashToast } from '@/components/ui/FlashToast';
import {
  loadLinkedWallet,
  subscribeLinkedWallet,
  type LinkedWallet,
} from '@/lib/solana/wallet-store';
import { formatSalvazion } from '@/lib/solana/balances';
import { shortenAddress } from '@/lib/solana/config';
import { logAction, computeScores } from '@/lib/scoring/engine';

export default function ProfilePage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { flash, toast: saveToast } = useFlashToast();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState<Partial<UserProfile>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState<LinkedWallet | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggedHealthToday, setLoggedHealthToday] = useState<Set<string>>(
    () => new Set()
  );
  /** Avoid clobbering open edit draft when async profile refresh lands. */
  const editingRef = useRef(false);

  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  useEffect(() => {
    // Defer client-only reads so React 19 lint doesn't flag sync setState-in-effect.
    const bootId = requestAnimationFrame(() => {
      setLinkedWallet(loadLinkedWallet());
      try {
        const sp = new URLSearchParams(window.location.search);
        if (
          sp.has('wearable_connected') ||
          sp.has('wearable_error') ||
          sp.get('tab') === 'wearables' ||
          sp.get('settings') === '1'
        ) {
          setShowSettings(true);
        }
      } catch {
        // ignore
      }
      try {
        const scores = computeScores();
        setLoggedHealthToday(
          new Set(
            scores.todayActions
              .filter((a) => a.pillar === 'health')
              .map((a) => a.type)
          )
        );
      } catch {
        // ignore
      }
    });

    const unsubWallet = subscribeLinkedWallet(setLinkedWallet);
    const unsubProfile = subscribeProfileUpdated(() => {
      const p = loadProfile();
      if (!p) return;
      setProfile(p);
      setDraft((d) => ({ ...d, avatarUrl: p.avatarUrl }));
    });

    const pullServer = async () => {
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
      setDraft((d) =>
        editingRef.current ? { ...d, avatarUrl: p.avatarUrl } : p
      );
    };

    void pullServer();

    const onResume = () => {
      void refreshProfileFromServer().then((p) => {
        if (!p?.onboardingCompleted) return;
        setProfile(p);
        setDraft((d) => ({ ...d, avatarUrl: p.avatarUrl }));
      });
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') onResume();
    };
    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(bootId);
      unsubWallet();
      unsubProfile();
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [router]);

  const handleWearableAutoLog = useCallback((actionType: string) => {
    const result = logAction(actionType);
    if (result) {
      setLoggedHealthToday(
        new Set(
          result.todayActions
            .filter((a) => a.pillar === 'health')
            .map((a) => a.type)
        )
      );
      flash(t('common.changesSaved'));
    }
  }, [flash, t]);

  const handleSave = async () => {
    if (!draft.name?.trim() || saving) return;
    setSaving(true);
    try {
      await saveProfile({ ...draft, onboardingCompleted: true });
      setProfile({ ...draft, onboardingCompleted: true });
      setEditing(false);
      flash(t('common.changesSaved'));
    } finally {
      setSaving(false);
    }
  };

  const profileDirty =
    editing &&
    !!profile &&
    (draft.name !== profile.name ||
      draft.purpose !== profile.purpose ||
      draft.city !== profile.city ||
      draft.country !== profile.country);

  const handleClear = async () => {
    await signOut();
    router.replace('/');
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--true-black)] flex items-center justify-center">
        <div className="text-[var(--accent)] text-lg animate-pulse" aria-live="polite">
          {t('common.lionPreparing')}
        </div>
      </div>
    );
  }

  const age = profile.birthDate ? calculateAge(profile.birthDate) : null;
  const stage = getLifeStage(age);

  return (
    <div className="min-h-screen bg-[var(--true-black)] text-[var(--off-white)] flex flex-col">
      {saveToast}
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[var(--true-black)]">
            <Image src="/logo-icon.png" alt="Salvazion" width={40} height={40} className="object-cover" />
          </div>
          <div>
            <p className="text-xs text-[var(--sage)]">Salvazion</p>
            <p className="text-sm font-medium">{t('profile.title')}</p>
          </div>
        </div>
        <Link href="/hub/dashboard" className="text-sm text-[var(--accent)]">
          ← {t('nav.dashboard')}
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
          {profile.xUsername && (
            <a
              href={`https://x.com/${profile.xUsername.replace(/^@+/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-1.5 text-sm font-medium text-[#8FD99A] hover:underline"
            >
              <XLogo className="w-3.5 h-3.5 shrink-0 opacity-90" />
              @{profile.xUsername.replace(/^@+/, '')}
            </a>
          )}
          {email && (
            <p className="text-xs text-[var(--sage)]/80 mt-1 break-all">{email}</p>
          )}
          {age !== null && (
            <p className="text-sm text-[var(--sage)] mt-1">
              {age} {t('profile.years')} · {getLifeStageLabel(stage, lang)}
            </p>
          )}
          {typeof linkedWallet?.salvazionBalance === 'number' && (
            <div className="mt-3 inline-flex flex-col items-center gap-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#8FD99A]/40 bg-[#8FD99A]/10">
                <span className="text-[10px] uppercase tracking-wider text-[var(--sage)]">
                  {t('wallet.holdings')}
                </span>
                <span className="text-sm font-semibold text-[#8FD99A] font-mono">
                  {formatSalvazion(linkedWallet.salvazionBalance)}
                </span>
              </div>
              {linkedWallet.address && (
                <p className="text-[10px] font-mono text-[var(--sage)]/70">
                  {shortenAddress(linkedWallet.address, 4)}
                  {linkedWallet.salvazionSource
                    ? ` · ${
                        linkedWallet.salvazionSource === 'onchain'
                          ? t('wallet.sourceOnchain')
                          : t('wallet.sourceManual')
                      }`
                    : ''}
                </p>
              )}
            </div>
          )}
          {profile._integrityWarning && (
            <p className="text-xs text-amber-400 mt-2">
              ⚠ Datos de perfil podrían haber sido modificados externamente
            </p>
          )}
        </div>

        {/* Info card */}
        <div className="glass rounded-2xl p-5 space-y-4 mb-6">
          {!editing ? (
            <>
              {email && <Row label={t('profile.email')} value={email} />}
              {profile.xUsername && (
                <Row
                  label={textWithXLogo(t('profile.xUsername'))}
                  value={`@${profile.xUsername.replace(/^@+/, '')}`}
                />
              )}
              <Row label={t('profile.purpose')} value={profile.purpose || '—'} />
              <Row
                label={t('profile.location')}
                value={
                  [profile.city, profile.country].filter(Boolean).join(', ') || '—'
                }
              />
              <Row
                label={t('profile.spiritualMaturity')}
                value={
                  t(`profile.maturity.${profile.spiritualMaturity || 'growing'}`)
                }
              />
              <Row
                label={t('profile.family')}
                value={t(`profile.familyStatus.${profile.familyStatus || 'family'}`)}
              />
              <Row
                label={t('profile.focus')}
                value={(profile.currentFocus || []).join(', ') || '—'}
              />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn-secondary"
                >
                  {t('profile.editProfile')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="btn-secondary"
                >
                  {t('settings.open')}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--sage)] mb-1">Nombre</label>
                <input
                  type="text"
                  value={draft.name || ''}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#8FD99A]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--sage)] mb-1">Propósito</label>
                <textarea
                  value={draft.purpose || ''}
                  onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
                  rows={3}
                  className="w-full bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#8FD99A] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--sage)] mb-1">
                  {t('profile.location')}
                </label>
                <input
                  type="text"
                  value={[draft.city, draft.country].filter(Boolean).join(', ')}
                  onChange={(e) => {
                    const parts = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const city = parts[0] || '';
                    const country = parts.slice(1).join(', ');
                    setDraft({ ...draft, city, country });
                  }}
                  placeholder={t('profile.locationPlaceholder')}
                  className="w-full bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#8FD99A]"
                />
              </div>
              {profileDirty && (
                <p className="text-[11px] text-[var(--accent)]">
                  {t('common.unsavedChanges')}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(profile);
                    setEditing(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-strong)] text-sm"
                  disabled={saving}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className="btn-primary flex-1 py-2.5 text-sm"
                  disabled={saving || !draft.name?.trim()}
                >
                  {saving
                    ? t('common.loading')
                    : profileDirty
                      ? t('common.saveChanges')
                      : t('common.save')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clinical FHIR export lives on Profile (identity + data portability), not Health tabs */}
        <ClinicalRecordPanel
          profile={profile}
          lang={lang === 'en' ? 'en' : 'es'}
        />

        {/* Premium subscription */}
        <div className="mb-6">
          <BillingCard />
        </div>

        {/* Solana wallet + $SALVAZION amount on profile */}
        <div className="mb-6">
          <WalletConnectCard
            onSalvazionChange={() => setLinkedWallet(loadLinkedWallet())}
          />
        </div>

        {/* Privacy note */}
        <div className="glass rounded-2xl p-4 mb-6 text-xs text-[var(--sage)] leading-relaxed">
          <p className="font-medium text-[var(--accent)] mb-1">{t('profile.privacyTitle')}</p>
          <p>{t('profile.privacyBody')}</p>
        </div>

        <button
          onClick={async () => {
            await signOut();
            router.replace('/');
          }}
          className="w-full mb-4 py-3 rounded-xl border border-[var(--border-soft)] text-[var(--sage)] text-sm hover:border-[var(--border-strong)]"
        >
          {t('profile.signOut')}
        </button>

        {/* Danger zone */}
        <div className="border border-red-500/30 rounded-2xl p-4">
          <p className="text-sm text-red-400/90 mb-3">{t('profile.dangerZone')}</p>
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10"
            >
              {t('profile.clearLocal')}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-[#D8E1D9]/70">{t('profile.clearConfirm')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-2 rounded-xl border border-[var(--border-soft)] text-sm"
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

      {/* Settings panel (separate from profile body) */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[60] bg-[var(--true-black)] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-dialog-title"
        >
          <header className="page-header flex items-center gap-3 px-5 pt-6 pb-3">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="back-btn"
              aria-label={t('common.back')}
            >
              ←
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
                {t('settings.section')}
              </p>
              <h2
                id="settings-dialog-title"
                className="text-lg font-semibold text-[var(--accent)]"
              >
                {t('settings.title')}
              </h2>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4 pb-10 space-y-4 max-w-md mx-auto w-full">
            <p className="text-xs text-[var(--sage)]/80">{t('settings.subtitle')}</p>
            <ThemeControl />
            <LanguageControl />
            <TextScaleControl />

            <section className="pt-4 mt-2 border-t border-[var(--border-soft)] space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--accent)]">
                  {lang === 'en' ? 'Wearables & sensors' : 'Wearables y sensores'}
                </h3>
                <p className="text-[11px] text-[var(--sage)]/80 mt-1 leading-relaxed">
                  {lang === 'en'
                    ? 'Phone sensors, BLE devices, and cloud health sync. Connect once; Health Hub uses the data for scores.'
                    : 'Sensores del teléfono, dispositivos BLE y sincronización cloud. Conéctalos aquí; Health Hub usa los datos para el score.'}
                </p>
              </div>
              <PhoneSensorsPanel
                loggedToday={loggedHealthToday}
                onAutoLog={handleWearableAutoLog}
              />
              <WearablesPanel onAutoLog={handleWearableAutoLog} />
              <Suspense
                fallback={
                  <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] text-sm text-[var(--sage)] animate-pulse">
                    {lang === 'en'
                      ? 'Loading cloud sync…'
                      : 'Cargando sincronización cloud…'}
                  </div>
                }
              >
                <CloudNativeSyncPanel onAutoLog={handleWearableAutoLog} />
              </Suspense>
            </section>

            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="btn-primary mt-2"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      <BottomNav variant="default" />
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: ReactNode;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-[var(--sage)] shrink-0 inline-flex items-center gap-1">
        {label}
      </span>
      <span className="text-right text-[#D8E1D9] line-clamp-2">{value}</span>
    </div>
  );
}
