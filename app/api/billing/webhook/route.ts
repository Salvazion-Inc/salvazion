import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe';
import {
  syncSubscriptionFromStripe,
  upsertSubscriptionRow,
  findUserIdForCustomer,
} from '@/lib/billing/subscription';
import { billingLog } from '@/lib/billing/redact';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!secret || !sig) {
    billingLog('billing/webhook', 'missing STRIPE_WEBHOOK_SECRET or stripe-signature');
    return NextResponse.json({ error: 'Webhook signature required' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    billingLog('billing/webhook', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          const sub = await getStripe().subscriptions.retrieve(subId);
          if (session.client_reference_id) {
            sub.metadata = {
              ...sub.metadata,
              supabase_user_id: session.client_reference_id,
            };
          }
          await syncSubscriptionFromStripe(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripe(sub);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef =
          invoice.parent?.subscription_details?.subscription ?? null;
        if (subRef) {
          const subId = typeof subRef === 'string' ? subRef : subRef.id;
          const sub = await getStripe().subscriptions.retrieve(subId);
          await syncSubscriptionFromStripe(sub);
        } else if (invoice.customer) {
          const customerId =
            typeof invoice.customer === 'string'
              ? invoice.customer
              : invoice.customer.id;
          const userId = await findUserIdForCustomer(customerId);
          if (userId && event.type === 'invoice.payment_failed') {
            await upsertSubscriptionRow(userId, {
              status: 'past_due',
              customerId,
              priceId: null,
            });
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    billingLog('billing/webhook', e);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
