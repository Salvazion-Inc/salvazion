/**
 * OAuth provider configs for wearable cloud APIs.
 * Credentials come from env — never ship secrets to the client.
 */

export type OAuthProviderId = 'fitbit' | 'oura' | 'whoop' | 'garmin';

export interface OAuthProviderConfig {
  id: OAuthProviderId;
  brandId: 'fitbit' | 'oura' | 'whoop' | 'garmin';
  name: string;
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scopes: string[];
  /** Use PKCE (recommended for public + confidential hybrid flows) */
  usePkce: boolean;
  /** Fitbit requires Basic auth on token endpoint */
  tokenAuth: 'body' | 'basic';
  clientIdEnv: string;
  clientSecretEnv: string;
  /** Extra token body params */
  extraTokenParams?: Record<string, string>;
  /** Extra authorize params */
  extraAuthParams?: Record<string, string>;
}

export const OAUTH_PROVIDERS: Record<OAuthProviderId, OAuthProviderConfig> = {
  fitbit: {
    id: 'fitbit',
    brandId: 'fitbit',
    name: 'Fitbit',
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    revokeUrl: 'https://api.fitbit.com/oauth2/revoke',
    scopes: [
      'activity',
      'heartrate',
      'sleep',
      'profile',
      'weight',
      'oxygen_saturation',
      'respiratory_rate',
    ],
    usePkce: true,
    tokenAuth: 'basic',
    clientIdEnv: 'FITBIT_CLIENT_ID',
    clientSecretEnv: 'FITBIT_CLIENT_SECRET',
  },
  oura: {
    id: 'oura',
    brandId: 'oura',
    name: 'Oura',
    authUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    scopes: ['email', 'personal', 'daily', 'heartrate', 'workout', 'session', 'spo2'],
    usePkce: true,
    tokenAuth: 'body',
    clientIdEnv: 'OURA_CLIENT_ID',
    clientSecretEnv: 'OURA_CLIENT_SECRET',
  },
  whoop: {
    id: 'whoop',
    brandId: 'whoop',
    name: 'WHOOP',
    authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
    tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
    scopes: [
      'read:recovery',
      'read:cycles',
      'read:sleep',
      'read:workout',
      'read:profile',
      'read:body_measurement',
    ],
    usePkce: true,
    tokenAuth: 'body',
    clientIdEnv: 'WHOOP_CLIENT_ID',
    clientSecretEnv: 'WHOOP_CLIENT_SECRET',
  },
  garmin: {
    id: 'garmin',
    brandId: 'garmin',
    name: 'Garmin',
    // Garmin Connect Developer Program — OAuth 2.0 (PKCE) endpoints
    authUrl: 'https://connect.garmin.com/oauth2Confirm',
    tokenUrl: 'https://diauth.garmin.com/di-oauth2-service/oauth/token',
    scopes: ['ACTIVITY_EXPORT', 'HEALTH_EXPORT', 'WORKOUT_IMPORT'],
    usePkce: true,
    tokenAuth: 'basic',
    clientIdEnv: 'GARMIN_CLIENT_ID',
    clientSecretEnv: 'GARMIN_CLIENT_SECRET',
    extraAuthParams: {
      response_type: 'code',
    },
  },
};

export function getProvider(id: string): OAuthProviderConfig | null {
  if (id in OAUTH_PROVIDERS) return OAUTH_PROVIDERS[id as OAuthProviderId];
  return null;
}

export function isProviderConfigured(id: OAuthProviderId): boolean {
  const p = OAUTH_PROVIDERS[id];
  const clientId = process.env[p.clientIdEnv];
  const clientSecret = process.env[p.clientSecretEnv];
  return Boolean(clientId && clientSecret);
}

export function getClientCredentials(id: OAuthProviderId): {
  clientId: string;
  clientSecret: string;
} | null {
  const p = OAUTH_PROVIDERS[id];
  const clientId = process.env[p.clientIdEnv];
  const clientSecret = process.env[p.clientSecretEnv];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export { getAppBaseUrl } from '@/lib/config/site';

export function getRedirectUri(provider: OAuthProviderId): string {
  return `${getAppBaseUrl()}/api/wearables/oauth/${provider}/callback`;
}

export function listProviderStatus(): Array<{
  id: OAuthProviderId;
  name: string;
  configured: boolean;
  brandId: string;
}> {
  return (Object.keys(OAUTH_PROVIDERS) as OAuthProviderId[]).map((id) => ({
    id,
    name: OAUTH_PROVIDERS[id].name,
    brandId: OAUTH_PROVIDERS[id].brandId,
    configured: isProviderConfigured(id),
  }));
}
