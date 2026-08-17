'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { isBusinessAdminEmail } from '@/lib/business/access';

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
  const displayName =
    profile.name ||
    (lang === 'en' ? 'Brother' : lang === 'pt' ? 'Irmão' : 'Hermano');
  const xHandle = profile.xUsername?.replace(/^@+/, '') || '';
  const locationLine = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-[100dvh] bg-[var(--true-black)] text-[var(--off-white)] flex flex-col">
      {saveToast}

      {/* Sticky chrome — back + title (X profile top bar) */}
      <header className="sheet-topbar sticky top-0 z-40 px-4 sm:px-5">
        <Link
          href="/hub/dashboard"
          className="back-btn shrink-0"
          aria-label={t('common.back')}
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-bold text-white leading-tight truncate">
            {displayName}
          </h1>
          <p className="text-[11px] text-[var(--sage)] truncate">
            {t('profile.title')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="profile-action-btn shrink-0 !min-h-[2.1rem] !px-3 text-[12px]"
          aria-label={t('settings.open')}
        >
          {t('settings.open')}
        </button>
      </header>

      <main className="flex-1 pb-28 w-full max-w-lg mx-auto">
        <section className="profile-hero mb-1">
          <div className="profile-hero-body">
            <div className="flex items-end justify-between gap-3">
              <div className="profile-hero-avatar">
                <ProfileAvatar
                  avatarUrl={profile.avatarUrl}
                  name={displayName}
                  editable
                  size="xl"
                  onChange={(url) => {
                    setProfile((p) => (p ? { ...p, avatarUrl: url } : p));
                    setDraft((d) => ({ ...d, avatarUrl: url }));
                  }}
                />
              </div>
              <div className="profile-hero-actions pb-1">
                {!editing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="profile-action-btn profile-action-btn-primary"
                    >
                      {t('profile.editProfile')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      className="profile-action-btn"
                    >
                      {t('settings.open')}
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
                {displayName}
              </h2>
              {xHandle ? (
                <a
                  href={`https://x.com/${xHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-0.5 text-[14px] text-[var(--sage)] hover:text-[var(--accent)] transition-colors"
                >
                  <XLogo className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  @{xHandle}
                </a>
              ) : email ? (
                <p className="text-[13px] text-[var(--sage)] mt-0.5 break-all">
                  {email}
                </p>
              ) : null}
            </div>

            {profile.purpose ? (
              <p className="profile-bio">{profile.purpose}</p>
            ) : null}

            <div className="profile-meta-row">
              {locationLine ? (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden>📍</span>
                  {locationLine}
                </span>
              ) : null}
              {age !== null ? (
                <span>
                  {age} {t('profile.years')} · {getLifeStageLabel(stage, lang)}
                </span>
              ) : null}
              {typeof linkedWallet?.salvazionBalance === 'number' ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[var(--accent)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--sage)] font-sans">
                    {t('wallet.holdings')}
                  </span>
                  {formatSalvazion(linkedWallet.salvazionBalance)}
                </span>
              ) : null}
            </div>

            {linkedWallet?.address ? (
              <p className="mt-1.5 text-[11px] font-mono text-[var(--sage)]/70">
                {shortenAddress(linkedWallet.address, 4)}
                {linkedWallet.salvazionSource
                  ? ` · ${
                      linkedWallet.salvazionSource === 'onchain'
                        ? t('wallet.sourceOnchain')
                        : t('wallet.sourceManual')
                    }`
                  : ''}
              </p>
            ) : null}

            {profile._integrityWarning ? (
              <p className="text-xs text-amber-400 mt-2">
                ⚠ Datos de perfil podrían haber sido modificados externamente
              </p>
            ) : null}
          </div>
        </section>

        {/* Underline tabs — Profile | Account (X profile tab language) */}
        <div
          className="tabs-x sticky z-30 bg-[var(--true-black)]/95 backdrop-blur-md px-0"
          style={{ top: 'calc(3.25rem + env(safe-area-inset-top, 0px))' }}
          role="tablist"
          aria-label={t('profile.title')}
        >
          <button
            type="button"
            role="tab"
            data-active={!editing ? 'true' : 'false'}
            aria-selected={!editing}
            onClick={() => setEditing(false)}
          >
            {t('profile.tabProfile')}
          </button>
          <button
            type="button"
            role="tab"
            data-active={editing ? 'true' : 'false'}
            aria-selected={editing}
            onClick={() => {
              setDraft(profile);
              setEditing(true);
            }}
          >
            {t('common.edit')}
          </button>
        </div>

        <div className="px-4 sm:px-5 pt-4 space-y-5">
          {/* Info / edit card */}
          <div className="settings-list">
            {!editing ? (
              <>
                {email ? (
                  <div className="settings-row">
                    <div className="settings-row-label">
                      {t('profile.email')}
                      <span className="settings-row-hint break-all">{email}</span>
                    </div>
                  </div>
                ) : null}
                {xHandle ? (
                  <div className="settings-row">
                    <div className="settings-row-label">
                      {textWithXLogo(t('profile.xUsername'))}
                      <span className="settings-row-hint">@{xHandle}</span>
                    </div>
                  </div>
                ) : null}
                <div className="settings-row">
                  <div className="settings-row-label">
                    {t('profile.purpose')}
                    <span className="settings-row-hint line-clamp-3">
                      {profile.purpose || '—'}
                    </span>
                  </div>
                </div>
                <div className="settings-row">
                  <span className="settings-row-label">{t('profile.location')}</span>
                  <span className="settings-row-value">{locationLine || '—'}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-row-label">
                    {t('profile.spiritualMaturity')}
                  </span>
                  <span className="settings-row-value">
                    {t(`profile.maturity.${profile.spiritualMaturity || 'growing'}`)}
                  </span>
                </div>
                <div className="settings-row">
                  <span className="settings-row-label">{t('profile.family')}</span>
                  <span className="settings-row-value">
                    {t(`profile.familyStatus.${profile.familyStatus || 'family'}`)}
                  </span>
                </div>
                <div className="settings-row">
                  <div className="settings-row-label">
                    {t('profile.focus')}
                    <span className="settings-row-hint">
                      {(profile.currentFocus || []).join(', ') || '—'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-[var(--sage)] mb-1">
                    {lang === 'en' ? 'Name' : lang === 'pt' ? 'Nome' : 'Nombre'}
                  </label>
                  <input
                    type="text"
                    value={draft.name || ''}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="input-soft w-full text-sm py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--sage)] mb-1">
                    {t('profile.purpose')}
                  </label>
                  <textarea
                    value={draft.purpose || ''}
                    onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
                    rows={3}
                    className="input-soft w-full text-sm py-2.5 resize-none"
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
                    className="input-soft w-full text-sm py-2.5"
                  />
                </div>
                {profileDirty && (
                  <p className="text-[11px] text-[var(--accent)]">
                    {t('common.unsavedChanges')}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(profile);
                      setEditing(false);
                    }}
                    className="profile-action-btn flex-1"
                    disabled={saving}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    className="profile-action-btn profile-action-btn-primary flex-1"
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

          {/* Quick settings entry — X list language */}
          <div className="settings-list">
            <button
              type="button"
              className="settings-row"
              onClick={() => setShowSettings(true)}
            >
              <div className="settings-row-label">
                {t('settings.open')}
                <span className="settings-row-hint">{t('settings.subtitle')}</span>
              </div>
              <span className="settings-row-chevron" aria-hidden>
                ›
              </span>
            </button>
          </div>

          {/* Clinical FHIR export lives on Profile (identity + data portability) */}
          <ClinicalRecordPanel
            profile={profile}
            lang={lang}
          />

          <BillingCard />

          <WalletConnectCard
            onSalvazionChange={() => setLinkedWallet(loadLinkedWallet())}
          />

          {/* Privacy note + legal */}
          <div className="card-soft p-4 text-xs text-[var(--sage)] leading-relaxed">
            <p className="font-medium text-[var(--accent)] mb-1">
              {t('profile.privacyTitle')}
            </p>
            <p>{t('profile.privacyBody')}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-[var(--border-soft)]">
              <Link
                href="/terms"
                className="text-[11px] font-medium text-[var(--accent)] hover:underline"
              >
                {lang === 'en'
                  ? 'Terms of Service'
                  : lang === 'pt'
                    ? 'Termos de Serviço'
                    : 'Términos de servicio'}
              </Link>
              <span className="text-[var(--sage)]/40" aria-hidden>
                ·
              </span>
              <Link
                href="/privacy"
                className="text-[11px] font-medium text-[var(--accent)] hover:underline"
              >
                {lang === 'en'
                  ? 'Privacy Policy'
                  : lang === 'pt'
                    ? 'Política de Privacidade'
                    : 'Política de privacidad'}
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.replace('/');
            }}
            className="w-full py-3 rounded-full border border-[var(--border-soft)] text-[var(--sage)] text-sm font-medium hover:border-[var(--border-strong)] hover:text-white transition"
          >
            {t('profile.signOut')}
          </button>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-500/30 p-4 mb-2">
            <p className="text-sm text-red-400/90 mb-3">{t('profile.dangerZone')}</p>
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full py-2.5 rounded-full border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition"
              >
                {t('profile.clearLocal')}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[#D8E1D9]/70">{t('profile.clearConfirm')}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 py-2 rounded-full border border-[var(--border-soft)] text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 py-2 rounded-full bg-red-600 text-white text-sm font-medium"
                  >
                    {lang === 'en'
                      ? 'Confirm delete'
                      : lang === 'pt'
                        ? 'Confirmar exclusão'
                        : 'Confirmar borrado'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {isBusinessAdminEmail(email) && (
            <Link
              href="/hub/business"
              className="card-soft block p-4 border border-[var(--border-strong)] hover:border-[var(--accent)]/50 transition group mb-2"
            >
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
                Salvazion, Inc.
              </p>
              <p className="text-sm font-semibold text-white group-hover:text-[var(--accent)] transition mt-0.5">
                {lang === 'en'
                  ? 'Business KPIs & funnel'
                  : lang === 'pt'
                    ? 'KPIs de negócio e funil'
                    : 'KPI de negocio y funnel'}
              </p>
              <p className="text-[11px] text-[var(--sage)] mt-1 leading-relaxed">
                {lang === 'en'
                  ? 'MRR, ARR, paid conversion, churn — operator only.'
                  : lang === 'pt'
                    ? 'MRR, ARR, conversão paga, churn — só operador.'
                    : 'MRR, ARR, conversión a pago, churn — solo operador.'}
              </p>
              <p className="text-[11px] text-[var(--accent)] mt-2 font-medium">
                {lang === 'en'
                  ? 'Open console →'
                  : lang === 'pt'
                    ? 'Abrir consola →'
                    : 'Abrir consola →'}
              </p>
            </Link>
          )}
        </div>
      </main>

      {/* Settings sheet — cleaner X 2026 list chrome */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[60] bg-[var(--true-black)] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-dialog-title"
        >
          <header className="sheet-topbar">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="back-btn"
              aria-label={t('common.back')}
            >
              ←
            </button>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
                {t('settings.section')}
              </p>
              <h2
                id="settings-dialog-title"
                className="text-[15px] font-bold text-white leading-tight"
              >
                {t('settings.title')}
              </h2>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto premium-scroll px-4 sm:px-5 py-4 pb-12 space-y-5 max-w-lg mx-auto w-full">
            <p className="text-xs text-[var(--sage)]/80">{t('settings.subtitle')}</p>

            <section className="space-y-2">
              <h3 className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--sage)] px-1">
                {t('settings.appearance')}
              </h3>
              <div className="space-y-3">
                <ThemeControl />
                <LanguageControl />
                <TextScaleControl />
              </div>
            </section>

            <section className="space-y-3">
              <div className="px-1">
                <h3 className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--sage)]">
                  {t('settings.devices')}
                </h3>
                <p className="text-[11px] text-[var(--sage)]/80 mt-1 leading-relaxed">
                  {t('settings.devicesHint')}
                </p>
              </div>
              <PhoneSensorsPanel
                loggedToday={loggedHealthToday}
                onAutoLog={handleWearableAutoLog}
              />
              <WearablesPanel onAutoLog={handleWearableAutoLog} />
              <Suspense
                fallback={
                  <div className="card-soft p-4 text-sm text-[var(--sage)] animate-pulse">
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
              className="btn-primary mt-1"
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


