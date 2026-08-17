'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth/paths';
import { ensureProfileForUser } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';
import LanguageControl from '@/components/settings/LanguageControl';
import {
  parseInviteFromSearchParams,
  relationLabel,
  saveInboundInvite,
  type InboundInvite,
} from '@/lib/invite/engine';
import { tryAcceptPendingInbound } from '@/lib/invite/supabase';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import TermsAccept from '@/components/auth/TermsAccept';
import BrandLoader from '@/components/ui/BrandLoader';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inbound, setInbound] = useState<InboundInvite | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const inv = parseInviteFromSearchParams(searchParams);
    if (inv) {
      setInbound(inv);
      saveInboundInvite(inv);
      if (inv.forName && !name) setName(inv.forName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!acceptedTerms) {
      setError(t('auth.acceptTermsRequired'));
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordMin'));
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      setLoading(false);
      return;
    }

    let supabase;
    try {
      supabase = createClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Supabase no está configurado.');
      setLoading(false);
      return;
    }

    const meta: Record<string, string> = { name: name.trim() };
    if (inbound) {
      meta.invited_by = inbound.from;
      meta.invite_code = inbound.code;
      meta.invite_relation = inbound.relation;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: meta,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/hub/onboarding')}`,
      },
    });

    if (err) {
      setError(mapAuthError(err.message));
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    try {
      await ensureProfileForUser(name.trim());
      await tryAcceptPendingInbound();
    } catch {
      // non-blocking
    }
    router.push('/hub/onboarding');
    router.refresh();
  }

  if (success) {
    return (
      <div className="marketing-shell text-[var(--off-white)] flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm text-center glass rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[var(--true-black)]">
            <Image src="/logo-icon.png" alt="Salvazion" width={64} height={64} className="object-cover" />
          </div>
          <h1 className="text-xl font-bold text-[var(--accent)] mb-2">{t('auth.checkEmail')}</h1>
          <p className="text-sm text-[var(--sage)]/80 leading-relaxed">
            {t('auth.checkEmailBody')} <span className="text-[var(--off-white)]">{email.trim()}</span>.{' '}
            {t('auth.activateAndReturn')}
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-6 text-sm text-[var(--accent)] hover:underline"
          >
            {t('auth.goLogin')}
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="font-display text-2xl font-bold text-[var(--accent)] tracking-tight">{t('auth.signupTitle')}</h1>
          <p className="text-sm text-[var(--sage)] mt-1">{t('auth.signupSubtitle')}</p>
        </div>

        {inbound && (
          <div className="glass rounded-2xl px-4 py-3 mb-4 border border-[var(--border-strong)]">
            <p className="text-sm text-[var(--off-white)]/90">
              <span className="text-[var(--accent)] font-semibold">{inbound.from}</span>{' '}
              {t('invite.invitedYou')} {t('invite.asRelation')}{' '}
              <span className="text-[var(--sage)]">
                {relationLabel(inbound.relation, lang)}
              </span>
              .
            </p>
          </div>
        )}

        <div className="card-soft p-6 space-y-4 shadow-[var(--shadow-premium)]">
          <TermsAccept
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            id="signup-accept-terms"
          />
          <SocialAuthButtons
            next="/hub/onboarding"
            onError={(msg) => setError(msg)}
            enabled={acceptedTerms}
          />

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--sage)] mb-1.5">{t('auth.name')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-soft"
              placeholder={t('auth.name')}
            />
          </div>

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

          <div>
            <label className="block text-xs text-[var(--sage)] mb-1.5">{t('auth.minPassword')}</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-soft"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--sage)] mb-1.5">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-soft"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="btn-primary"
          >
            {loading ? t('auth.creating') : t('auth.create')}
          </button>
        </form>
        </div>

        <p className="text-center text-sm text-[var(--sage)]/80 mt-6">
          {t('auth.hasAccount')}{' '}
          <Link href="/auth/login" className="text-[var(--accent)] hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}

function SignupFallback() {
  return <BrandLoader fullscreen />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  );
}
