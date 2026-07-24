'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/hub/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'password' | 'magic'>('password');

  const supabase = createClient();

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(false);
    alert('Revisa tu correo. Te enviamos el enlace de acceso.');
  }

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[#00F511]/40 flex items-center justify-center lion-glow overflow-hidden">
            <Image src="/logo.png" alt="Salvazion" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#00F511] tracking-tight">Entrar a la Phalanx</h1>
          <p className="text-sm text-[#B7F7AC]/70 mt-1">Salvazion Hub</p>
        </div>

        <form
          onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}
          className="glass rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-[#B7F7AC] mb-1.5">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F511]"
              placeholder="tu@email.com"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label className="block text-xs text-[#B7F7AC] mb-1.5">Contraseña</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#00F511] text-[#040404] font-semibold text-sm hover:bg-[#B7F7AC] transition disabled:opacity-50"
          >
            {loading ? 'Entrando…' : mode === 'password' ? 'Entrar' : 'Enviar enlace mágico'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'password' ? 'magic' : 'password');
              setError(null);
            }}
            className="w-full text-xs text-[#B7F7AC]/60 hover:text-[#00F511]"
          >
            {mode === 'password' ? 'Usar enlace mágico por email' : 'Usar contraseña'}
          </button>
        </form>

        <p className="text-center text-sm text-[#B7F7AC]/50 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/signup" className="text-[#00F511] hover:underline">
            Crear cuenta
          </Link>
        </p>

        <p className="text-center text-[11px] text-[#B7F7AC]/40 mt-8 leading-relaxed">
          Tus datos están protegidos por Row Level Security.
          <br />
          Solo tú puedes leer y escribir tu propio perfil y scores.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#040404] flex items-center justify-center text-[#00F511]">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
