/**
 * Server-side product events (funnel metrics).
 * Sinks: structured server log (always, visible in Vercel runtime logs),
 * Supabase `product_events` (supabase/holder-verify.sql) and Vercel Web
 * Analytics custom events (best effort; needs a plan with custom events).
 */
import { track } from '@vercel/analytics/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const PRODUCT_EVENTS = ['bono_activado', 'upgrade_click'] as const;
export type ProductEvent = (typeof PRODUCT_EVENTS)[number];

export function isProductEvent(v: unknown): v is ProductEvent {
  return typeof v === 'string' && (PRODUCT_EVENTS as readonly string[]).includes(v);
}

type Props = Record<string, string | number | boolean | null>;

export async function logProductEvent(
  event: ProductEvent,
  userId: string | null,
  props: Props = {},
  reqHeaders?: Headers
): Promise<void> {
  console.info(
    JSON.stringify({ tag: 'product_event', event, userId, props, at: new Date().toISOString() })
  );
  const admin = createAdminClient();
  const tasks: Promise<unknown>[] = [];
  if (admin) {
    tasks.push(
      Promise.resolve(
        admin.from('product_events').insert({ event, user_id: userId, props })
      ).then(({ error }) => {
        if (error) console.warn('[product_event] db insert failed', error.message);
      })
    );
  }
  if (reqHeaders) {
    tasks.push(track(event, props, { headers: reqHeaders }).catch(() => undefined));
  }
  await Promise.allSettled(tasks);
}
