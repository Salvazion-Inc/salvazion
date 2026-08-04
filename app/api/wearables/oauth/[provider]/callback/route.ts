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

  const settingsFallback = '/hub/profile?settings=1&tab=wearables';

  if (!config) {
    return NextResponse.redirect(
      `${base}${settingsFallback}&wearable_error=unknown_provider`
    );
  }

  const error = req.nextUrl.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(
      `${base}${settingsFallback}&wearable_error=${encodeURIComponent(error)}`
    );
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  if (!code || !state) {
    return NextResponse.redirect(
      `${base}${settingsFallback}&wearable_error=missing_code`
    );
  }

  const flow = await loadFlowState();
  if (!flow || flow.provider !== provider || flow.state !== state) {
    return NextResponse.redirect(
      `${base}${settingsFallback}&wearable_error=invalid_state`
    );
  }

  try {
    const tokens = await exchangeCodeForTokens({
      provider,
      code,
      codeVerifier: flow.codeVerifier,
    });
    await saveOAuthTokens(tokens);
    await clearFlowState();
    const returnTo = flow.returnTo.startsWith('/')
      ? flow.returnTo
      : settingsFallback;
    // Merge query (returnTo may already include ?settings=1&tab=wearables)
    const dest = new URL(returnTo, base);
    dest.searchParams.set('wearable_connected', provider);
    dest.searchParams.set('tab', 'wearables');
    dest.searchParams.set('settings', '1');
    return NextResponse.redirect(dest.toString());
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'token_exchange_failed';
    return NextResponse.redirect(
      `${base}${settingsFallback}&wearable_error=${encodeURIComponent(msg)}`
    );
  }
}
