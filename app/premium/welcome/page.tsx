import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe';
import {
  isGuestSalvazionSession,
  provisionGuestCheckout,
} from '@/lib/billing/provision-guest';
import { billingLog } from '@/lib/billing/redact';
import GuestWelcome from '@/components/billing/GuestWelcome';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Welcome to Salvazion Premium',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ session_id?: string }> };

/** Stripe success_url for guest Checkout. Provisions (idempotent) then offers sign-in. */
export default async function PremiumWelcomePage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId || !/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId) || !isStripeConfigured()) {
    redirect('/hub/premium');
  }

  let email: string | null = null;
  let provisioned = false;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (!isGuestSalvazionSession(session)) redirect('/hub/premium/success');
    email = session.customer_details?.email?.trim().toLowerCase() || null;
    // Webhook usually wins the race; this covers webhook latency/outage.
    const result = await provisionGuestCheckout(session);
    provisioned = result.ok;
  } catch (e) {
    // redirect() throws a special error — rethrow it.
    if (e && typeof e === 'object' && 'digest' in e) throw e;
    billingLog('premium/welcome', e);
  }

  return <GuestWelcome email={email} provisioned={provisioned} />;
}
