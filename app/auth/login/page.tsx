'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError, mapQueryAuthError, safeNextPath } from '@/lib/auth/paths';
import { ensureProfileForUser, loadProfileAsync } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';
import LanguageControl from '@/components/settings/LanguageControl';
import {
  parseInviteFromSearchParams,
  saveInboundInvite,
} from '@/lib/invite/engine';
import { tryAcceptPendingInbound } from '@/lib/invite/supabase';

type Mode = 'password' | 'magic' | 'forgot';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const next = safeNextPath(searchParams.get('next'), '/hub/dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('password');

  useEffect(() => {
    const code = searchParams.get('error');
    const mapped = mapQueryAuthError(code);
    if (mapped) setError(mapped);
    const detail = searchParams.get('detail');
    if (detail && !mapped) setError(detail);

    const inv = parseInviteFromSearchParams(searchParams);
    if (inv) saveInboundInvite(inv);
  }, [searchParams]);

  function getSupabase() {
    try {
      return createClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Supabase no está configurado.');
      return null;
    }
  }

  async function resolveDestination(): Promise<string> {
    try {
      await ensureProfileForUser();
      const profile = await loadProfileAsync();
      if (!profile?.onboardingCompleted) {
        return '/hub/onboarding';
      }
    } catch {
      // fall through
    }
    return next === '/hub/dashboard' ? '/hub/dashboard' : next;
  }

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (err) {
      setError(mapAuthError(err.message));
      setLoading(false);
      return;
    }

    // Accept Phalanx invite if present (real Supabase connection)
    try {
      await tryAcceptPendingInbound();
    } catch {
      // non-blocking
    }

    const dest = await resolveDestination();
    router.push(dest);
    router.refresh();
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const dest = next === '/hub/dashboard' ? '/hub/onboarding' : next;
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(dest)}`,
      },
    });

    if (err) {
      setError(mapAuthError(err.message));
      setLoading(false);
      return;
    }

    setLoading(false);
    setInfo(t('auth.magicSent'));
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/update-password')}`,
    });

    if (err) {
      setError(mapAuthError(err.message));
      setLoading(false);
      return;
    }

    setLoading(false);
    setInfo(t('auth.recoverSent'));
  }

  const title =
    mode === 'forgot'
      ? t('auth.recoverTitle')
      : mode === 'magic'
        ? t('auth.sendMagic')
        : t('auth.loginTitle');

  const subtitle = mode === 'forgot' ? t('auth.recoverSubtitle') : t('auth.loginSubtitle');

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <LanguageControl compact />
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[#00F511]/40 flex items-center justify-center lion-glow overflow-hidden">
            <Image src="/logo.png" alt="Salvazion" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#00F511] tracking-tight">{title}</h1>
          <p className="text-sm text-[#B7F7AC]/70 mt-1">{subtitle}</p>
        </div>

        <form
          onSubmit={
            mode === 'password'
              ? handlePasswordLogin
              : mode === 'magic'
                ? handleMagicLink
                : handleForgot
          }
          className="glass rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-[#B7F7AC] mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F511]"
              placeholder="you@email.com"
            />
          </div>

          {mode === 'password' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-[#B7F7AC]">{t('auth.password')}</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-[11px] text-[#B7F7AC]/60 hover:text-[#00F511]"
                >
                  {t('auth.forgot')}
                </button>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F511]"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}
          {info && (
            <p className="text-sm text-[#00F511] bg-[#00F511]/10 rounded-lg px-3 py-2">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#00F511] text-[#040404] font-semibold text-sm hover:bg-[#B7F7AC] transition disabled:opacity-50"
          >
            {loading
              ? t('auth.processing')
              : mode === 'password'
                ? t('auth.enter')
                : mode === 'magic'
                  ? t('auth.sendMagic')
                  : t('auth.sendRecover')}
          </button>

          <div className="flex flex-col gap-2 pt-1">
            {mode !== 'password' && (
              <button
                type="button"
                onClick={() => {
                  setMode('password');
                  setError(null);
                  setInfo(null);
                }}
                className="w-full text-xs text-[#B7F7AC]/60 hover:text-[#00F511]"
              >
                {t('auth.backToPassword')}
              </button>
            )}
            {mode === 'password' && (
              <button
                type="button"
                onClick={() => {
                  setMode('magic');
                  setError(null);
                  setInfo(null);
                }}
                className="w-full text-xs text-[#B7F7AC]/60 hover:text-[#00F511]"
              >
                {t('auth.magicLink')}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-[#B7F7AC]/50 mt-6">
          {t('auth.noAccount')}{' '}
          <Link href="/auth/signup" className="text-[#00F511] hover:underline">
            {t('auth.createAccount')}
          </Link>
        </p>

        <p className="text-center text-[11px] text-[#B7F7AC]/40 mt-8 leading-relaxed">
          {t('auth.rlsNote')}
          <br />
          {t('auth.rlsNote2')}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#040404] flex items-center justify-center text-[#00F511]">
          Cargando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
