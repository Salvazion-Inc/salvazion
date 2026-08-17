'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserProfile } from '@/lib/types';
import {
  saveProfile,
  loadProfile,
  loadProfileAsync,
  ensureProfileForUser,
  calculateAge,
  getLifeStage,
  getLifeStageLabel,
} from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';
import { saveValueJourneyDone } from '@/lib/freedom/x-articles';
import { defaultBibleVersion, isLanguage } from '@/lib/i18n/locale';

/** Slim onboarding: identity → focus → start (was 5 steps). */
type Step = 1 | 2 | 3;

const FOCUS_IDS = [
  'fe',
  'familia',
  'proposito',
  'salud',
  'libertad',
  'oracion',
  'liderazgo',
  'perseverancia',
] as const;

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const bootedRef = useRef(false);
  const profileRef = useRef<Partial<UserProfile>>({});
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    language: 'en',
    purpose: '',
    city: '',
    country: '',
    birthDate: '',
    sex: undefined,
    spiritualMaturity: 'growing',
    familyStatus: 'family',
    currentFocus: [],
    familyLinks: [],
    friendsLinks: [],
    hasAcceptedLionCoach: false,
    onboardingCompleted: false,
    preferredBibleVersion: 'kjv',
  });

  const focusLabel = (id: string) => {
    const map: Record<string, string> = {
      fe: t('onboarding.focusFe'),
      familia: t('onboarding.focusFamilia'),
      proposito: t('onboarding.focusProposito'),
      salud: t('onboarding.focusSalud'),
      libertad: t('onboarding.focusLibertad'),
      oracion: t('onboarding.focusOracion'),
      liderazgo: t('onboarding.focusLiderazgo'),
      perseverancia: t('onboarding.focusPerseverancia'),
    };
    return map[id] || id;
  };

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        await ensureProfileForUser();
        const existing = await loadProfileAsync();
        if (cancelled) return;
        if (existing?.onboardingCompleted) {
          router.replace('/hub/dashboard');
          return;
        }
        if (existing && Object.keys(existing).length > 0) {
          setProfile((prev) => ({
            ...prev,
            ...existing,
            name: prev.name?.trim() || existing.name || '',
            birthDate: prev.birthDate || existing.birthDate || '',
            sex: prev.sex || existing.sex,
            purpose: prev.purpose || existing.purpose || '',
            currentFocus:
              (prev.currentFocus && prev.currentFocus.length > 0
                ? prev.currentFocus
                : existing.currentFocus) || [],
            language: isLanguage(existing.language) ? existing.language : lang,
            preferredBibleVersion:
              existing.preferredBibleVersion || defaultBibleVersion(lang),
            onboardingCompleted: false,
            hasAcceptedLionCoach: existing.hasAcceptedLionCoach ?? false,
          }));
        } else {
          setProfile((prev) => ({
            ...prev,
            language: lang,
            preferredBibleVersion: defaultBibleVersion(lang),
          }));
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, lang]);

  const update = (fields: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...fields }));
  };

  const persistDraft = async (extra?: Partial<UserProfile>) => {
    if (loadProfile().onboardingCompleted) return;
    const next = { ...profileRef.current, ...extra };
    delete next.onboardingCompleted;
    try {
      await saveProfile(next);
    } catch {
      /* local write already happened inside saveProfile */
    }
  };

  const toggleFocus = (id: string) => {
    const current = profile.currentFocus || [];
    if (current.includes(id)) {
      update({ currentFocus: current.filter((x) => x !== id) });
    } else {
      update({ currentFocus: [...current, id] });
    }
  };

  const next = () => {
    void persistDraft();
    setStep((s) => Math.min(TOTAL_STEPS, s + 1) as Step);
  };
  const back = () => setStep((s) => Math.max(1, s - 1) as Step);

  const canContinueStep1 =
    !!profile.name?.trim() &&
    !!profile.birthDate &&
    (profile.sex === 'male' || profile.sex === 'female');

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const purpose =
        profile.purpose?.trim() ||
        (lang === 'es'
          ? 'Creciendo en Salvation, Health y Freedom cada día.'
          : lang === 'pt'
            ? 'Crescendo em Salvation, Health e Freedom todos os dias.'
            : 'Growing in Salvation, Health, and Freedom every day.');
      const payload: Partial<UserProfile> = {
        ...profileRef.current,
        ...profile,
        purpose,
        language: lang,
        preferredBibleVersion:
          profile.preferredBibleVersion || defaultBibleVersion(lang),
        spiritualMaturity: profile.spiritualMaturity || 'growing',
        familyStatus: profile.familyStatus || 'family',
        hasAcceptedLionCoach: true,
        onboardingCompleted: true,
      };
      await saveProfile(payload);
      const confirmed = loadProfile();
      if (!confirmed.onboardingCompleted) {
        await saveProfile({ ...payload, onboardingCompleted: true });
      }
      saveValueJourneyDone();
      router.push('/hub/dashboard');
    } catch {
      setSaveError(t('onboarding.saveError'));
      setSaving(false);
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[var(--true-black)] flex items-center justify-center">
        <div
          className="text-[var(--accent)] text-lg animate-pulse"
          aria-live="polite"
        >
          {t('onboarding.preparing')}
        </div>
      </div>
    );
  }

  const chipActive =
    'bg-[var(--surface-active)] border-[var(--border-strong)] text-[var(--accent)]';
  const chipIdle = 'border-[var(--border-soft)] text-[var(--off-white)]/70';

  const age = profile.birthDate ? calculateAge(profile.birthDate) : null;
  const stageLabel =
    age != null
      ? getLifeStageLabel(getLifeStage(age), lang)
      : null;

  return (
    <div
      className="min-h-screen bg-[var(--true-black)] text-[var(--off-white)] flex flex-col"
      style={{ colorScheme: 'dark' }}
    >
      <div className="px-6 pt-6 pb-2">
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
        >
          {([1, 2, 3] as Step[]).map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step
                  ? 'bg-[var(--accent-fill)]'
                  : 'bg-[var(--sage-dim)]/30'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-[var(--sage)]/80 mt-2 text-right">
          {t('onboarding.stepOf', { n: step, total: TOTAL_STEPS })}
        </p>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        {/* ── Step 1: Who you are ── */}
        {step === 1 && (
          <div className="space-y-5 max-w-md mx-auto">
            <div className="text-center pt-3">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[var(--true-black)]">
                <Image
                  src="/logo-icon.png"
                  alt="Salvazion"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <h1 className="font-display text-2xl font-bold text-[var(--accent)] tracking-tight">
                {t('onboarding.welcome')}
              </h1>
              <p className="text-[var(--sage)]/80 mt-1.5 text-sm leading-relaxed">
                {t('onboarding.taglineShort')}
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-sm text-[var(--sage)] mb-1.5">
                  {t('onboarding.name')}
                </label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder={t('onboarding.namePlaceholder')}
                  className="input-soft py-3.5"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--sage)] mb-1.5">
                  {t('onboarding.birthDate')}
                </label>
                <input
                  type="date"
                  value={profile.birthDate || ''}
                  onChange={(e) => update({ birthDate: e.target.value })}
                  max={new Date().toISOString().slice(0, 10)}
                  className="input-soft py-3.5"
                />
                <p className="text-[11px] text-[var(--sage)]/70 mt-1">
                  {t('onboarding.birthHintShort')}
                </p>
              </div>

              <div>
                <label className="block text-sm text-[var(--sage)] mb-1.5">
                  {t('onboarding.sex')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update({ sex: 'male' })}
                    className={`py-3.5 rounded-xl border text-sm font-medium transition-all min-h-[44px] ${
                      profile.sex === 'male' ? chipActive : chipIdle
                    }`}
                  >
                    {t('onboarding.sexMale')}
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ sex: 'female' })}
                    className={`py-3.5 rounded-xl border text-sm font-medium transition-all min-h-[44px] ${
                      profile.sex === 'female' ? chipActive : chipIdle
                    }`}
                  >
                    {t('onboarding.sexFemale')}
                  </button>
                </div>
                <p className="text-[11px] text-[var(--sage)]/75 mt-1.5 leading-relaxed">
                  {t('onboarding.sexHintShort')}
                </p>
              </div>

              <div>
                <label className="block text-sm text-[var(--sage)] mb-1.5">
                  {t('onboarding.purpose')}{' '}
                  <span className="text-[var(--sage)]/50 font-normal">
                    ({t('onboarding.optional')})
                  </span>
                </label>
                <textarea
                  value={profile.purpose || ''}
                  onChange={(e) => update({ purpose: e.target.value })}
                  placeholder={t('onboarding.purposePlaceholder')}
                  rows={2}
                  className="input-soft py-3 resize-none"
                />
                <p className="text-[11px] text-[var(--sage)]/65 mt-1">
                  {t('onboarding.purposeOptionalHint')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={next}
              disabled={!canContinueStep1}
              className="btn-primary text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('onboarding.continue')}
            </button>
          </div>
        )}

        {/* ── Step 2: Focus (quick, all optional defaults) ── */}
        {step === 2 && (
          <div className="space-y-5 max-w-md mx-auto pt-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--accent)]">
                {t('onboarding.focusTitle')}
              </h2>
              <p className="text-sm text-[var(--sage)]/80 mt-1 leading-relaxed">
                {t('onboarding.focusSub')}
              </p>
            </div>

            <div>
              <label className="block text-sm text-[var(--sage)] mb-2">
                {t('onboarding.focusLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleFocus(id)}
                    className={`px-3.5 py-2 rounded-full text-sm border transition-all min-h-[40px] ${
                      profile.currentFocus?.includes(id) ? chipActive : chipIdle
                    }`}
                  >
                    {focusLabel(id)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[var(--sage)] mb-1">
                  {t('onboarding.spiritualMaturity')}
                </label>
                <select
                  value={profile.spiritualMaturity || 'growing'}
                  onChange={(e) =>
                    update({
                      spiritualMaturity: e.target
                        .value as UserProfile['spiritualMaturity'],
                    })
                  }
                  className="input-soft py-3 text-sm"
                >
                  <option value="new">{t('onboarding.maturityNew')}</option>
                  <option value="growing">
                    {t('onboarding.maturityGrowing')}
                  </option>
                  <option value="mature">
                    {t('onboarding.maturityMature')}
                  </option>
                  <option value="leader">
                    {t('onboarding.maturityLeader')}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[var(--sage)] mb-1">
                  {t('onboarding.familyStatus')}
                </label>
                <select
                  value={profile.familyStatus || 'family'}
                  onChange={(e) =>
                    update({
                      familyStatus: e.target
                        .value as UserProfile['familyStatus'],
                    })
                  }
                  className="input-soft py-3 text-sm"
                >
                  <option value="single">
                    {t('onboarding.familySingle')}
                  </option>
                  <option value="married">
                    {t('onboarding.familyMarried')}
                  </option>
                  <option value="parent">
                    {t('onboarding.familyParent')}
                  </option>
                  <option value="family">
                    {t('onboarding.familyFamily')}
                  </option>
                  <option value="widow">
                    {t('onboarding.familyWidow')}
                  </option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-[var(--sage)]/70 leading-relaxed">
              {t('onboarding.phalanxDeferred')}
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={back}
                className="btn-secondary flex-1"
              >
                {t('onboarding.back')}
              </button>
              <button
                type="button"
                onClick={next}
                className="btn-primary flex-1"
              >
                {t('onboarding.continue')}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Ready + Lion ── */}
        {step === 3 && (
          <div className="space-y-5 max-w-md mx-auto pt-2 text-center">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {t('onboarding.readyTitle')}
              </h2>
              <p className="text-[var(--sage)]/80 mt-1 text-sm">
                {t('onboarding.readySub')}
              </p>
            </div>

            <div className="glass rounded-2xl p-4 text-left space-y-2 text-sm border border-[var(--border-soft)]">
              <div className="flex justify-between gap-3">
                <span className="text-[var(--sage)]">{t('onboarding.name')}</span>
                <span className="font-medium text-right">
                  {profile.name || '—'}
                </span>
              </div>
              {age != null && (
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--sage)]">
                    {t('onboarding.confirmAge')}
                  </span>
                  <span className="text-right">
                    {age} {t('onboarding.years')}
                    {stageLabel ? ` · ${stageLabel}` : ''}
                  </span>
                </div>
              )}
              {(profile.currentFocus || []).length > 0 && (
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--sage)]">
                    {t('onboarding.confirmFocus')}
                  </span>
                  <span className="text-right max-w-[60%] text-[12px]">
                    {(profile.currentFocus || []).map(focusLabel).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[var(--border-soft)] animate-pulse" />
              <div className="w-28 h-28 rounded-full overflow-hidden lion-glow flex items-center justify-center bg-[var(--true-black)] border border-[var(--border-strong)]">
                <Image
                  src="/logo-icon.png"
                  alt={t('onboarding.lionName')}
                  width={112}
                  height={112}
                  className="object-cover"
                />
              </div>
            </div>

            <p className="text-sm text-[var(--off-white)]/85 leading-relaxed px-1">
              {t('onboarding.lionPitchShort')}
            </p>
            <p className="text-[11px] text-[var(--sage)]/75 leading-relaxed">
              {t('onboarding.afterStartHint')}
            </p>

            {saveError ? (
              <p className="text-[12px] text-red-400 leading-relaxed" role="alert">
                {saveError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void finish()}
              disabled={saving}
              className="btn-primary text-base"
            >
              {saving
                ? t('onboarding.starting')
                : t('onboarding.acceptCall')}
            </button>
            <button
              type="button"
              onClick={back}
              disabled={saving}
              className="btn-ghost text-sm"
            >
              {t('onboarding.back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
