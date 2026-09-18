'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  COACH_SUGGESTED_PROMPTS_EN,
  COACH_SUGGESTED_PROMPTS_ES,
  COACH_SUGGESTED_PROMPTS_PT,
  DEBATE_SUGGESTED_PROMPTS_EN,
  DEBATE_SUGGESTED_PROMPTS_ES,
  type CoachChatMessage,
  type CoachMode,
} from '@/lib/coach/agent';
import type { UserProfile } from '@/lib/types';
import type { ComputedScores } from '@/lib/scoring/types';
import { logAction } from '@/lib/scoring/engine';
import AiUsageMeter from '@/components/billing/AiUsageMeter';
import UpgradeCta from '@/components/billing/UpgradeCta';
import { useAiUsage } from '@/lib/billing/ai-usage-client';

type Props = {
  profile: Partial<UserProfile> | null;
  scores?: Partial<ComputedScores> | null;
  lang?: 'es' | 'en' | 'pt';
  compact?: boolean;
  /** coach = daily mentor; debate = Freedom Hub structured debate */
  mode?: CoachMode;
  onDebateScored?: () => void;
};

type SpeakState = 'idle' | 'loading' | 'playing';

export default function VoiceAgent({
  profile,
  scores = null,
  lang = 'es',
  compact = false,
  mode = 'coach',
  onDebateScored,
}: Props) {
  const tx = (en: string, es: string, pt: string) =>
    lang === 'pt' ? pt : lang === 'es' ? es : en;
  const es = lang === 'es';
  const isDebate = mode === 'debate';
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakState, setSpeakState] = useState<SpeakState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [quotaHit, setQuotaHit] = useState(false);
  /** Off by default — freemium browser TTS is poor; Premium uses xAI voice only */
  const [voiceOn, setVoiceOn] = useState(false);
  const [scoredDebate, setScoredDebate] = useState(false);
  const { refresh: refreshUsage } = useAiUsage();
  const listRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const suggestions = isDebate
    ? es
      ? DEBATE_SUGGESTED_PROMPTS_ES
      : DEBATE_SUGGESTED_PROMPTS_EN
    : lang === 'pt'
      ? COACH_SUGGESTED_PROMPTS_PT
      : es
        ? COACH_SUGGESTED_PROMPTS_ES
        : COACH_SUGGESTED_PROMPTS_EN;
  const name = profile?.name?.split(' ')[0] || tx('Friend', 'Hermano', 'Irmão');
  const purpose = profile?.purpose?.trim() || '';
  const globalScore =
    typeof scores?.global === 'number' ? Math.round(scores.global) : null;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      audioRef.current?.pause();
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, []);

  const playTts = useCallback(
    async (text: string) => {
      if (!voiceOn || !text.trim()) return;
      setSpeakState('loading');
      try {
        const res = await fetch('/api/coach/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lang }),
        });
        if (!res.ok) {
          setSpeakState('idle');
          const errJson = await res.json().catch(() => null);
          if (res.status === 429 || res.status === 401) {
            setError(
              (errJson && typeof errJson.message === 'string' && errJson.message) ||
                tx(
                  'Free voice limit reached. Upgrade to Premium — $49/mo.',
                  'Cupo Free de voz agotado. Mejora a Premium — $49/mes.',
                  'Limite Free de voz atingido. Passe para Premium — $49/mês.'
                )
            );
            setQuotaHit(true);
            void refreshUsage();
          }
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        setSpeakState('playing');
        audio.onended = () => {
          setSpeakState('idle');
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setSpeakState('idle');
        };
        await audio.play();
      } catch {
        setSpeakState('idle');
      }
    },
    [lang, voiceOn, es, tx, refreshUsage]
  );

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      setError(null);
      setQuotaHit(false);
      setInput('');
      const nextMessages: CoachChatMessage[] = [
        ...messages,
        { role: 'user', content },
      ];
      setMessages(nextMessages);
      setBusy(true);
      try {
        const res = await fetch('/api/coach/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages,
            profile,
            scores,
            lang,
            mode,
          }),
        });
        const data = await res.json();
        if (res.status === 401 || res.status === 429) {
          const reply =
            (typeof data.reply === 'string' && data.reply) ||
            (typeof data.message === 'string' && data.message) ||
            tx(
              'Free AI limit reached. Upgrade to Premium — $49/mo for unlimited.',
              'Cupo Free de IA agotado. Mejora a Premium — $49/mes para ilimitado.',
              'Limite Free de IA atingido. Passe para Premium — $49/mês para ilimitado.'
            );
          setError(reply);
          setQuotaHit(true);
          setMessages((m) => [...m, { role: 'assistant', content: reply }]);
          void refreshUsage();
          return;
        }
        const reply =
          (typeof data.reply === 'string' && data.reply) ||
          tx(
            'Salvazion AI hears you. Try again.',
            'Salvazion AI te escucha. Intenta de nuevo.',
            'A Salvazion AI te escuta. Tente de novo.'
          );
        setMessages((m) => [...m, { role: 'assistant', content: reply }]);
        void refreshUsage();
        if (isDebate && !scoredDebate && nextMessages.filter((x) => x.role === 'user').length >= 1) {
          logAction('debate_participate');
          setScoredDebate(true);
          onDebateScored?.();
        }
        await playTts(reply);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, profile, scores, lang, es, playTts, mode, isDebate, scoredDebate, onDebateScored, tx, refreshUsage]
  );

  const toggleListen = () => {
    const SR =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SR) {
      setError(
        es
          ? 'Tu navegador no soporta reconocimiento de voz. Escribe el mensaje.'
          : 'Speech recognition not supported. Type your message.'
      );
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const transcript = ev.results[0]?.[0]?.transcript || '';
      if (transcript) {
        setInput(transcript);
        void send(transcript);
      }
    };
    rec.onerror = () => {
      setListening(false);
      setError(tx('No audio captured. Retry.', 'No se captó audio. Reintenta.', 'Não captamos áudio. Tente de novo.'));
    };
    rec.onend = () => setListening(false);
    setListening(true);
    setError(null);
    rec.start();
  };

  const stopSpeech = () => {
    audioRef.current?.pause();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setSpeakState('idle');
  };

  return (
    <div
      className={`flex flex-col ${
        compact ? 'h-[min(70vh,520px)]' : 'h-full min-h-[28rem]'
      }`}
    >
      {/* Avatar header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`relative shrink-0 rounded-full border border-[var(--border-strong)] overflow-hidden lion-glow bg-[#040404] ${
            speakState === 'playing' ? 'ring-2 ring-[#8FD99A]/50 animate-pulse' : ''
          } ${compact ? 'w-14 h-14' : 'w-20 h-20'}`}
        >
          <Image
            src="/logo-icon.png"
            alt="Salvazion"
            fill
            className="object-cover"
            sizes={compact ? '56px' : '80px'}
            priority
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium">
            {isDebate
              ? tx('Debate · Salvazion', 'Debate · Salvazion', 'Debate · Salvazion')
              : tx('Coach · Purpose · Score', 'Coach · Propósito · Score', 'Coach · Propósito · Score')}
          </p>
          <p className="text-[11px] text-[var(--sage)]/85 truncate">
            {isDebate
              ? tx(
                  'Western Christian culture · Bio-conservatism',
                  'Cultura cristiano-occidental · Bio-conservadurismo',
                  'Cultura cristã ocidental · Bio-conservadorismo'
                )
              : globalScore != null
                ? `${name} · ${tx('Global', 'Global', 'Global')} ${globalScore}`
                : `${name} · Salvation · Health · Freedom`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVoiceOn((v) => !v);
            stopSpeech();
          }}
          className={`pill-soft shrink-0 text-[10px] ${voiceOn ? 'pill-soft-active' : ''}`}
          title={tx('Voice', 'Voz', 'Voz')}
        >
          {voiceOn
            ? tx('Voice on', 'Voz on', 'Voz on')
            : tx('Voice off', 'Voz off', 'Voz off')}
        </button>
      </div>
      <div className="mb-3">
        <AiUsageMeter feature="coach_chat" compact={compact} />
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-3 pr-0.5"
      >
        {messages.length === 0 && (
          <div className="glass rounded-2xl p-4 border border-[var(--border-soft)]">
            <p className="text-sm text-[#D8E1D9]/90 leading-relaxed">
              {isDebate
                ? tx(
                    `I am Salvazion. Debate with me: I defend Western Christian culture and bio-conservatism. I reject globalism, the woke agenda, LGBTQ ideology, the Deep State, leftist ideologies, and transhumanism. State your thesis — voice or text.`,
                    `Soy Salvazion. Debate conmigo: defiendo la cultura cristiano-occidental y el bio-conservadurismo. Rechazo el globalismo, la agenda woke, la ideología LGBTQ, el Deep State, las ideologías de izquierda y el transhumanismo. Plantea tu tesis — con voz o texto.`,
                    `Sou a Salvazion. Debate comigo: defendo a cultura cristã ocidental e o bio-conservadorismo. Rejeito o globalismo, a agenda woke, a ideologia LGBTQ, o Deep State, as ideologias de esquerda e o transumanismo. Apresente sua tese — voz ou texto.`
                  )
                : purpose
                  ? tx(
                      `I am Salvazion AI. Your purpose is your compass. I help you live it, raise your Global Score${globalScore != null ? ` (${globalScore})` : ''} and get the maximum from the Platform.`,
                      `Soy Salvazion AI. Tu propósito es tu brújula. Te ayudo a vivirlo, a subir tu Score Global${globalScore != null ? ` (${globalScore})` : ''} y a sacar el máximo de la Plataforma.`,
                      `Sou a Salvazion AI. O teu propósito é a bússola. Ajudo você a vivê-lo, a subir o Score Global${globalScore != null ? ` (${globalScore})` : ''} e a tirar o máximo da Plataforma.`
                    )
                  : tx(
                      `I am Salvazion AI. You have not written your purpose yet. I will help you find it, raise your Global Score${globalScore != null ? ` (${globalScore})` : ''} and get the maximum from the Platform.`,
                      `Soy Salvazion AI. Aún no has escrito tu propósito. Te ayudo a encontrarlo, a subir tu Score Global${globalScore != null ? ` (${globalScore})` : ''} y a sacar el máximo de la Plataforma.`,
                      `Sou a Salvazion AI. Você ainda não escreveu o teu propósito. Ajudo você a encontrá-lo, a subir o Score Global${globalScore != null ? ` (${globalScore})` : ''} e a tirar o máximo da Plataforma.`
                    )}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="pill-soft text-[10px] text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[var(--surface-active)] border border-[var(--border-strong)] text-white'
                  : 'glass border border-[var(--border-soft)] text-[#D8E1D9]/95'
              }`}
            >
              {m.role === 'assistant' && (
                <p className="text-[9px] uppercase tracking-wider text-[var(--accent)] mb-1">
                  {isDebate ? 'Salvazion' : 'Salvazion AI'}
                </p>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => void playTts(m.content)}
                  className="mt-2 text-[10px] text-[var(--accent)] hover:underline"
                >
                  {tx('▶ Listen', '▶ Escuchar', '▶ Ouvir')}
                </button>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-[var(--sage)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            {tx('Salvazion AI considers…', 'Salvazion AI medita…', 'A Salvazion AI medita…')}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-2 space-y-2">
          <p className="text-[11px] text-amber-300/90 leading-relaxed">{error}</p>
          {quotaHit ? <UpgradeCta compact /> : null}
        </div>
      )}

      {/* Composer — fixed row: mic | input | send */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center gap-2 min-w-0 w-full">
          <button
            type="button"
            onClick={toggleListen}
            className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 transition ${
              listening
                ? 'border-[#8FD99A] bg-[#7BC98A]/25 text-[#8FD99A] animate-pulse'
                : 'border-[var(--border-soft)] text-[var(--sage)] hover:border-[var(--border-strong)]'
            }`}
            aria-label={
              listening
                ? tx('Stop mic', 'Detener mic', 'Parar mic')
                : tx('Speak', 'Hablar', 'Falar')
            }
          >
            {listening ? '■' : '🎙'}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={
              tx('Type or use the mic…', 'Escribe o usa el mic…', 'Escreva ou use o mic…')
            }
            className="input-soft input-inline px-3 text-sm"
            disabled={busy}
          />
          <button
            type="button"
            disabled={busy || !input.trim()}
            onClick={() => void send(input)}
            className="btn-primary btn-inline text-xs sm:text-sm disabled:opacity-40"
          >
            {tx('Send', 'Enviar', 'Enviar')}
          </button>
        </div>
        {speakState !== 'idle' && (
          <button
            type="button"
            onClick={stopSpeech}
            className="text-[10px] text-[var(--sage)] w-full text-center"
          >
            {speakState === 'loading'
              ? tx('Preparing voice…', 'Preparando voz…', 'Preparando voz…')
              : tx(
                  'Stop Salvazion AI voice',
                  'Detener voz de Salvazion AI',
                  'Parar voz da Salvazion AI'
                )}
          </button>
        )}
      </div>
    </div>
  );
}

/* Web Speech API typings (browser) */
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
