import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY. Add it in .env.local and Vercel (Salvazion Stripe account).'
    );
  }
  if (!stripe) {
    // Use account/SDK default API version (Stripe Node v22+)
    stripe = new Stripe(key);
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
