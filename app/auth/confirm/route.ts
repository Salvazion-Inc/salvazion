import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/auth/paths';
import { cookies } from 'next/headers';
import { UTM_COOKIE } from '@/lib/attribution/utm';
import { stampProfileUtm } from '@/lib/attribution/utm-server';
import { isExpiredAuthLink } from '@/lib/auth/email-redirect';

/**
 * Handles token_hash email links (confirm signup / recovery) when Supabase
 * templates point to /auth/confirm instead of the PKCE /auth/callback flow.
 *
 * Template example:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/hub/onboarding
 *
 * Prefetch-safe: mail scanners and link previews issue GET requests, which used
 * to consume the one-time token before the user clicked. GET now only returns a
 * tiny page that auto-submits a POST (with a button fallback); the token is
 * verified on POST, which scanners do not send.
 */
const TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

function parseType(raw: string | null): EmailOtpType | null {
  return raw && (TYPES as string[]).includes(raw) ? (raw as EmailOtpType) : null;
}

function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = parseType(searchParams.get('type'));
  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth/login?error=confirm_failed`);
  }
  const next = safeNextPath(searchParams.get('next'), '/hub/dashboard');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Salvazion</title></head>
<body style="background:#0b0f0c;color:#e8efe9;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
<form id="f" method="post" action="/auth/confirm">
<input type="hidden" name="token_hash" value="${escapeAttr(token_hash)}">
<input type="hidden" name="type" value="${escapeAttr(type)}">
<input type="hidden" name="next" value="${escapeAttr(next)}">
<button type="submit" style="padding:12px 20px;border-radius:16px;border:1px solid #3a4a3e;background:#1a231d;color:#e8efe9;font-size:15px">Continuar · Continue</button>
</form>
<script>document.getElementById('f').submit();</script>
</body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex',
    },
  });
}

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const token_hash = form?.get('token_hash');
  const type = parseType(typeof form?.get('type') === 'string' ? (form!.get('type') as string) : null);
  const next = safeNextPath(typeof form?.get('next') === 'string' ? (form!.get('next') as string) : null, '/hub/dashboard');

  if (typeof token_hash === 'string' && token_hash && type) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (!error) {
        if (data.user && type !== 'recovery') {
          const jar = await cookies();
          await stampProfileUtm(supabase, data.user, jar.get(UTM_COOKIE)?.value);
        }
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/auth/update-password`, 303);
        }
        return NextResponse.redirect(`${origin}${next}`, 303);
      }
      console.error('[auth/confirm] verifyOtp', error.message);
      if (isExpiredAuthLink(error.message) || /otp_expired|token has expired|invalid/i.test(error.message)) {
        const notice = type === 'signup' || type === 'email' ? 'link_used_confirmed' : 'link_expired';
        return NextResponse.redirect(`${origin}/auth/login?notice=${notice}`, 303);
      }
    } catch (e) {
      console.error('[auth/confirm] exception', e instanceof Error ? e.message : 'unknown');
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirm_failed`, 303);
}
