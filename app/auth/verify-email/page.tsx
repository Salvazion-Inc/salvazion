'use client';

import { authEmailRedirectTo } from '@/lib/auth/email-redirect';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/auth/paths';
import { requestConfirmationResend } from '@/lib/auth/resend-confirmation';
import { useI18n } from '@/components/I18nProvider';
import LanguageControl from '@/components/settings/LanguageControl';
import BrandLoader from '@/components/ui/BrandLoader';

function resumePath(next: string | null): string {
  const safe = safeNextPath(next, '/hub/dashboard');
  if (safe.startsWith('/auth/')) return '/hub/dashboard';
  return safe;
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const next = resumePath(searchParams.get('next'));
  const [email, setEmail] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<'loading' | 'public' | 'collect' | 'pending'>('loading');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get('email');
    if (fromQuery && fromQuery.includes('@')) setDraft(fromQuery.trim());
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          setMode('public');
          return;
        }
        if (user.email_confirmed_at && user.email) {
          router.replace(next);
          router.refresh();
          return;
        }
        const pending =
          (typeof user.email === 'string' && user.email) ||
          (typeof user.new_email === 'string' && user.new_email) ||
          '';
        if (!pending) {
          setMode('collect');
          return;
        }
        setEmail(pending);
        setMode('pending');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error');
          setMode('public');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  async function resendKnown() {
    if (!email || sending) return;
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: authEmailRedirectTo(next),
        },
      });
      if (err) setError(err.message);
      else setInfo(t('auth.verifyResent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.verifyResendFailed'));
    } finally {
      setSending(false);
    }
  }

  async function resendPublic(e?: FormEvent) {
    e?.preventDefault();
    const address = draft.trim();
    if (!address || sending) return;
    setSending(true);
    setError(null);
    setInfo(null);
    const result = await requestConfirmationResend(address, next);
    setSending(false);
    if (result === 'invalid') {
      setError(t('auth.resendPrompt'));
      return;
    }
    setInfo(result === 'limited' ? t('auth.resendWait') : t('auth.resendGeneric'));
  }

  async function saveEmail(e: FormEvent) {
    e.preventDefault();
    const address = draft.trim();
    if (!address || sending) return;
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser(
        { email: address },
        { emailRedirectTo: authEmailRedirectTo(next) }
      );
      if (err) {
        setError(err.message);
        return;
      }
      setEmail(address);
      setInfo(t('auth.addEmailSent'));
      setMode('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.verifyResendFailed'));
    } finally {
      setSending(false);
    }
  }

  async function continueAfterVerify() {
    setChecking(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      await supabase.auth.refreshSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email_confirmed_at && user.email) {
        router.replace(next);
        router.refresh();
        return;
      }
      setInfo(t('auth.verifyStillPending'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.verifyResendFailed'));
    } finally {
      setChecking(false);
    }
  }

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* still leave the screen */
    }
    setEmail(null);
    setMode('public');
    router.refresh();
  }

  if (mode === 'loading') return <BrandLoader fullscreen />;

  const title = mode === 'collect' ? t('auth.addEmailTitle') : t('auth.verifyTitle');

  return (
    <div className="marketing-shell text-[var(--off-white)] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <LanguageControl compact />
        </div>
        <div className="text-center glass rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[var(--true-black)]">
            <Image src="/logo-icon.png" alt="Salvazion" width={64} height={64} className="object-cover" />
          </div>
          <h1 className="text-xl font-bold text-[var(--accent)] mb-2">{title}</h1>
          {mode === 'collect' ? (
            <p className="text-sm text-[var(--sage)]/80 leading-relaxed">{t('auth.addEmailBody')}</p>
          ) : (
            <>
              <p className="text-sm text-[var(--sage)]/80 leading-relaxed">{t('auth.verifySubtitle')}</p>
              {mode === 'public' ? (
                <p className="text-sm text-[var(--sage)]/80 leading-relaxed mt-3">{t('auth.resendPrompt')}</p>
              ) : (
                <p className="text-sm text-[var(--sage)]/80 leading-relaxed mt-3">
                  {t('auth.verifyBody')}{' '}
                  {email ? <span className="text-[var(--off-white)]">{email}</span> : null}
                  {email ? '.' : null} {t('auth.verifyFreePlan')}
                </p>
              )}
            </>
          )}
          {info && (
            <p className="text-sm text-[var(--accent)] mt-4" role="status">
              {info}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mt-4">
              {error}
            </p>
          )}
          {mode === 'pending' ? (
            <button
              type="button"
              onClick={() => void resendKnown()}
              disabled={!email || sending}
              className="btn-primary mt-6"
            >
              {sending ? t('auth.verifyResending') : t('auth.verifyResend')}
            </button>
          ) : (
            <form onSubmit={mode === 'collect' ? saveEmail : resendPublic} className="mt-6 space-y-3 text-left">
              <label className="block text-xs text-[var(--sage)]" htmlFor="verify-email-address">
                {t('auth.email')}
              </label>
              <input
                id="verify-email-address"
                type="email"
                required
                autoComplete="email"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="input-soft"
                placeholder="you@email.com"
              />
              <button type="submit" disabled={sending || !draft.trim()} className="btn-primary">
                {sending
                  ? t('auth.verifyResending')
                  : mode === 'collect'
                    ? t('auth.addEmailSubmit')
                    : t('auth.verifyResend')}
              </button>
            </form>
          )}
          {mode !== 'public' ? (
            <>
              <button
                type="button"
                onClick={() => void continueAfterVerify()}
                disabled={checking}
                className="btn-secondary mt-3 w-full"
              >
                {checking ? t('auth.processing') : t('auth.verifyContinue')}
              </button>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-4 text-sm text-[var(--sage)] hover:text-[var(--accent)]"
              >
                {t('auth.verifySignOut')}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<BrandLoader fullscreen />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
