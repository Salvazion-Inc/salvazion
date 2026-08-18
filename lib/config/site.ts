/**
 * Public product domains for Salvazion.
 *
 * Primary product (this Next.js / Vercel app):
 *   https://salvazion.org
 *   https://www.salvazion.org  → redirect to apex (Vercel)
 *
 * Legacy product alias (kept for bookmarks / OAuth grace period):
 *   https://app.salvazion.org
 *   https://www.app.salvazion.org
 *
 * Email policy: all product / transactional mail uses info@salvazion.org
 * (see lib/email/* and docs/email.md).
 */

/** Apex / primary public host */
export const APP_HOST = 'salvazion.org';
/** www form of the primary host */
export const APP_HOST_WWW = 'www.salvazion.org';

/** Legacy app subdomain (still accepted; prefer apex) */
export const APP_HOST_LEGACY = 'app.salvazion.org';
export const APP_HOST_LEGACY_WWW = 'www.app.salvazion.org';

export const APP_URL = `https://${APP_HOST}`;
export const APP_URL_WWW = `https://${APP_HOST_WWW}`;
export const APP_URL_LEGACY = `https://${APP_HOST_LEGACY}`;

/** GitBook Welcome — one published site; ES/PT are full books on this host */
export const WELCOME_HOST = 'welcome.salvazion.org';
/** Intended branded hosts. GitBook Free cannot attach extra custom domains. */
export const WELCOME_HOST_ES = 'bienvenida.salvazion.org';
export const WELCOME_HOST_PT = 'bem-vindo.salvazion.org';
export const WELCOME_URL = `https://${WELCOME_HOST}`;
export const WELCOME_URL_ES = `${WELCOME_URL}/bienvenida`;
export const WELCOME_URL_PT = `${WELCOME_URL}/bem-vindo`;

export const WELCOME_URLS = {
  en: WELCOME_URL,
  es: WELCOME_URL_ES,
  pt: WELCOME_URL_PT,
} as const;

export function welcomeUrlForLang(lang: 'en' | 'es' | 'pt'): string {
  return WELCOME_URLS[lang] ?? WELCOME_URL;
}

/**
 * @deprecated Marketing was the Canva site; product now lives on the apex.
 * Kept as alias of APP_URL for older imports (SEO, legal).
 */
export const MARKETING_HOST = APP_HOST;
export const MARKETING_URL = APP_URL;

/**
 * Canonical support / contact / From address for the product.
 * Auth (Supabase SMTP), Stripe support, and app mailer must use this.
 */
export const SUPPORT_EMAIL = 'info@salvazion.org';
/** Display name for outbound product email */
export const SUPPORT_EMAIL_NAME = 'Salvazion';
/** Legal entity as on the Delaware certificate */
export const LEGAL_NAME = 'Salvazion, Inc.';
/** mailto: link for legal / footer UI */
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;

/**
 * Canonical public origin for the app (OAuth redirects, wearables, Capacitor, metadata).
 * Override with NEXT_PUBLIC_APP_URL in Vercel / .env.local
 */
export function getAppBaseUrl(): string {
  const fromEnv = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).replace(/\/$/, '');

  if (fromEnv) return fromEnv;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  if (process.env.NODE_ENV === 'production') {
    return APP_URL;
  }

  return 'http://localhost:3000';
}

/** Hosts that should serve this app (auth cookies / redirects) */
export const APP_ALLOWED_HOSTS = [
  APP_HOST,
  APP_HOST_WWW,
  APP_HOST_LEGACY,
  APP_HOST_LEGACY_WWW,
  'localhost',
  '127.0.0.1',
] as const;
