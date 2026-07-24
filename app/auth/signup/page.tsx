'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/hub/onboarding`,
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required, show message
    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    // Auto-confirmed (dev mode) → go to onboarding
    router.push('/hub/onboarding');
    router.refresh();
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center glass rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[#00F511]/40 flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="Salvazion" width={64} height={64} className="object-cover" />
          </div>
          <h1 className="text-xl font-bold text-[#00F511] mb-2">Revisa tu correo</h1>
          <p className="text-sm text-[#B7F7AC]/80 leading-relaxed">
            Te enviamos un enlace de confirmación. Actívalo y vuelve aquí para entrar a la Phalanx.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-6 text-sm text-[#00F511] hover:underline"
          >
            Ir a login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[#00F511]/40 flex items-center justify-center lion-glow overflow-hidden">
            <Image src="/logo.png" alt="Salvazion" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#00F511] tracking-tight">Únete a la Phalanx</h1>
          <p className="text-sm text-[#B7F7AC]/70 mt-1">Crea tu cuenta Green Lion King</p>
        </div>

        <form onSubmit={handleSignup} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-[#B7F7AC] mb-1.5">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F511]"
              placeholder="Tu nombre"
            />
          </div>

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

          <div>
            <label className="block text-xs text-[#B7F7AC] mb-1.5">Contraseña (mín. 8)</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F511]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#00F511] text-[#040404] font-semibold text-sm hover:bg-[#B7F7AC] transition disabled:opacity-50"
          >
            {loading ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-[#B7F7AC]/50 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-[#00F511] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
