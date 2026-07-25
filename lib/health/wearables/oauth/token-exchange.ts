import {
  getClientCredentials,
  getProvider,
  getRedirectUri,
  type OAuthProviderId,
} from './providers';
import {
  isExpired,
  loadOAuthTokens,
  saveOAuthTokens,
  type OAuthTokenSet,
} from './tokens';

export async function exchangeCodeForTokens(input: {
  provider: OAuthProviderId;
  code: string;
  codeVerifier?: string;
}): Promise<OAuthTokenSet> {
  const config = getProvider(input.provider);
  const creds = getClientCredentials(input.provider);
  if (!config || !creds) throw new Error('PROVIDER_NOT_CONFIGURED');

  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('code', input.code);
  body.set('redirect_uri', getRedirectUri(input.provider));
  if (input.codeVerifier) body.set('code_verifier', input.codeVerifier);

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };

  if (config.tokenAuth === 'basic') {
    headers.Authorization = `Basic ${Buffer.from(
      `${creds.clientId}:${creds.clientSecret}`
    ).toString('base64')}`;
  } else {
    body.set('client_id', creds.clientId);
    body.set('client_secret', creds.clientSecret);
  }

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = typeof json.error === 'string' ? json.error : `token_http_${res.status}`;
    throw new Error(msg);
  }

  return normalizeTokenResponse(input.provider, json);
}

export async function refreshTokens(provider: OAuthProviderId): Promise<OAuthTokenSet | null> {
  const existing = await loadOAuthTokens(provider);
  if (!existing?.refreshToken) return existing;

  const config = getProvider(provider);
  const creds = getClientCredentials(provider);
  if (!config || !creds) return existing;

  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', existing.refreshToken);

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };

  if (config.tokenAuth === 'basic') {
    headers.Authorization = `Basic ${Buffer.from(
      `${creds.clientId}:${creds.clientSecret}`
    ).toString('base64')}`;
  } else {
    body.set('client_id', creds.clientId);
    body.set('client_secret', creds.clientSecret);
  }

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return existing;

  const next = normalizeTokenResponse(provider, json);
  // Keep refresh token if provider omits it on refresh
  if (!next.refreshToken) next.refreshToken = existing.refreshToken;
  await saveOAuthTokens(next);
  return next;
}

export async function getValidAccessToken(provider: OAuthProviderId): Promise<string | null> {
  let tokens = await loadOAuthTokens(provider);
  if (!tokens?.accessToken) return null;
  if (isExpired(tokens)) {
    tokens = (await refreshTokens(provider)) || tokens;
  }
  return tokens.accessToken;
}

function normalizeTokenResponse(
  provider: OAuthProviderId,
  json: Record<string, unknown>
): OAuthTokenSet {
  const accessToken = String(json.access_token || '');
  if (!accessToken) throw new Error('NO_ACCESS_TOKEN');
  const expiresIn = Number(json.expires_in || 0);
  return {
    provider,
    accessToken,
    refreshToken: json.refresh_token ? String(json.refresh_token) : undefined,
    expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    tokenType: json.token_type ? String(json.token_type) : 'Bearer',
    scope: json.scope ? String(json.scope) : undefined,
    userId: json.user_id ? String(json.user_id) : undefined,
  };
}
