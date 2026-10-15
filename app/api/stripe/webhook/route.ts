import { POST as billingWebhook } from '../../billing/webhook/route';

export const runtime = 'nodejs';

/**
 * Alias of the billing webhook. The live Stripe endpoint
 * we_1Ty1BuHOw5ZkjRlZcGVrlgIs posts to /api/billing/webhook.
 * This path stays open so a probe is a signature check, not a session 401.
 */
export const POST = billingWebhook;
