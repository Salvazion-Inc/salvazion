import { NextRequest, NextResponse } from 'next/server';
import {
  getClientCredentials,
  getProvider,
  getRedirectUri,
  isProviderConfigured,
  type OAuthProviderId,
} from '@/lib/health/wearables/oauth/providers';
import { generateCodeChallenge, generateCodeVerifier, generateState } from '@/lib/health/wearables/oauth/pkce';
import { saveFlowState } from '@/lib/health/wearables/oauth/tokens';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider: raw } = await ctx.params;
  const provider = raw as OAuthProviderId;
  const config = getProvider(provider);
  if (!config) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
  }
  if (!isProviderConfigured(provider)) {
    return NextResponse.json(
      {
        error: 'not_configured',
        message: `Missing ${config.clientIdEnv} / ${config.clientSecretEnv} env vars.`,
      },
      { status: 503 }
    );
  }

  const creds = getClientCredentials(provider)!;
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const returnTo = req.nextUrl.searchParams.get('returnTo') || '/hub/health';

  await saveFlowState({
    provider,
    state,
    codeVerifier,
    returnTo,
    createdAt: Date.now(),
  });

  const url = new URL(config.authUrl);
  url.searchParams.set('client_id', creds.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', getRedirectUri(provider));
  url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);

  if (config.usePkce) {
    url.searchParams.set('code_challenge', generateCodeChallenge(codeVerifier));
    url.searchParams.set('code_challenge_method', 'S256');
  }

  // Fitbit extras
  if (provider === 'fitbit') {
    url.searchParams.set('expires_in', '604800');
  }

  for (const [k, v] of Object.entries(config.extraAuthParams || {})) {
    url.searchParams.set(k, v);
  }

  return NextResponse.redirect(url.toString());
}
