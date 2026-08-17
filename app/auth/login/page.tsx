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
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import TermsAccept from '@/components/auth/TermsAccept';
import BiometricLoginButton from '@/components/auth/BiometricLoginButton';

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    // Supabase often puts OAuth failures in the URL hash as well as query params
    // e.g. #error=server_error&error_description=Error+getting+user+profile...
    let hashDetail = '';
    let hashCode = '';
    if (typeof window !== 'undefined' && window.location.hash.length > 1) {
      const hp = new URLSearchParams(window.location.hash.slice(1));
      hashCode = hp.get('error_code') || hp.get('error') || '';
      hashDetail =
        hp.get('error_description') || hp.get('error') || hp.get('detail') || '';
      // Clean hash so refresh / share does not re-show the same noise
      if (hashDetail || hashCode) {
        const clean = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', clean);
      }
    }

    const code = searchParams.get('error') || hashCode;
    const mapped = mapQueryAuthError(code);
    const detail = searchParams.get('detail') || hashDetail || '';
    // Prefer a specific provider/profile mapping over the generic callback message
    const detailMapped = detail ? mapAuthError(detail) : '';
    const detailIsSpecific =
      Boolean(detail) && detailMapped !== detail && !detailMapped.includes(detail);

    if (detailIsSpecific) {
      setError(detailMapped);
    } else if (mapped && detail) {
      setError(`${mapped} (${mapAuthError(detail)})`);
    } else if (mapped) {
      setError(mapped);
    } else if (detail) {
      setError(mapAuthError(detail));
    }

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

  function requireTerms(): boolean {
    if (!acceptedTerms) {
      setError(t('auth.acceptTermsRequired'));
      return false;
    }
    return true;
  }

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (!requireTerms()) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (err) {
      setError(mapAuthError(err.message));
      setLoading(false);
      return;
    }

    if (data.session) {
      const { refreshVaultFromSession } = await import('@/lib/auth/biometric');
      refreshVaultFromSession(data.session, data.session.user.email);
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

    if (!requireTerms()) {
      setLoading(false);
      return;
    }

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
    <div className="marketing-shell text-[var(--off-white)] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <LanguageControl compact />
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden">
            <Image src="/logo.png" alt="Salvazion" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--accent)] tracking-tight">{title}</h1>
          <p className="text-sm text-[var(--sage)] mt-1">{subtitle}</p>
        </div>

        <div className="card-soft p-6 space-y-4 shadow-[var(--shadow-premium)]">
          {mode === 'password' && (
            <>
              <BiometricLoginButton next={next} onError={(msg) => setError(msg)} />
              <TermsAccept
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
                id="login-accept-terms"
              />
              <SocialAuthButtons
                next={next}
                onError={(msg) => setError(msg)}
                enabled={acceptedTerms}
              />
            </>
          )}

        <form
          onSubmit={
            mode === 'password'
              ? handlePasswordLogin
              : mode === 'magic'
                ? handleMagicLink
                : handleForgot
          }
          className="space-y-4"
        >
          {mode !== 'password' && (
            <TermsAccept
              checked={acceptedTerms}
              onChange={setAcceptedTerms}
              id="login-accept-terms-alt"
            />
          )}
          <div>
            <label className="block text-xs text-[var(--sage)] mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-soft"
              placeholder="you@email.com"
            />
          </div>

          {mode === 'password' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-[var(--sage)]">{t('auth.password')}</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-[11px] text-[var(--sage)] hover:text-[var(--accent)]"
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
                className="input-soft"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}
          {info && (
            <p
              role="status"
              className="text-sm text-[var(--accent)] bg-[var(--surface-active)] rounded-lg px-3 py-2"
            >
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || (mode !== 'forgot' && !acceptedTerms)}
            className="btn-primary"
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
                className="w-full text-xs text-[var(--sage)] hover:text-[var(--accent)]"
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
                className="w-full text-xs text-[var(--sage)] hover:text-[var(--accent)]"
              >
                {t('auth.magicLink')}
              </button>
            )}
          </div>
        </form>
        </div>

        <p className="text-center text-sm text-[var(--sage)]/80 mt-6">
          {t('auth.noAccount')}{' '}
          <Link href="/auth/signup" className="text-[var(--accent)] hover:underline">
            {t('auth.createAccount')}
          </Link>
        </p>

        <p className="text-center text-[11px] text-[var(--sage)]/70 mt-8 leading-relaxed">
          {t('auth.rlsNote')}
          <br />
          {t('auth.rlsNote2')}
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  const { t } = useI18n();
  return (
    <div className="marketing-shell flex items-center justify-center text-[var(--accent)]">
      {t('common.loading')}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
