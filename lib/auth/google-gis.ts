/**
 * Google sign-in via Google Identity Services (GIS) + supabase.auth.signInWithIdToken.
 *
 * Why: the Supabase OAuth redirect flow shows Google's consent screen as
 * "continue to <project>.supabase.co". With GIS the ID token is issued to our
 * own Google OAuth Client ID (shown as Salvazion / salvazion.org) and handed to
 * Supabase directly, so no supabase.co host appears.
 *
 * Feature flag (default OFF = current OAuth redirect flow, unchanged):
 *   NEXT_PUBLIC_GOOGLE_GIS=1
 *   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<web client id>.apps.googleusercontent.com
 * Both are public values (no secrets). See docs/auth-google-gis.md.
 */

import { createClient } from '@/lib/supabase/client';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

export function googleGisClientId(): string | null {
  if (process.env.NEXT_PUBLIC_GOOGLE_GIS !== '1') return null;
  const id = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  return id.endsWith('.apps.googleusercontent.com') ? id : null;
}

export function isGoogleGisEnabled(): boolean {
  return googleGisClientId() !== null;
}

type GisCredentialResponse = { credential?: string };
type GisApi = {
  accounts: {
    id: {
      initialize: (cfg: Record<string, unknown>) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
      cancel?: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GisApi;
  }
}

let loader: Promise<GisApi> | null = null;

export function loadGis(): Promise<GisApi> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no_window'));
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (loader) return loader;
  loader = new Promise<GisApi>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => (window.google?.accounts?.id ? resolve(window.google) : reject(new Error('gis_unavailable')));
    s.onerror = () => {
      loader = null;
      reject(new Error('gis_load_failed'));
    };
    document.head.appendChild(s);
  });
  return loader;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Raw nonce for Supabase + its SHA-256 hex for Google (Supabase compares hashes). */
export async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, '');
  const hashed = toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)));
  return { raw, hashed };
}

/**
 * Render Google's official button into `el`. On success the Supabase session is
 * set (cookies via @supabase/ssr browser client) and `onSignedIn` runs.
 */
export async function mountGoogleGisButton(
  el: HTMLElement,
  opts: {
    locale?: string;
    width?: number;
    onSignedIn: () => void;
    onError: (msg: string) => void;
  }
): Promise<void> {
  const clientId = googleGisClientId();
  if (!clientId) throw new Error('gis_disabled');
  const google = await loadGis();
  const nonce = await makeNonce();

  google.accounts.id.initialize({
    client_id: clientId,
    nonce: nonce.hashed,
    use_fedcm_for_prompt: true,
    itp_support: true,
    callback: async (res: GisCredentialResponse) => {
      if (!res.credential) {
        opts.onError('Google no devolvió credenciales');
        return;
      }
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: res.credential,
          nonce: nonce.raw,
        });
        if (error) {
          opts.onError(error.message);
          return;
        }
        opts.onSignedIn();
      } catch (e) {
        opts.onError(e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google');
      }
    },
  });

  google.accounts.id.renderButton(el, {
    type: 'standard',
    theme: 'filled_black',
    shape: 'pill',
    size: 'large',
    text: 'continue_with',
    logo_alignment: 'center',
    width: Math.max(200, Math.min(400, Math.round(opts.width || el.clientWidth || 320))),
    locale: opts.locale,
  });
}
