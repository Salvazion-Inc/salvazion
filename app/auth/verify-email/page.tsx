'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/auth/paths';
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
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          router.replace(`/auth/signup?next=${encodeURIComponent(next)}`);
          return;
        }
        if (user.email_confirmed_at) {
          router.replace(next);
          router.refresh();
          return;
        }
        setEmail(user.email ?? null);
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error');
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  async function resend() {
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
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
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
      if (user?.email_confirmed_at) {
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
    router.replace('/auth/signup');
    router.refresh();
  }

  if (!ready) return <BrandLoader fullscreen />;

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
          <h1 className="text-xl font-bold text-[var(--accent)] mb-2">{t('auth.verifyTitle')}</h1>
          <p className="text-sm text-[var(--sage)]/80 leading-relaxed">{t('auth.verifySubtitle')}</p>
          <p className="text-sm text-[var(--sage)]/80 leading-relaxed mt-3">
            {t('auth.verifyBody')}{' '}
            {email ? <span className="text-[var(--off-white)]">{email}</span> : null}
            {email ? '.' : null} {t('auth.verifyFreePlan')}
          </p>
          {!email && (
            <p className="text-sm text-[var(--sage)] mt-3">{t('auth.verifyMissingEmail')}</p>
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
          <button
            type="button"
            onClick={() => void resend()}
            disabled={!email || sending}
            className="btn-primary mt-6"
          >
            {sending ? t('auth.verifyResending') : t('auth.verifyResend')}
          </button>
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
