import { NextResponse } from 'next/server';
import { getProvider, type OAuthProviderId } from '@/lib/health/wearables/oauth/providers';
import { clearOAuthTokens } from '@/lib/health/wearables/oauth/tokens';

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider: raw } = await ctx.params;
  const provider = raw as OAuthProviderId;
  if (!getProvider(provider)) {
    return NextResponse.json({ error: 'unknown_provider' }, { status: 404 });
  }
  await clearOAuthTokens(provider);
  return NextResponse.json({ success: true, provider });
}
