/**
 * OAuth provider configs for wearable cloud APIs.
 * Credentials come from env — never ship secrets to the client.
 *
 * Fitbit: legacy Web API shuts down 2026-09-30. Use Google Health API + Google OAuth.
 * @see https://developers.google.com/health
 */

import { getAppBaseUrl } from '@/lib/config/site';

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
  /** Some providers require Basic auth on token endpoint */
  tokenAuth: 'body' | 'basic';
  clientIdEnv: string;
  clientSecretEnv: string;
  /** Optional legacy env keys (e.g. old Fitbit Web API vars) */
  clientIdEnvFallback?: string;
  clientSecretEnvFallback?: string;
  /** Extra token body params */
  extraTokenParams?: Record<string, string>;
  /** Extra authorize params */
  extraAuthParams?: Record<string, string>;
}

/** Google Health API scopes (restricted — require OAuth app verification for production). */
export const GOOGLE_HEALTH_SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
  'https://www.googleapis.com/auth/googlehealth.profile.readonly',
] as const;

export const OAUTH_PROVIDERS: Record<OAuthProviderId, OAuthProviderConfig> = {
  /**
   * Fitbit / Pixel Watch data via Google Health API (replaces legacy Fitbit Web API).
   * Provider id stays `fitbit` for routes & UI; auth is Google OAuth 2.0.
   */
  fitbit: {
    id: 'fitbit',
    brandId: 'fitbit',
    name: 'Fitbit · Google Health',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [...GOOGLE_HEALTH_SCOPES],
    usePkce: true,
    tokenAuth: 'body',
    clientIdEnv: 'GOOGLE_HEALTH_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_HEALTH_CLIENT_SECRET',
    // Temporary fallback while teams still have FITBIT_* names in env
    clientIdEnvFallback: 'FITBIT_CLIENT_ID',
    clientSecretEnvFallback: 'FITBIT_CLIENT_SECRET',
    extraAuthParams: {
      access_type: 'offline',
      // Needed to obtain a refresh token on first connect
      prompt: 'consent',
      // Do NOT set include_granted_scopes — legacy fitness.* scopes can break Health API
    },
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

function readEnvPair(p: OAuthProviderConfig): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId =
    process.env[p.clientIdEnv] ||
    (p.clientIdEnvFallback ? process.env[p.clientIdEnvFallback] : undefined);
  const clientSecret =
    process.env[p.clientSecretEnv] ||
    (p.clientSecretEnvFallback ? process.env[p.clientSecretEnvFallback] : undefined);
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isProviderConfigured(id: OAuthProviderId): boolean {
  return Boolean(readEnvPair(OAUTH_PROVIDERS[id]));
}

export function getClientCredentials(id: OAuthProviderId): {
  clientId: string;
  clientSecret: string;
} | null {
  return readEnvPair(OAUTH_PROVIDERS[id]);
}

export { getAppBaseUrl };

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
