import { cookies } from 'next/headers';
import type { OAuthProviderId } from './providers';
import { sealJson, unsealJson } from './crypto-seal';

export interface OAuthTokenSet {
  provider: OAuthProviderId;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // epoch ms
  tokenType?: string;
  scope?: string;
  userId?: string;
}

export interface OAuthFlowState {
  provider: OAuthProviderId;
  state: string;
  codeVerifier: string;
  returnTo: string;
  createdAt: number;
}

const TOKEN_COOKIE = (p: OAuthProviderId) => `sv_wear_${p}`;
const FLOW_COOKIE = 'sv_wear_oauth_flow';

export async function saveOAuthTokens(tokens: OAuthTokenSet): Promise<void> {
  const jar = await cookies();
  jar.set(TOKEN_COOKIE(tokens.provider), sealJson(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function loadOAuthTokens(provider: OAuthProviderId): Promise<OAuthTokenSet | null> {
  const jar = await cookies();
  const raw = jar.get(TOKEN_COOKIE(provider))?.value;
  if (!raw) return null;
  return unsealJson<OAuthTokenSet>(raw);
}

export async function clearOAuthTokens(provider: OAuthProviderId): Promise<void> {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE(provider));
}

export async function listConnectedProviders(): Promise<OAuthProviderId[]> {
  const ids: OAuthProviderId[] = ['fitbit', 'oura', 'whoop', 'garmin'];
  const out: OAuthProviderId[] = [];
  for (const id of ids) {
    const t = await loadOAuthTokens(id);
    if (t?.accessToken) out.push(id);
  }
  return out;
}

export async function saveFlowState(flow: OAuthFlowState): Promise<void> {
  const jar = await cookies();
  jar.set(FLOW_COOKIE, sealJson(flow, 60 * 15), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15,
  });
}

export async function loadFlowState(): Promise<OAuthFlowState | null> {
  const jar = await cookies();
  const raw = jar.get(FLOW_COOKIE)?.value;
  if (!raw) return null;
  return unsealJson<OAuthFlowState>(raw);
}

export async function clearFlowState(): Promise<void> {
  const jar = await cookies();
  jar.delete(FLOW_COOKIE);
}

export function isExpired(tokens: OAuthTokenSet, skewMs = 60_000): boolean {
  if (!tokens.expiresAt) return false;
  return Date.now() >= tokens.expiresAt - skewMs;
}
