'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { loadProfile } from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';
import { computeScores, logAction } from '@/lib/scoring/engine';
import { ComputedScores } from '@/lib/scoring/types';
import {
  getCurrentFreedomStage,
  getFreedomActions,
  getFreedomPoints,
  FreedomActionDef,
} from '@/lib/freedom/engine';
import { evaluateBadges } from '@/lib/badges/engine';
import XArticlesFeed from '@/components/freedom/XArticlesFeed';
import BookStoreCarousel from '@/components/freedom/BookStoreCarousel';
import YouTubeChannelsPanel from '@/components/freedom/YouTubeChannelsPanel';
import XCommunitiesPanel from '@/components/freedom/XCommunitiesPanel';
import ChurchesMapPanel from '@/components/freedom/ChurchesMapPanel';
import PillarHubHeader from '@/components/hub/PillarHubHeader';
import InvitePhalanx from '@/components/invite/InvitePhalanx';
import VoiceAgent from '@/components/coach/VoiceAgent';

export default function FreedomPage() {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [scores, setScores] = useState<ComputedScores | null>(null);
  const [actions, setActions] = useState<FreedomActionDef[]>([]);
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'connect' | 'contribute'>('learn');

  const stage = getCurrentFreedomStage();

  const refresh = useCallback(() => {
    const s = computeScores();
    setScores(s);
    const p = loadProfile();
    setProfile(p);
    setActions(getFreedomActions(stage));
    setLoggedToday(new Set(s.todayActions.filter(a => a.pillar === 'freedom').map(a => a.type)));
  }, [stage]);

  useEffect(() => {
    setMounted(true);
    refresh();
  }, [refresh]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleLog = (actionType: string, label: string) => {
    const result = logAction(actionType);
    if (result) {
      setScores(result);
      setLoggedToday(prev => new Set([...prev, actionType]));
      if (profile) {
        evaluateBadges({ onboardingCompleted: profile.onboardingCompleted });
      }
      showToast('+' + getFreedomPoints(actionType) + ' Freedom · ' + label);
    }
  };

  if (!mounted || !scores) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#8FD99A] animate-pulse">Cargando Freedom...</div>
      </div>
    );
  }

  const freedomScore = scores.freedom;

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <PillarHubHeader pillar="freedom" score={freedomScore}>
        <div className="segment-soft mb-2 mt-3">
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
              data-active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link
          href="/hub/swap"
          className="flex items-center justify-between card-soft px-3.5 py-2.5 mt-2 active:scale-[0.99] transition"
          style={{ borderColor: 'rgba(123, 201, 138, 0.35)' }}
        >
          <div>
            <p className="text-xs font-medium" style={{ color: '#8FD99A' }}>Swap · $SALVAZION</p>
            <p className="text-[10px] text-[var(--sage)]">Jupiter · libertad económica</p>
          </div>
          <span className="text-sm" style={{ color: '#7BC98A' }}>→</span>
        </Link>
      </PillarHubHeader>

      <main className="flex-1 px-5 pt-4 pb-32 overflow-y-auto">
        {activeTab === 'learn' && (
          <div className="space-y-5">
            <XArticlesFeed onScored={() => refresh()} />

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
                lang={profile?.language === 'en' ? 'en' : 'es'}
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

            <ChurchesMapPanel />
          </div>
        )}

        {activeTab === 'contribute' && (
          <div className="space-y-2.5">
            <p className="text-[11px] text-[var(--sage)]/80 px-0.5">
              Trabajo, proyectos, startups, ministerio.
            </p>
            {actions
              .filter((a) => a.category === 'contribute')
              .map((action) => {
                const done = loggedToday.has(action.actionType);
                return (
                  <div
                    key={action.id}
                    className={`card-soft p-3.5 border flex items-center gap-3 ${
                      done
                        ? 'border-[var(--border-strong)]'
                        : 'border-[var(--border-soft)]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {action.icon} {action.label}
                      </p>
                      <p className="text-[11px] text-[var(--sage)]/75 mt-0.5 line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={done}
                      onClick={() =>
                        !done && handleLog(action.actionType, action.label)
                      }
                      className="btn-sm"
                    >
                      {done ? '✓' : '+' + getFreedomPoints(action.actionType)}
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 toast-soft">{toast}</div>
      )}

      <BottomNav variant="freedom" />
    </div>
  );
}
