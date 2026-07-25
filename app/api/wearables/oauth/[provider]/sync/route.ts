import { NextRequest, NextResponse } from 'next/server';
import { getProvider, type OAuthProviderId } from '@/lib/health/wearables/oauth/providers';
import { fetchProviderMetrics } from '@/lib/health/wearables/oauth/fetch-metrics';
import { loadOAuthTokens } from '@/lib/health/wearables/oauth/tokens';

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider: raw } = await ctx.params;
  const provider = raw as OAuthProviderId;
  if (!getProvider(provider)) {
    return NextResponse.json({ error: 'unknown_provider' }, { status: 404 });
  }

  const tokens = await loadOAuthTokens(provider);
  if (!tokens?.accessToken) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  let date: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.date && typeof body.date === 'string') date = body.date;
  } catch {
    /* ignore */
  }

  try {
    const metrics = await fetchProviderMetrics(provider, date);
    return NextResponse.json({
      success: true,
      provider,
      date: date || new Date().toISOString().slice(0, 10),
      metrics,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'sync_failed';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
