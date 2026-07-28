/**
 * Server-side transactional mailer for Salvazion.
 *
 * Always sends from info@salvazion.org (see lib/email/config.ts).
 * Provider: Resend (HTTPS API). Configure RESEND_API_KEY + verify salvazion.org.
 *
 * Use for: achievements, product notices, admin-triggered info, etc.
 * Do NOT use for Supabase Auth templates (those go through Supabase SMTP)
 * or Stripe invoices (Stripe Dashboard / custom email domain).
 */

import {
  getEmailFromHeader,
  getEmailReplyTo,
  isAppMailerConfigured,
} from '@/lib/email/config';

export type SendAppEmailInput = {
  to: string | string[];
  subject: string;
  /** Plain text body (recommended always). */
  text: string;
  /** Optional HTML alternative. */
  html?: string;
  /** Optional tags for provider analytics. */
  tags?: Array<{ name: string; value: string }>;
};

export type SendAppEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean };

/**
 * Send a product email from info@salvazion.org.
 * Safe to call from Route Handlers / server actions only.
 */
export async function sendAppEmail(
  input: SendAppEmailInput
): Promise<SendAppEmailResult> {
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const recipients = to.map((e) => e.trim()).filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, error: 'Missing recipient' };
  }
  if (!input.subject?.trim()) {
    return { ok: false, error: 'Missing subject' };
  }
  if (!input.text?.trim() && !input.html?.trim()) {
    return { ok: false, error: 'Missing body' };
  }

  if (!isAppMailerConfigured()) {
    console.warn(
      '[email] RESEND_API_KEY not set — skipped send to',
      recipients.join(', ')
    );
    return {
      ok: false,
      skipped: true,
      error:
        'Email provider not configured (RESEND_API_KEY). See docs/email.md.',
    };
  }

  const apiKey = process.env.RESEND_API_KEY!.trim();
  const from = getEmailFromHeader();
  const replyTo = getEmailReplyTo();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: input.subject.trim(),
        text: input.text,
        html: input.html,
        reply_to: replyTo,
        tags: input.tags,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!res.ok) {
      const msg =
        json.message ||
        json.name ||
        `Resend error HTTP ${res.status}`;
      console.error('[email] send failed', msg);
      return { ok: false, error: msg };
    }

    return { ok: true, id: json.id || 'sent' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Email send failed';
    console.error('[email] send exception', msg);
    return { ok: false, error: msg };
  }
}
