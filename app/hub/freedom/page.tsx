'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { loadProfile, getLifeStageLabel } from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';
import { computeScores, logAction } from '@/lib/scoring/engine';
import { ComputedScores } from '@/lib/scoring/types';
import {
  getCurrentFreedomStage,
  getFreedomActions,
  getLibraryForStage,
  getFreedomPoints,
  markContentComplete,
  FreedomActionDef,
  FreedomContent
} from '@/lib/freedom/engine';
import { generateCoachGuidance, CoachMessage, getLionShortNudge } from '@/lib/coach/engine';
import { evaluateBadges } from '@/lib/badges/engine';
import XArticlesFeed from '@/components/freedom/XArticlesFeed';

export default function FreedomPage() {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [scores, setScores] = useState<ComputedScores | null>(null);
  const [coach, setCoach] = useState<CoachMessage | null>(null);
  const [actions, setActions] = useState<FreedomActionDef[]>([]);
  const [library, setLibrary] = useState<FreedomContent[]>([]);
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());
  const [completedContent, setCompletedContent] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'connect' | 'contribute'>('learn');
  const [selectedContent, setSelectedContent] = useState<FreedomContent | null>(null);

  const stage = getCurrentFreedomStage();
  const stageLabel = getLifeStageLabel(stage);

  const refresh = useCallback(() => {
    const s = computeScores();
    setScores(s);
    const p = loadProfile();
    setProfile(p);
    setActions(getFreedomActions(stage));
    setLibrary(getLibraryForStage(stage));
    if (p) setCoach(generateCoachGuidance(p, s));
    setLoggedToday(new Set(s.todayActions.filter(a => a.pillar === 'freedom').map(a => a.type)));
    try {
      setCompletedContent(new Set(JSON.parse(localStorage.getItem('salvazion_freedom_content') || '[]')));
    } catch {
      setCompletedContent(new Set());
    }
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
        setCoach(generateCoachGuidance(profile, result));
        evaluateBadges({ onboardingCompleted: profile.onboardingCompleted });
      }
      showToast('+' + getFreedomPoints(actionType) + ' Freedom · ' + label);
    }
  };

  const handleCompleteContent = (content: FreedomContent) => {
    markContentComplete(content.id);
    setCompletedContent(prev => new Set([...prev, content.id]));
    handleLog(content.actionType, content.title);
    setSelectedContent(null);
  };

  if (!mounted || !scores) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#8FD99A] animate-pulse">Cargando Freedom...</div>
      </div>
    );
  }

  const freedomScore = scores.freedom;
  const freedomStreak = scores.streaks.freedom;
  const freedomMult = scores.multipliers.freedom;

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="page-header px-5 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/hub/dashboard" className="back-btn" aria-label="Volver">
              ←
            </Link>
            <div className="w-9 h-9 rounded-full border border-[var(--border-soft)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404] shrink-0">
              <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium">
                Freedom
              </p>
              <h1 className="text-lg font-bold text-[var(--accent)] leading-tight">Hub</h1>
              <p className="text-[10px] text-[var(--sage)]/80 truncate">
                {profile?.name} · {stageLabel}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-[var(--accent)]">{freedomScore}</p>
            <p className="text-[10px] text-[var(--sage)]/80">
              {freedomStreak > 0 ? freedomStreak + 'd · ×' + freedomMult.toFixed(2) : 'Score'}
            </p>
          </div>
        </div>
        <div className="segment-soft mb-2">
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
        >
          <div>
            <p className="text-xs font-medium text-[var(--accent)]">Swap · $SALVAZION</p>
            <p className="text-[10px] text-[var(--sage)]">Jupiter · libertad económica</p>
          </div>
          <span className="text-[var(--accent)] text-sm">→</span>
        </Link>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 overflow-y-auto">
        <div className="glass rounded-xl px-4 py-3 mb-5 flex items-start gap-3 border border-[var(--border-soft)]">
          <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
          </div>
          <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
            {coach?.pillarFocus === 'freedom' && coach.body ? coach.body : getLionShortNudge('freedom', stage)}
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#6B8F6E" strokeWidth="6" opacity="0.25" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#A8D4AE" strokeWidth="5"
                strokeDasharray={(Math.min(freedomScore, 100) * 2.64) + ' 264'} strokeLinecap="round" className="ring-glow" />
            </svg>
            <div className="text-center z-10">
              <div className="text-2xl font-bold text-white">{freedomScore}</div>
              <div className="text-[9px] text-[var(--sage)] uppercase">Freedom</div>
            </div>
          </div>
        </div>

        {activeTab === 'learn' && (
          <div className="space-y-5">
            <XArticlesFeed
              focus={profile?.currentFocus || []}
              showFilters
              onScored={() => refresh()}
            />

            {/* Debates / lessons (non-X library) */}
            {library.filter((c) => !c.url || c.category !== 'article').length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-[var(--sage)]">
                  Lecciones y debates
                </h2>
                {library
                  .filter((c) => !c.url || c.category !== 'article')
                  .map((content) => {
                    const done = completedContent.has(content.id);
                    return (
                      <button
                        key={content.id}
                        type="button"
                        onClick={() => setSelectedContent(content)}
                        className={
                          'w-full text-left glass rounded-xl p-4 border ' +
                          (done ? 'border-[var(--border-strong)]' : 'border-[var(--border-soft)]')
                        }
                      >
                        <p className="text-[10px] text-[var(--sage)]/80 uppercase">
                          {content.category} · {content.readMin} min
                        </p>
                        <p className="text-sm font-medium text-white">{content.title}</p>
                        <p className="text-xs text-[#D8E1D9]/60 mt-1 line-clamp-2">
                          {content.summary}
                        </p>
                        <p className="text-xs text-[var(--accent)] mt-2">
                          {done
                            ? '✓ Completado'
                            : '+' + getFreedomPoints(content.actionType) + ' Freedom'}
                        </p>
                      </button>
                    );
                  })}
              </div>
            )}

            {actions
              .filter((a) => a.category === 'learn')
              .map((action) => {
                const done = loggedToday.has(action.actionType);
                return (
                  <div
                    key={action.id}
                    className={
                      'glass rounded-xl p-3.5 border flex justify-between items-center ' +
                      (done ? 'border-[var(--border-strong)]' : 'border-[var(--border-soft)]')
                    }
                  >
                    <div>
                      <p className="text-sm text-white">
                        {action.icon} {action.label}
                      </p>
                      <p className="text-[11px] text-[var(--sage)]/80">{action.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={done}
                      onClick={() => !done && handleLog(action.actionType, action.label)}
                      className="btn-sm"
                    >
                      {done ? '✓' : '+' + getFreedomPoints(action.actionType)}
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        {activeTab === 'connect' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--sage)]">Conectar</h2>
            <p className="text-[11px] text-[var(--sage)]/80">Familia, iglesia y comunidad real.</p>
            {actions.filter(a => a.category === 'connect').map(action => {
              const done = loggedToday.has(action.actionType);
              return (
                <div key={action.id} className={'glass rounded-xl p-4 border ' + (done ? 'border-[var(--border-strong)]' : 'border-[var(--border-soft)]')}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{action.icon} {action.label}</p>
                      <p className="text-xs text-[#D8E1D9]/60 mt-1">{action.description}</p>
                    </div>
                    <button disabled={done} onClick={() => !done && handleLog(action.actionType, action.label)}
                      className={done ? 'btn-sm' : 'btn-sm'}>
                      {done ? '✓' : '+' + getFreedomPoints(action.actionType)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'contribute' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--sage)]">Aportar</h2>
            <p className="text-[11px] text-[var(--sage)]/80">Trabajo, proyectos, startups, ministerio.</p>
            {actions.filter(a => a.category === 'contribute').map(action => {
              const done = loggedToday.has(action.actionType);
              return (
                <div key={action.id} className={'glass rounded-xl p-4 border ' + (done ? 'border-[var(--border-strong)]' : 'border-[var(--border-soft)]')}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{action.icon} {action.label}</p>
                      <p className="text-xs text-[#D8E1D9]/60 mt-1">{action.description}</p>
                    </div>
                    <button disabled={done} onClick={() => !done && handleLog(action.actionType, action.label)}
                      className={done ? 'btn-sm' : 'btn-sm'}>
                      {done ? '✓' : '+' + getFreedomPoints(action.actionType)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedContent && (
        <div className="fixed inset-0 z-50 bg-[#040404]/95 flex flex-col">
          <div className="px-5 pt-6 pb-3 border-b border-[var(--border-soft)] flex justify-between">
            <button
              type="button"
              onClick={() => setSelectedContent(null)}
              className="text-[var(--sage)] text-sm"
            >
              ← Cerrar
            </button>
            <span className="text-[10px] text-[var(--sage)]/80">
              {selectedContent.category}
              {selectedContent.source ? ` · ${selectedContent.source}` : ''}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6 max-w-lg mx-auto w-full">
            <h2 className="font-display text-xl font-bold text-white mb-3">
              {selectedContent.title}
            </h2>
            <p className="text-sm text-[#D8E1D9]/80 leading-relaxed mb-4">
              {selectedContent.summary}
            </p>
            <p className="text-xs text-[var(--sage)] mb-6">
              ~{selectedContent.readMin} min · suma Freedom al completar
            </p>

            {selectedContent.url ? (
              <div className="space-y-3 mb-6">
                <a
                  href={selectedContent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Leer artículo en X ↗
                </a>
                <p className="text-[11px] text-[var(--sage)]/80 text-center">
                  Abre el artículo de @salvazion_ en X. Luego márcalo como leído para
                  sumar Freedom Score.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#D8E1D9]/70 mb-6">
                Aplica una idea hoy. La libertad se construye con oficio, no con consumo
                pasivo.
              </p>
            )}

            <button
              type="button"
              onClick={() => handleCompleteContent(selectedContent)}
              disabled={completedContent.has(selectedContent.id)}
              className={
                completedContent.has(selectedContent.id)
                  ? 'btn-secondary'
                  : selectedContent.url
                    ? 'btn-secondary'
                    : 'btn-primary'
              }
            >
              {completedContent.has(selectedContent.id)
                ? '✓ Completado'
                : 'Marcar como leído · +' + getFreedomPoints(selectedContent.actionType)}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 toast-soft">{toast}</div>
      )}

      <BottomNav variant="freedom" />
    </div>
  );
}
