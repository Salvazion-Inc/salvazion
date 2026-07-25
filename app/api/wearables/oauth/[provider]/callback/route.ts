import { NextRequest, NextResponse } from 'next/server';
import { getAppBaseUrl, getProvider, type OAuthProviderId } from '@/lib/health/wearables/oauth/providers';
import { exchangeCodeForTokens } from '@/lib/health/wearables/oauth/token-exchange';
import { clearFlowState, loadFlowState, saveOAuthTokens } from '@/lib/health/wearables/oauth/tokens';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider: raw } = await ctx.params;
  const provider = raw as OAuthProviderId;
  const config = getProvider(provider);
  const base = getAppBaseUrl();

  if (!config) {
    return NextResponse.redirect(`${base}/hub/health?wearable_error=unknown_provider`);
  }

  const error = req.nextUrl.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(
      `${base}/hub/health?wearable_error=${encodeURIComponent(error)}`
    );
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  if (!code || !state) {
    return NextResponse.redirect(`${base}/hub/health?wearable_error=missing_code`);
  }

  const flow = await loadFlowState();
  if (!flow || flow.provider !== provider || flow.state !== state) {
    return NextResponse.redirect(`${base}/hub/health?wearable_error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens({
      provider,
      code,
      codeVerifier: flow.codeVerifier,
    });
    await saveOAuthTokens(tokens);
    await clearFlowState();
    const returnTo = flow.returnTo.startsWith('/') ? flow.returnTo : '/hub/health';
    return NextResponse.redirect(
      `${base}${returnTo}?wearable_connected=${provider}`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'token_exchange_failed';
    return NextResponse.redirect(
      `${base}/hub/health?wearable_error=${encodeURIComponent(msg)}`
    );
  }
}
