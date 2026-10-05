'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth/paths';
import { useI18n } from '@/components/I18nProvider';
import { pickLang } from '@/lib/i18n/locale';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

const NEXT_AFTER_LOGIN = '/hub/premium/success';

const COPY = {
  title: {
    en: 'Payment received — welcome to Premium',
    es: 'Pago recibido — bienvenido a Premium',
    pt: 'Pagamento recebido — bem-vindo ao Premium',
  },
  body: {
    en: 'Your Salvazion account uses the email you paid with. Open it with one tap:',
    es: 'Tu cuenta Salvazion usa el email con el que pagaste. Ábrela con un toque:',
    pt: 'Sua conta Salvazion usa o email com que você pagou. Abra com um toque:',
  },
  emailLink: {
    en: 'Email me a sign-in link',
    es: 'Envíame un enlace de acceso',
    pt: 'Envie-me um link de acesso',
  },
  sent: {
    en: 'Link sent. Open it on this device to enter Salvazion Premium.',
    es: 'Enlace enviado. Ábrelo en este dispositivo para entrar a Salvazion Premium.',
    pt: 'Link enviado. Abra neste dispositivo para entrar no Salvazion Premium.',
  },
  hasPassword: {
    en: 'Already have a password?',
    es: '¿Ya tienes contraseña?',
    pt: 'Já tem senha?',
  },
  signIn: { en: 'Sign in', es: 'Inicia sesión', pt: 'Entrar' },
} as const;

export default function GuestWelcome({
  email,
  provisioned,
}: {
  email: string | null;
  provisioned: boolean;
}) {
  const { lang } = useI18n();
  const [value, setValue] = useState(email || '');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tr = (k: keyof typeof COPY) => pickLang(lang, COPY[k]);

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email: value.trim(),
        options: {
          // Account is normally created by provisioning; allow creation as a fallback.
          shouldCreateUser: !provisioned,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(NEXT_AFTER_LOGIN)}`,
        },
      });
      if (err) setError(mapAuthError(err.message));
      else setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="marketing-shell text-[var(--off-white)] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[var(--true-black)]">
          <Image src="/logo-icon.png" alt="Salvazion" width={64} height={64} className="object-cover" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--accent)] tracking-tight">{tr('title')}</h1>
        <p className="text-sm text-[var(--sage)] mt-2 leading-relaxed">{tr('body')}</p>

        <div className="card-soft p-6 space-y-4 mt-6 text-left">
          <GoogleAuthButton next={NEXT_AFTER_LOGIN} onError={setError} />
          <form onSubmit={sendLink} className="space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input-soft"
              placeholder="you@email.com"
            />
            <button type="submit" disabled={busy || sent} className="btn-primary">
              {tr('emailLink')}
            </button>
          </form>
          {sent ? <p className="text-sm text-[#8FD99A]">{tr('sent')}</p> : null}
          {error ? (
            <p role="alert" className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          ) : null}
        </div>

        <p className="text-center text-sm text-[var(--sage)]/80 mt-6">
          {tr('hasPassword')}{' '}
          <Link
            href={`/auth/login?next=${encodeURIComponent(NEXT_AFTER_LOGIN)}`}
            className="text-[var(--accent)] hover:underline"
          >
            {tr('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
