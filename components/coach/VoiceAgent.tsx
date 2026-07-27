'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  COACH_SUGGESTED_PROMPTS_EN,
  COACH_SUGGESTED_PROMPTS_ES,
  type CoachChatMessage,
} from '@/lib/coach/agent';
import type { UserProfile } from '@/lib/types';
import type { ComputedScores } from '@/lib/scoring/types';

type Props = {
  profile: Partial<UserProfile> | null;
  scores?: Partial<ComputedScores> | null;
  lang?: 'es' | 'en';
  compact?: boolean;
};

type SpeakState = 'idle' | 'loading' | 'playing';

function speakBrowser(text: string, lang: 'es' | 'en') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'en' ? 'en-US' : 'es-ES';
  u.rate = 0.95;
  u.pitch = 0.9;
  window.speechSynthesis.speak(u);
}

export default function VoiceAgent({
  profile,
  scores = null,
  lang = 'es',
  compact = false,
}: Props) {
  const es = lang !== 'en';
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakState, setSpeakState] = useState<SpeakState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const suggestions = es ? COACH_SUGGESTED_PROMPTS_ES : COACH_SUGGESTED_PROMPTS_EN;
  const name = profile?.name?.split(' ')[0] || (es ? 'Hermano' : 'Friend');

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
          speakBrowser(text, lang);
          setSpeakState('idle');
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
          speakBrowser(text, lang);
        };
        await audio.play();
      } catch {
        speakBrowser(text, lang);
        setSpeakState('idle');
      }
    },
    [lang, voiceOn]
  );

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      setError(null);
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
          }),
        });
        const data = await res.json();
        const reply =
          (typeof data.reply === 'string' && data.reply) ||
          (es
            ? 'El León te escucha. Intenta de nuevo.'
            : 'The Lion hears you. Try again.');
        setMessages((m) => [...m, { role: 'assistant', content: reply }]);
        await playTts(reply);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, profile, scores, lang, es, playTts]
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
    rec.lang = es ? 'es-ES' : 'en-US';
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
      setError(es ? 'No se captó audio. Reintenta.' : 'No audio captured. Retry.');
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
            src="/coach/leon-verde.jpg"
            alt="León Verde Salvazion"
            fill
            className="object-cover"
            sizes={compact ? '56px' : '80px'}
            priority
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium">
            {es ? 'Agente de voz · Grok' : 'Voice agent · Grok'}
          </p>
          <h2 className={`font-bold text-white leading-tight ${compact ? 'text-base' : 'text-lg'}`}>
            León Verde
          </h2>
          <p className="text-[11px] text-[var(--sage)]/85 truncate">
            {es
              ? `Coach de ${name} · Salvación · Salud · Libertad`
              : `Coach for ${name} · Salvation · Health · Freedom`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVoiceOn((v) => !v);
            stopSpeech();
          }}
          className={`pill-soft shrink-0 text-[10px] ${voiceOn ? 'pill-soft-active' : ''}`}
          title={es ? 'Voz del León' : 'Lion voice'}
        >
          {voiceOn ? (es ? 'Voz on' : 'Voice on') : es ? 'Voz off' : 'Voice off'}
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-3 pr-0.5"
      >
        {messages.length === 0 && (
          <div className="glass rounded-2xl p-4 border border-[var(--border-soft)]">
            <p className="text-sm text-[#D8E1D9]/90 leading-relaxed">
              {es
                ? `Soy el León Verde de Salvazion. Estoy aquí para motivarte e incentivarte en fe, salud y libertad ordenada. Háblame o escribe.`
                : `I am the Green Lion of Salvazion. I am here to motivate you in faith, health, and ordered freedom. Speak or type.`}
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
                  León Verde
                </p>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => void playTts(m.content)}
                  className="mt-2 text-[10px] text-[var(--accent)] hover:underline"
                >
                  {es ? '▶ Escuchar' : '▶ Listen'}
                </button>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-[var(--sage)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            {es ? 'El León medita…' : 'The Lion considers…'}
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-amber-300/90 mb-2 leading-relaxed">{error}</p>
      )}

      {/* Composer */}
      <div className="shrink-0 space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleListen}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition ${
              listening
                ? 'border-[#8FD99A] bg-[#7BC98A]/25 text-[#8FD99A] animate-pulse'
                : 'border-[var(--border-soft)] text-[var(--sage)] hover:border-[var(--border-strong)]'
            }`}
            aria-label={listening ? (es ? 'Detener mic' : 'Stop mic') : es ? 'Hablar' : 'Speak'}
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
              es ? 'Escribe o usa el mic…' : 'Type or use the mic…'
            }
            className="input-soft flex-1 py-3 text-sm"
            disabled={busy}
          />
          <button
            type="button"
            disabled={busy || !input.trim()}
            onClick={() => void send(input)}
            className="btn-primary w-auto px-4 py-0 shrink-0 disabled:opacity-40"
          >
            {es ? 'Enviar' : 'Send'}
          </button>
        </div>
        {speakState !== 'idle' && (
          <button
            type="button"
            onClick={stopSpeech}
            className="text-[10px] text-[var(--sage)] w-full text-center"
          >
            {speakState === 'loading'
              ? es
                ? 'Preparando voz…'
                : 'Preparing voice…'
              : es
                ? 'Detener voz del León'
                : 'Stop Lion voice'}
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
