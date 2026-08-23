'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { loadProfile } from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';
import { computeScores } from '@/lib/scoring/engine';
import { ComputedScores } from '@/lib/scoring/types';
import XArticlesFeed from '@/components/freedom/XArticlesFeed';
import BookStoreCarousel from '@/components/freedom/BookStoreCarousel';
import YouTubeChannelsPanel from '@/components/freedom/YouTubeChannelsPanel';
import XCommunitiesPanel from '@/components/freedom/XCommunitiesPanel';
import ChurchesMapPanel from '@/components/freedom/ChurchesMapPanel';
import PillarHubHeader from '@/components/hub/PillarHubHeader';
import InvitePhalanx from '@/components/invite/InvitePhalanx';
import VoiceAgent from '@/components/coach/VoiceAgent';
import DailyIntentionCard from '@/components/freedom/DailyIntentionCard';
import Link from 'next/link';
import BrandLoader from '@/components/ui/BrandLoader';

type FreedomTab = 'learn' | 'connect' | 'contribute';

function parseFreedomTab(raw: string | null): FreedomTab | null {
  if (raw === 'learn' || raw === 'connect' || raw === 'contribute') return raw;
  return null;
}

export default function FreedomPage() {
  return (
    <Suspense fallback={<BrandLoader fullscreen />}>
      <FreedomPageInner />
    </Suspense>
  );
}

function FreedomPageInner() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [scores, setScores] = useState<ComputedScores | null>(null);
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<FreedomTab>('learn');

  const refresh = useCallback(() => {
    const s = computeScores();
    setScores(s);
    const p = loadProfile();
    setProfile(p);
    setLoggedToday(
      new Set(s.todayActions.filter((a) => a.pillar === 'freedom').map((a) => a.type))
    );
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();
  }, [refresh]);

  // Deep-link from coach FAB clouds: /hub/freedom?tab=connect|learn|contribute
  useEffect(() => {
    const tab = parseFreedomTab(searchParams.get('tab'));
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  if (!mounted || !scores) {
    return <BrandLoader fullscreen />;
  }

  const freedomScore = scores.freedom;

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <PillarHubHeader pillar="freedom" score={freedomScore}>
        <div
          className="tabs-x mb-1 mt-2"
          style={{ ['--tab-accent' as string]: 'var(--pillar-freedom)' }}
          role="tablist"
          aria-label="Freedom"
        >
          {(
            [
              { id: 'learn' as const, label: 'Aprender' },
              { id: 'connect' as const, label: 'Conectar' },
              { id: 'contribute' as const, label: 'Aportar' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-active={activeTab === tab.id}
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </PillarHubHeader>

      <main className="flex-1 px-4 sm:px-5 pt-4 pb-32 overflow-y-auto max-w-lg mx-auto w-full">
        <div className="mb-5">
          <DailyIntentionCard
            lang={
              profile?.language === 'pt' || profile?.language === 'en'
                ? profile.language
                : 'es'
            }
            compact={activeTab !== 'contribute'}
          />
        </div>
        {activeTab === 'learn' && (
          <div className="space-y-5">
            <XArticlesFeed
              focus={profile?.currentFocus}
              onScored={() => refresh()}
            />

            {/* 1) Books */}
            <BookStoreCarousel />

            {/* 2) YouTube channels = short video + mini-course */}
            <YouTubeChannelsPanel onScored={() => refresh()} />

            <section className="card-soft p-3.5 border border-[var(--border-soft)]">
              <h2 className="text-sm font-semibold text-white leading-tight mb-2">
                Debate
              </h2>
              <VoiceAgent
                profile={profile}
                scores={scores}
                lang={profile?.language === 'pt' || profile?.language === 'en' ? profile.language : 'es'}
                mode="debate"
                compact
                onDebateScored={() => refresh()}
              />
            </section>
          </div>
        )}

        {activeTab === 'connect' && (
          <div className="space-y-4">
            <XCommunitiesPanel onScored={() => refresh()} />

            <InvitePhalanx
              onChanged={(links) => {
                const family = links.filter((l) =>
                  ['spouse', 'child', 'sibling', 'family'].includes(l.relation)
                );
                const friends = links.filter(
                  (l) =>
                    !['spouse', 'child', 'sibling', 'family'].includes(l.relation)
                );
                setProfile((p) =>
                  p ? { ...p, familyLinks: family, friendsLinks: friends } : p
                );
              }}
            />

            <ChurchesMapPanel onScored={() => refresh()} />
          </div>
        )}

        {activeTab === 'contribute' && (
          <div className="space-y-3">
            <div className="card-soft p-4 border border-[var(--border-soft)] space-y-3">
              <p className="text-sm font-semibold text-white">
                Trabajo · proyectos · ministerio
              </p>
              <p className="text-[12px] text-[var(--sage)] leading-relaxed">
                {profile?.language === 'en'
                  ? 'Real contribution shows when you mark Work or Contribute on the daily agenda — not with empty point buttons.'
                  : 'Tu aporte real se refleja al marcar Trabajo o Aportar en la agenda diaria — no con botones de puntos vacíos.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/hub/dashboard" className="btn-sm">
                  {profile?.language === 'en' ? 'Open agenda' : 'Abrir agenda'}
                </Link>
                <Link href="/hub/calendar" className="btn-outline-sm">
                  {profile?.language === 'en' ? 'Edit calendar' : 'Editar calendario'}
                </Link>
              </div>
              {loggedToday.has('contribute_project') && (
                <p className="text-[11px] text-[#8FD99A]">
                  {profile?.language === 'en'
                    ? '✓ Contribute already scored today'
                    : '✓ Aportar ya contabilizado hoy'}
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav variant="freedom" />
    </div>
  );
}
