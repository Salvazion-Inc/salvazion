'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
        <div className="text-[#00F511] animate-pulse">Cargando Freedom...</div>
      </div>
    );
  }

  const freedomScore = scores.freedom;
  const freedomStreak = scores.streaks.freedom;
  const freedomMult = scores.multipliers.freedom;

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="px-5 pt-6 pb-3 border-b border-[#00B10C]/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link href="/hub/dashboard" className="text-[#B7F7AC]/60 text-sm">←</Link>
            <div className="w-8 h-8 rounded-full border border-[#00F511]/40 flex items-center justify-center">
              <span className="text-sm">🦁</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#00F511]">Freedom</h1>
              <p className="text-[10px] text-[#B7F7AC]/50">{profile?.name} · {stageLabel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#B7F7AC]">{freedomScore}</p>
            <p className="text-[10px] text-[#B7F7AC]/50">
              {freedomStreak > 0 ? freedomStreak + 'd · ×' + freedomMult.toFixed(2) : 'Score'}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {([
            { id: 'learn' as const, label: 'Aprender', icon: '📚' },
            { id: 'connect' as const, label: 'Conectar', icon: '🤝' },
            { id: 'contribute' as const, label: 'Aportar', icon: '🛠️' }
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={'flex-1 py-2 rounded-xl text-xs font-medium border ' + (activeTab === t.id ? 'border-[#00F511] bg-[#00F511]/15 text-[#00F511]' : 'border-[#00B10C]/25 text-[#D8E1D9]/60')}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 overflow-y-auto">
        <div className="glass rounded-xl px-4 py-3 mb-5 flex items-start gap-3 border border-[#00F511]/20">
          <span className="text-lg">🦁</span>
          <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
            {coach?.pillarFocus === 'freedom' && coach.body ? coach.body : getLionShortNudge('freedom', stage)}
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#00B10C" strokeWidth="6" opacity="0.25" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#B7F7AC" strokeWidth="6"
                strokeDasharray={(Math.min(freedomScore, 100) * 2.64) + ' 264'} strokeLinecap="round" />
            </svg>
            <div className="text-center z-10">
              <div className="text-2xl font-bold text-white">{freedomScore}</div>
              <div className="text-[9px] text-[#B7F7AC]/60 uppercase">Freedom</div>
            </div>
          </div>
        </div>

        {activeTab === 'learn' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#B7F7AC]">Biblioteca Salvazion</h2>
            {library.map(content => {
              const done = completedContent.has(content.id);
              return (
                <button key={content.id} onClick={() => setSelectedContent(content)}
                  className={'w-full text-left glass rounded-xl p-4 border ' + (done ? 'border-[#00F511]/30' : 'border-[#00B10C]/25')}>
                  <p className="text-[10px] text-[#B7F7AC]/50 uppercase">{content.category} · {content.readMin} min</p>
                  <p className="text-sm font-medium text-white">{content.title}</p>
                  <p className="text-xs text-[#D8E1D9]/60 mt-1 line-clamp-2">{content.summary}</p>
                  <p className="text-xs text-[#00F511] mt-2">{done ? '✓' : '+' + getFreedomPoints(content.actionType)}</p>
                </button>
              );
            })}
            {actions.filter(a => a.category === 'learn').map(action => {
              const done = loggedToday.has(action.actionType);
              return (
                <div key={action.id} className={'glass rounded-xl p-3.5 border flex justify-between items-center ' + (done ? 'border-[#00F511]/30' : 'border-[#00B10C]/25')}>
                  <div>
                    <p className="text-sm text-white">{action.icon} {action.label}</p>
                    <p className="text-[11px] text-[#B7F7AC]/50">{action.description}</p>
                  </div>
                  <button disabled={done} onClick={() => !done && handleLog(action.actionType, action.label)}
                    className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (done ? 'bg-[#00B10C]/20 text-[#B7F7AC]' : 'bg-[#00F511] text-[#040404]')}>
                    {done ? '✓' : '+' + getFreedomPoints(action.actionType)}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'connect' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#B7F7AC]">Conectar</h2>
            <p className="text-[11px] text-[#B7F7AC]/50">Familia, iglesia y comunidad real.</p>
            {actions.filter(a => a.category === 'connect').map(action => {
              const done = loggedToday.has(action.actionType);
              return (
                <div key={action.id} className={'glass rounded-xl p-4 border ' + (done ? 'border-[#00F511]/30' : 'border-[#00B10C]/25')}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{action.icon} {action.label}</p>
                      <p className="text-xs text-[#D8E1D9]/60 mt-1">{action.description}</p>
                    </div>
                    <button disabled={done} onClick={() => !done && handleLog(action.actionType, action.label)}
                      className={'px-3 py-1.5 rounded-lg text-xs font-medium h-fit ' + (done ? 'bg-[#00B10C]/20 text-[#B7F7AC]' : 'bg-[#00F511] text-[#040404]')}>
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
            <h2 className="text-sm font-semibold text-[#B7F7AC]">Aportar</h2>
            <p className="text-[11px] text-[#B7F7AC]/50">Trabajo, proyectos, startups, ministerio.</p>
            {actions.filter(a => a.category === 'contribute').map(action => {
              const done = loggedToday.has(action.actionType);
              return (
                <div key={action.id} className={'glass rounded-xl p-4 border ' + (done ? 'border-[#00F511]/30' : 'border-[#00B10C]/25')}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{action.icon} {action.label}</p>
                      <p className="text-xs text-[#D8E1D9]/60 mt-1">{action.description}</p>
                    </div>
                    <button disabled={done} onClick={() => !done && handleLog(action.actionType, action.label)}
                      className={'px-3 py-1.5 rounded-lg text-xs font-medium h-fit ' + (done ? 'bg-[#00B10C]/20 text-[#B7F7AC]' : 'bg-[#00F511] text-[#040404]')}>
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
          <div className="px-5 pt-6 pb-3 border-b border-[#00B10C]/20 flex justify-between">
            <button onClick={() => setSelectedContent(null)} className="text-[#B7F7AC]/60 text-sm">← Cerrar</button>
            <span className="text-[10px] text-[#B7F7AC]/50">{selectedContent.category}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-white mb-3">{selectedContent.title}</h2>
            <p className="text-sm text-[#D8E1D9]/80 leading-relaxed mb-6">{selectedContent.summary}</p>
            <p className="text-sm text-[#D8E1D9]/70 mb-8">Aplica una idea hoy. La libertad se construye con oficio, no con consumo pasivo.</p>
            <button
              onClick={() => handleCompleteContent(selectedContent)}
              disabled={completedContent.has(selectedContent.id)}
              className={'w-full py-3.5 rounded-xl font-semibold text-sm ' + (completedContent.has(selectedContent.id) ? 'bg-[#00B10C]/20 text-[#B7F7AC]' : 'bg-[#00F511] text-[#040404]')}
            >
              {completedContent.has(selectedContent.id) ? '✓ Completado' : 'Completar · +' + getFreedomPoints(selectedContent.actionType)}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#00F511] text-[#040404] text-sm font-semibold">{toast}</div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#040404]/95 border-t border-[#00B10C]/25 px-4 py-3">
        <div className="flex justify-between max-w-md mx-auto">
          <Link href="/hub/dashboard" className="flex flex-col items-center gap-0.5"><span className="text-xl opacity-50">🏠</span><span className="text-[10px] text-[#B7F7AC]/50">Home</span></Link>
          <Link href="/hub/health" className="flex flex-col items-center gap-0.5"><span className="text-xl opacity-50">⚡</span><span className="text-[10px] text-[#B7F7AC]/50">Health</span></Link>
          <Link href="/hub/freedom" className="flex flex-col items-center gap-0.5"><span className="text-xl">📚</span><span className="text-[10px] text-[#00F511]">Freedom</span></Link>
          <Link href="/hub/calendar" className="flex flex-col items-center gap-0.5"><span className="text-xl opacity-50">📅</span><span className="text-[10px] text-[#B7F7AC]/50">Agenda</span></Link>
          <Link href="/hub/badges" className="flex flex-col items-center gap-0.5"><span className="text-xl opacity-50">🏅</span><span className="text-[10px] text-[#B7F7AC]/50">Insignias</span></Link>
        </div>
      </nav>
    </div>
  );
}
