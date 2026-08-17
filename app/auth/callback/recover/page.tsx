'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/auth/paths';
import { ensureProfileForUser, applyXIdentityToProfile } from '@/lib/store/profile';
import BrandLoader from '@/components/ui/BrandLoader';

/**
 * Client-side PKCE recovery when the server callback could not exchange the code
 * (missing code_verifier in server cookie jar).
 */
function RecoverInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState('Completando acceso…');

  useEffect(() => {
    const code = params.get('code');
    const next = safeNextPath(params.get('next'), '/hub/dashboard');
    const prevErr = params.get('err');

    if (!code) {
      setMsg('Falta el código de autorización.');
      router.replace(
        `/auth/login?error=auth_callback_failed&detail=${encodeURIComponent(prevErr || 'missing_code')}`
      );
      return;
    }

    (async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMsg(error.message);
          router.replace(
            `/auth/login?error=auth_callback_failed&detail=${encodeURIComponent(error.message.slice(0, 200))}`
          );
          return;
        }
        try {
          await ensureProfileForUser();
          await applyXIdentityToProfile();
        } catch {
          /* non-blocking */
        }
        setMsg('Listo. Entrando…');
        router.replace(next);
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : 'recover_failed';
        router.replace(
          `/auth/login?error=auth_callback_failed&detail=${encodeURIComponent(m)}`
        );
      }
    })();
  }, [params, router]);

  return <BrandLoader fullscreen label={msg} />;
}

export default function AuthCallbackRecoverPage() {
  return (
    <Suspense fallback={<BrandLoader fullscreen />}>
      <RecoverInner />
    </Suspense>
  );
}
