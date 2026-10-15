import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/billing/ai-usage';

export function unverifiedEmailResponse(): NextResponse {
  return NextResponse.json({ error: 'email_unverified' }, { status: 403 });
}

export function authRequiredResponse(): NextResponse {
  return NextResponse.json({ error: 'auth_required' }, { status: 401 });
}

/** Session required, and the email must already be verified. */
export async function requireVerifiedUser(): Promise<
  | { ok: true; user: { id: string; email?: string | null } }
  | { ok: false; response: NextResponse }
> {
  const user = await getRequestUser();
  if (!user) return { ok: false, response: authRequiredResponse() };
  if (!user.emailConfirmedAt) return { ok: false, response: unverifiedEmailResponse() };
  return { ok: true, user };
}
