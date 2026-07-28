/**
 * Canonical email identity for Salvazion product mail.
 *
 * Policy: every automated / product email must come from info@salvazion.org
 * (or reply to it). Override only via env for staging — never use random
 * noreply@ provider defaults in production.
 *
 * Sources of email today:
 * - Supabase Auth (signup, magic link, password recovery) → custom SMTP
 * - Stripe (receipts, invoices, failed payments) → Dashboard support email + custom domain
 * - App server (logros, info, future transactional) → lib/email/mailer.ts
 *
 * Full setup: docs/email.md
 */

import {
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_NAME,
} from '@/lib/config/site';

export { SUPPORT_EMAIL, SUPPORT_EMAIL_NAME };

/** From address used by the app mailer (Resend / SMTP API). */
export function getEmailFromAddress(): string {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  return fromEnv || SUPPORT_EMAIL;
}

/** Human-readable sender name (e.g. "Salvazion"). */
export function getEmailFromName(): string {
  const fromEnv = process.env.EMAIL_FROM_NAME?.trim();
  return fromEnv || SUPPORT_EMAIL_NAME;
}

/** RFC 5322-style From header: `Name <email@domain>`. */
export function getEmailFromHeader(): string {
  const name = getEmailFromName();
  const email = getEmailFromAddress();
  return `${name} <${email}>`;
}

/** Reply-To for product mail (always support inbox). */
export function getEmailReplyTo(): string {
  const fromEnv = process.env.EMAIL_REPLY_TO?.trim();
  return fromEnv || SUPPORT_EMAIL;
}

/** True when the app can send mail via configured provider (e.g. Resend). */
export function isAppMailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
