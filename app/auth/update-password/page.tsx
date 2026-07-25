'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth/paths';

/**
 * Set a new password after a recovery email link (session already established via callback/confirm).
 */
export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [noSession, setNoSession] = useState(false);

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
          setNoSession(true);
        }
      } catch {
        if (!cancelled) setNoSession(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(mapAuthError(err.message));
        setLoading(false);
        return;
      }
      router.replace('/hub/dashboard?password_updated=1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? mapAuthError(err.message) : 'Error al actualizar.');
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center text-[#8FD99A]">
        Cargando…
      </div>
    );
  }

  if (noSession) {
    return (
      <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center glass rounded-2xl p-8">
          <h1 className="text-xl font-bold text-[#8FD99A] mb-2">Enlace no válido</h1>
          <p className="text-sm text-[var(--sage)]/80 mb-6">
            Abre el enlace del correo de recuperación otra vez, o solicita uno nuevo.
          </p>
          <Link href="/auth/login" className="text-sm text-[#8FD99A] hover:underline">
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden">
            <Image src="/logo.png" alt="Salvazion" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#8FD99A] tracking-tight">Nueva contraseña</h1>
          <p className="text-sm text-[var(--sage)] mt-1">Elige una contraseña segura para tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-[var(--sage)] mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-soft"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--sage)] mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-soft"
              placeholder="Repite la contraseña"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
