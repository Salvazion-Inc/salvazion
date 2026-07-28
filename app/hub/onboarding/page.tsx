'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserProfile, LinkedProfile } from '@/lib/types';
import {
  saveProfile,
  loadProfileAsync,
  ensureProfileForUser,
  calculateAge,
  getLifeStage,
  getLifeStageLabel,
} from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';
import { saveValueJourneyDone } from '@/lib/freedom/x-articles';

type Step = 1 | 2 | 3 | 4 | 5;

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

const RELATION_IDS: LinkedProfile['relation'][] = [
  'spouse',
  'child',
  'sibling',
  'family',
  'friend',
  'colleague',
  'faith_community',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [booting, setBooting] = useState(true);
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

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRelation, setInviteRelation] = useState<LinkedProfile['relation'] | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

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

  const relationLabel = (id: LinkedProfile['relation']) => {
    const map: Record<LinkedProfile['relation'], string> = {
      spouse: t('onboarding.relSpouse'),
      child: t('onboarding.relChild'),
      sibling: t('onboarding.relSibling'),
      family: t('onboarding.relFamily'),
      friend: t('onboarding.relFriend'),
      colleague: t('onboarding.relColleague'),
      faith_community: t('onboarding.relFaith'),
    };
    return map[id] || id;
  };

  useEffect(() => {
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
            // Prefer current app locale (English principal) when profile has no language yet
            language: existing.language === 'es' || existing.language === 'en' ? existing.language : lang,
            preferredBibleVersion:
              existing.preferredBibleVersion ||
              (lang === 'es' ? 'rv1960' : 'kjv'),
            onboardingCompleted: false,
            hasAcceptedLionCoach: existing.hasAcceptedLionCoach ?? false,
          }));
        } else {
          setProfile((prev) => ({
            ...prev,
            language: lang,
            preferredBibleVersion: lang === 'es' ? 'rv1960' : 'kjv',
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

  const toggleFocus = (id: string) => {
    const current = profile.currentFocus || [];
    if (current.includes(id)) {
      update({ currentFocus: current.filter((x) => x !== id) });
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
    const isFamily = ['spouse', 'child', 'sibling', 'family'].includes(inviteRelation);
    if (isFamily) {
      update({ familyLinks: [...(profile.familyLinks || []), newLink] });
    } else {
      update({ friendsLinks: [...(profile.friendsLinks || []), newLink] });
    }
    closeInvite();
  };

  const shareInvite = async () => {
    const rel = inviteRelation ? relationLabel(inviteRelation) : '';
    const text = t('onboarding.shareBody', { relation: rel });
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('onboarding.shareTitle'),
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
      } catch {
        // ignore
      }
    }
  };

  const next = () => setStep((s) => Math.min(5, s + 1) as Step);
  const back = () => setStep((s) => Math.max(1, s - 1) as Step);

  const finish = async () => {
    await saveProfile({
      ...profile,
      language: lang,
      preferredBibleVersion:
        profile.preferredBibleVersion || (lang === 'es' ? 'rv1960' : 'kjv'),
      hasAcceptedLionCoach: true,
      onboardingCompleted: true,
    });
    // Avoid second fullscreen tutorial right after onboarding
    saveValueJourneyDone();
    router.push('/hub/dashboard');
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[var(--true-black)] flex items-center justify-center">
        <div className="text-[var(--accent)] text-lg animate-pulse" aria-live="polite">
          {t('onboarding.preparing')}
        </div>
      </div>
    );
  }

  const chipActive =
    'bg-[var(--surface-active)] border-[var(--border-strong)] text-[var(--accent)]';
  const chipIdle = 'border-[var(--border-soft)] text-[var(--off-white)]/70';

  return (
    <div
      className="min-h-screen bg-[var(--true-black)] text-[var(--off-white)] flex flex-col"
      style={{ colorScheme: 'dark' }}
    >
      <div className="px-6 pt-6 pb-2">
        <div className="flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={5}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-[var(--accent-fill)]' : 'bg-[var(--sage-dim)]/30'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-[var(--sage)]/80 mt-2 text-right">
          {t('onboarding.stepOf', { n: step })}
        </p>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        {step === 1 && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center pt-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[var(--true-black)]">
                <Image src="/logo-icon.png" alt="Salvazion" width={80} height={80} className="object-cover" />
              </div>
              <h1 className="font-display text-3xl font-bold text-[var(--accent)] tracking-tight">
                {t('onboarding.welcome')}
              </h1>
              <p className="text-[var(--sage)]/80 mt-2 text-sm">{t('onboarding.tagline')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--sage)] mb-1.5">{t('onboarding.name')}</label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder={t('onboarding.namePlaceholder')}
                  className="input-soft py-3.5"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--sage)] mb-1.5">{t('onboarding.birthDate')}</label>
                <input
                  type="date"
                  value={profile.birthDate || ''}
                  onChange={(e) => update({ birthDate: e.target.value })}
                  max={new Date().toISOString().slice(0, 10)}
                  className="input-soft py-3.5"
                />
                <p className="text-[11px] text-[var(--sage)]/70 mt-1">{t('onboarding.birthHint')}</p>
              </div>
              <div>
                <label className="block text-sm text-[var(--sage)] mb-1.5">{t('onboarding.purpose')}</label>
                <textarea
                  value={profile.purpose || ''}
                  onChange={(e) => update({ purpose: e.target.value })}
                  placeholder={t('onboarding.purposePlaceholder')}
                  rows={3}
                  className="input-soft py-3.5 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--sage)] mb-1.5">
                  {t('onboarding.location')}
                </label>
                <input
                  type="text"
                  value={[profile.city, profile.country].filter(Boolean).join(', ')}
                  onChange={(e) => {
                    const parts = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    update({
                      city: parts[0] || '',
                      country: parts.slice(1).join(', '),
                    });
                  }}
                  placeholder={t('onboarding.locationPlaceholder')}
                  className="input-soft py-3.5"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={next}
              disabled={!profile.name || !profile.purpose || !profile.birthDate}
              className="btn-primary text-lg"
            >
              {t('onboarding.continue')}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 max-w-md mx-auto pt-4">
            <h2 className="text-2xl font-bold text-[var(--accent)]">{t('onboarding.spiritualTitle')}</h2>

            <div>
              <label className="block text-sm text-[var(--sage)] mb-1.5">
                {t('onboarding.spiritualMaturity')}
              </label>
              <select
                value={profile.spiritualMaturity}
                onChange={(e) =>
                  update({ spiritualMaturity: e.target.value as UserProfile['spiritualMaturity'] })
                }
                className="input-soft py-3.5"
              >
                <option value="new">{t('onboarding.maturityNew')}</option>
                <option value="growing">{t('onboarding.maturityGrowing')}</option>
                <option value="mature">{t('onboarding.maturityMature')}</option>
                <option value="leader">{t('onboarding.maturityLeader')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--sage)] mb-1.5">
                {t('onboarding.familyStatus')}
              </label>
              <select
                value={profile.familyStatus}
                onChange={(e) =>
                  update({ familyStatus: e.target.value as UserProfile['familyStatus'] })
                }
                className="input-soft py-3.5"
              >
                <option value="single">{t('onboarding.familySingle')}</option>
                <option value="married">{t('onboarding.familyMarried')}</option>
                <option value="parent">{t('onboarding.familyParent')}</option>
                <option value="family">{t('onboarding.familyFamily')}</option>
                <option value="widow">{t('onboarding.familyWidow')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--sage)] mb-1.5">{t('onboarding.sex')}</label>
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
                {t('onboarding.sexHint')}
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

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={back} className="btn-secondary flex-1">
                {t('onboarding.back')}
              </button>
              <button
                type="button"
                onClick={next}
                disabled={profile.sex !== 'male' && profile.sex !== 'female'}
                className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('onboarding.continue')}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 max-w-md mx-auto pt-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--accent)]">{t('onboarding.phalanxTitle')}</h2>
              <p className="text-[var(--sage)] text-sm mt-1">{t('onboarding.phalanxSub')}</p>
            </div>

            <div className="space-y-3">
              {RELATION_IDS.map((rel) => {
                const links = [
                  ...(profile.familyLinks || []),
                  ...(profile.friendsLinks || []),
                ].filter((l) => l.relation === rel);
                return (
                  <div key={rel} className="glass rounded-xl px-4 py-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{relationLabel(rel)}</span>
                      <button
                        type="button"
                        onClick={() => openInvite(rel)}
                        className="btn-outline-sm shrink-0"
                      >
                        {t('onboarding.invite')}
                      </button>
                    </div>
                    {links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {links.map((l) => (
                          <span
                            key={l.id}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-active)] border border-[var(--border-strong)] text-[var(--sage)]"
                          >
                            {l.name} ·{' '}
                            {l.status === 'invited' ? t('onboarding.invited') : l.status}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[var(--sage)]/70 text-center">{t('onboarding.phalanxLater')}</p>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={back} className="btn-secondary flex-1">
                {t('onboarding.back')}
              </button>
              <button type="button" onClick={next} className="btn-primary flex-1">
                {t('onboarding.continue')}
              </button>
            </div>
          </div>
        )}

        {inviteOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md glass rounded-2xl p-5 border border-[var(--border-strong)] space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-[var(--accent)]">
                  {t('onboarding.inviteModalTitle')}
                  {inviteRelation ? ` · ${relationLabel(inviteRelation)}` : ''}
                </h3>
                <button
                  type="button"
                  onClick={closeInvite}
                  className="btn-ghost text-sm"
                >
                  {t('common.close')}
                </button>
              </div>
              <div>
                <label className="block text-sm text-[var(--sage)] mb-1.5">
                  {t('onboarding.personName')}
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder={t('onboarding.personPlaceholder')}
                  autoFocus
                  className="input-soft py-3"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={addLinkedMember}
                  disabled={!inviteName.trim()}
                  className="btn-primary"
                >
                  {t('onboarding.addToPhalanx')}
                </button>
                <button type="button" onClick={shareInvite} className="btn-secondary">
                  {inviteCopied ? t('onboarding.shareCopied') : t('onboarding.shareInvite')}
                </button>
              </div>
              <p className="text-[11px] text-[var(--sage)]/70 text-center leading-relaxed">
                {t('onboarding.inviteLocalNote')}
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 max-w-md mx-auto pt-4">
            <h2 className="text-2xl font-bold text-[var(--accent)]">{t('onboarding.confirmTitle')}</h2>
            <div className="glass rounded-2xl p-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-[var(--sage)]">{t('onboarding.name')}</span>
                <span className="text-right">{profile.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[var(--sage)]">{t('onboarding.confirmAge')}</span>
                <span className="text-right">
                  {profile.birthDate
                    ? `${calculateAge(profile.birthDate) ?? '—'} ${t('onboarding.years')} · ${getLifeStageLabel(getLifeStage(calculateAge(profile.birthDate)))}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[var(--sage)]">{t('onboarding.purpose')}</span>
                <span className="text-right max-w-[60%] line-clamp-2">
                  {profile.purpose}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[var(--sage)]">{t('onboarding.confirmLocation')}</span>
                <span className="text-right">
                  {[profile.city, profile.country].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[var(--sage)]">{t('onboarding.confirmFocus')}</span>
                <span className="text-right max-w-[60%]">
                  {(profile.currentFocus || []).map(focusLabel).join(', ') || '—'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={back} className="btn-secondary flex-1">
                {t('onboarding.back')}
              </button>
              <button type="button" onClick={next} className="btn-primary flex-1">
                {t('onboarding.continue')}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 max-w-md mx-auto pt-2 text-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                {t('onboarding.lionTitle')}{' '}
                <span className="text-[var(--accent)]">{t('onboarding.lionName')}</span>
              </h2>
              <p className="text-[var(--sage)]/80 mt-1">{t('onboarding.lionSub')}</p>
            </div>

            <div className="relative mx-auto w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[var(--border-soft)] animate-pulse" />
              <div className="absolute inset-4 rounded-full border border-[var(--border-soft)]" />
              <div className="w-36 h-36 rounded-full overflow-hidden lion-glow flex items-center justify-center bg-[var(--true-black)] border border-[var(--border-strong)]">
                <Image
                  src="/logo-icon.png"
                  alt={t('onboarding.lionName')}
                  width={144}
                  height={144}
                  className="object-cover"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="glass rounded-xl p-3">
                <p className="text-[var(--accent)] text-xs font-medium mb-1">
                  {t('onboarding.lionSpiritual')}
                </p>
                <p className="text-sm">{t('onboarding.lionSpiritualBody')}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[var(--accent)] text-xs font-medium mb-1">
                  {t('onboarding.lionPhysical')}
                </p>
                <p className="text-sm">{t('onboarding.lionPhysicalBody')}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[var(--accent)] text-xs font-medium mb-1">
                  {t('onboarding.lionMental')}
                </p>
                <p className="text-sm">{t('onboarding.lionMentalBody')}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[var(--accent)] text-xs font-medium mb-1">
                  {t('onboarding.lionVirtue')}
                </p>
                <p className="text-sm">{t('onboarding.lionVirtueBody')}</p>
              </div>
            </div>

            <p className="text-sm text-[var(--off-white)]/80 leading-relaxed px-2">
              {t('onboarding.lionPitch')}
            </p>
            <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed px-1">
              {t('onboarding.lionPrivacy')}
            </p>

            <button type="button" onClick={finish} className="btn-primary text-lg">
              {t('onboarding.acceptCall')}
            </button>
            <button type="button" onClick={back} className="btn-ghost text-sm">
              {t('onboarding.back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
