'use client';

import { track } from '@vercel/analytics';

type Props = Record<string, string | number | boolean>;

/** Fire-and-forget client event → /api/events (Supabase + server log) + Vercel Analytics. */
export function trackClientEvent(event: 'upgrade_click', props: Props = {}): void {
  try {
    track(event, props);
  } catch {
    // ignore
  }
  try {
    const body = JSON.stringify({ event, props });
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body,
    }).catch(() => undefined);
  } catch {
    // ignore
  }
}
