/**
 * Public product domains for Salvazion.
 *
 * - Marketing (Canva, sitio antiguo): https://www.salvazion.org
 * - Product app (this Next.js / Vercel deploy): https://app.salvazion.org
 *   Optional alias: https://www.app.salvazion.org
 *
 * Email policy: all product / transactional mail uses info@salvazion.org
 * (see lib/email/* and docs/email.md).
 */

/** Marketing site — do not point this Next.js project here */
export const MARKETING_HOST = 'www.salvazion.org';
export const MARKETING_URL = `https://${MARKETING_HOST}`;

/** Primary app host (current product) */
export const APP_HOST = 'app.salvazion.org';
/** Optional www form of the app subdomain */
export const APP_HOST_WWW = 'www.app.salvazion.org';

export const APP_URL = `https://${APP_HOST}`;
export const APP_URL_WWW = `https://${APP_HOST_WWW}`;

/**
 * Canonical support / contact / From address for the product.
 * Auth (Supabase SMTP), Stripe support, and app mailer must use this.
 */
export const SUPPORT_EMAIL = 'info@salvazion.org';
/** Display name for outbound product email */
export const SUPPORT_EMAIL_NAME = 'Salvazion';
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
  'localhost',
  '127.0.0.1',
] as const;
