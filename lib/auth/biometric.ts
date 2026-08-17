/**
 * Device biometric unlock for Salvazion (thumb / fingerprint / Face ID / Windows Hello).
 *
 * Two layers:
 *  1. Native Capacitor biometric prompt when the Android/iOS shell is present.
 *  2. WebAuthn platform authenticator (Windows Hello, Android Chrome, iOS Safari).
 *
 * Biometric is a local gate on this device. The Supabase refresh token is stored
 * only after the user explicitly enables the feature, and is cleared on sign-out.
 */

export const BIOMETRIC_STATE_KEY = 'salvazion.biometric.state';
export const BIOMETRIC_VAULT_KEY = 'salvazion.biometric.vault';
const UNLOCKED_AT_KEY = 'salvazion.biometric.unlockedAt';
const BACKGROUND_AT_KEY = 'salvazion.biometric.backgroundAt';
export const BIOMETRIC_PROMPT_DISMISS_KEY = 'salvazion.biometric.promptDismissed';
export const BIOMETRIC_CHANGED_EVENT = 'salvazion:biometric-changed';

/** Relock after the app has been in the background this long. */
export const BIOMETRIC_LOCK_AFTER_MS = 90_000;

export type BiometryKind = 'fingerprint' | 'face' | 'pin' | 'none';
export type BiometricSource = 'native' | 'webauthn' | 'none';

export type BiometricCapability = {
  available: boolean;
  kind: BiometryKind;
  source: BiometricSource;
};

export type BiometricState = {
  enabled: boolean;
  email: string;
  userId: string;
  credentialId?: string;
  enrolledAt: number;
};

export type BiometricVault = {
  refresh_token: string;
  access_token: string;
  email: string;
};

export type BiometricSessionSlice = {
  refresh_token: string;
  access_token: string;
};

export class BiometricCancelledError extends Error {
  constructor(message = 'cancelled') {
    super(message);
    this.name = 'BiometricCancelledError';
  }
}

export class BiometricUnavailableError extends Error {
  constructor(message = 'unavailable') {
    super(message);
    this.name = 'BiometricUnavailableError';
  }
}

function canUseDom(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function emitChanged() {
  if (!canUseDom()) return;
  try {
    window.dispatchEvent(new CustomEvent(BIOMETRIC_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function subscribeBiometricChanged(cb: () => void): () => void {
  if (!canUseDom()) return () => {};
  const handler = () => cb();
  window.addEventListener(BIOMETRIC_CHANGED_EVENT, handler);
  return () => window.removeEventListener(BIOMETRIC_CHANGED_EVENT, handler);
}

function readJson<T>(key: string): T | null {
  if (!canUseDom()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseDom()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getBiometricState(): BiometricState | null {
  const state = readJson<BiometricState>(BIOMETRIC_STATE_KEY);
  if (!state?.enabled || !state.userId) return null;
  return state;
}

export function isBiometricEnabled(): boolean {
  return getBiometricState()?.enabled === true && !!readJson<BiometricVault>(BIOMETRIC_VAULT_KEY);
}

export function getBiometricVault(): BiometricVault | null {
  const vault = readJson<BiometricVault>(BIOMETRIC_VAULT_KEY);
  if (!vault?.refresh_token) return null;
  return vault;
}

export function persistBiometricVault(session: BiometricSessionSlice, email: string) {
  if (!session.refresh_token || !session.access_token) return;
  writeJson(BIOMETRIC_VAULT_KEY, {
    refresh_token: session.refresh_token,
    access_token: session.access_token,
    email,
  } satisfies BiometricVault);
}

/** Keep the stored session fresh after a normal password / OAuth login. */
export function refreshVaultFromSession(
  session: BiometricSessionSlice & { user?: { email?: string | null } },
  email?: string | null
) {
  if (!isBiometricEnabled()) return;
  const state = getBiometricState();
  persistBiometricVault(
    session,
    email || session.user?.email || state?.email || ''
  );
}

export function isBiometricPromptDismissed(): boolean {
  if (!canUseDom()) return false;
  return localStorage.getItem(BIOMETRIC_PROMPT_DISMISS_KEY) === '1';
}

export function dismissBiometricPrompt() {
  if (!canUseDom()) return;
  localStorage.setItem(BIOMETRIC_PROMPT_DISMISS_KEY, '1');
}

export function markAppUnlocked() {
  if (!canUseDom()) return;
  sessionStorage.setItem(UNLOCKED_AT_KEY, String(Date.now()));
  sessionStorage.removeItem(BACKGROUND_AT_KEY);
}

export function markAppLocked() {
  if (!canUseDom()) return;
  sessionStorage.removeItem(UNLOCKED_AT_KEY);
}

export function markAppBackgrounded() {
  if (!canUseDom()) return;
  sessionStorage.setItem(BACKGROUND_AT_KEY, String(Date.now()));
}

export function isAppUnlocked(): boolean {
  if (!canUseDom()) return false;
  return !!sessionStorage.getItem(UNLOCKED_AT_KEY);
}

export function shouldRelockOnForeground(): boolean {
  if (!canUseDom()) return true;
  if (!sessionStorage.getItem(UNLOCKED_AT_KEY)) return true;
  const raw = sessionStorage.getItem(BACKGROUND_AT_KEY);
  if (!raw) return false;
  const at = Number(raw);
  if (!Number.isFinite(at)) return true;
  return Date.now() - at >= BIOMETRIC_LOCK_AFTER_MS;
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < view.length; i++) bin += String.fromCharCode(view[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomChallenge(): Uint8Array {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

function rpId(): string {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return host;
  return host;
}

function isWebAuthnApiPresent(): boolean {
  return (
    canUseDom() &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  );
}

async function webAuthnPlatformAvailable(): Promise<boolean> {
  if (!isWebAuthnApiPresent()) return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    /* fall through */
  }
  return true;
}

async function loadNativeBiometric() {
  if (!canUseDom()) return null;
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return null;
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    if (!BiometricAuth?.checkBiometry) return null;
    return BiometricAuth;
  } catch {
    return null;
  }
}

function kindFromNativeType(value: number | string | undefined): BiometryKind {
  // Matches @aparajita/capacitor-biometric-auth BiometryType
  if (value === 2 || value === 4) return 'face';
  if (value === 1 || value === 3) return 'fingerprint';
  if (value === 5) return 'pin';
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('face')) return 'face';
  if (raw.includes('touch') || raw.includes('finger')) return 'fingerprint';
  if (raw.includes('iris')) return 'pin';
  return 'fingerprint';
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const native = await loadNativeBiometric();
  if (native) {
    try {
      const info = await native.checkBiometry();
      if (info.isAvailable) {
        return {
          available: true,
          kind: kindFromNativeType(info.biometryType),
          source: 'native',
        };
      }
    } catch {
      /* fall through to WebAuthn */
    }
  }

  if (await webAuthnPlatformAvailable()) {
    return { available: true, kind: 'fingerprint', source: 'webauthn' };
  }

  return { available: false, kind: 'none', source: 'none' };
}

function isCancelError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof BiometricCancelledError) return true;
  const name = err instanceof Error ? err.name : '';
  const message = err instanceof Error ? err.message : String(err);
  const blob = `${name} ${message}`.toLowerCase();
  return (
    name === 'NotAllowedError' ||
    name === 'AbortError' ||
    blob.includes('cancel') ||
    blob.includes('notallowed') ||
    blob.includes('user canceled') ||
    blob.includes('user cancelled') ||
    blob.includes('code 10') ||
    blob.includes('code 13')
  );
}

async function authenticateNative(reason: string): Promise<boolean> {
  const native = await loadNativeBiometric();
  if (!native) return false;
  const info = await native.checkBiometry();
  if (!info.isAvailable) return false;
  try {
    await native.authenticate({
      reason,
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
      iosFallbackTitle: 'Use passcode',
      androidTitle: 'Salvazion',
      androidSubtitle: reason,
      androidConfirmationRequired: false,
    });
    return true;
  } catch (err) {
    if (isCancelError(err)) throw new BiometricCancelledError();
    throw err;
  }
}

async function createWebAuthnCredential(userId: string, email: string): Promise<string> {
  const userIdBytes = new TextEncoder().encode(userId).slice(0, 64);
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge() as BufferSource,
      rp: { name: 'Salvazion', id: rpId() },
      user: {
        id: userIdBytes as BufferSource,
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60_000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null;

  if (!cred?.rawId) {
    throw new BiometricUnavailableError('no-credential');
  }
  return bytesToBase64Url(cred.rawId);
}

async function assertWebAuthnCredential(credentialId?: string): Promise<void> {
  const allowCredentials = credentialId
    ? [
        {
          type: 'public-key' as const,
          id: base64UrlToBytes(credentialId) as BufferSource,
          transports: ['internal' as const],
        },
      ]
    : undefined;

  const cred = await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge() as BufferSource,
      rpId: rpId(),
      allowCredentials,
      userVerification: 'required',
      timeout: 60_000,
    },
    mediation: 'required',
  });

  if (!cred) throw new BiometricCancelledError();
}

export async function enrollBiometric(input: {
  userId: string;
  email: string;
  session: BiometricSessionSlice;
  reason: string;
}): Promise<BiometricCapability> {
  const cap = await getBiometricCapability();
  if (!cap.available) throw new BiometricUnavailableError();

  let credentialId: string | undefined;

  if (cap.source === 'native') {
    await authenticateNative(input.reason);
  } else {
    try {
      credentialId = await createWebAuthnCredential(input.userId, input.email);
    } catch (err) {
      if (isCancelError(err)) throw new BiometricCancelledError();
      throw err;
    }
  }

  const state: BiometricState = {
    enabled: true,
    email: input.email,
    userId: input.userId,
    credentialId,
    enrolledAt: Date.now(),
  };
  writeJson(BIOMETRIC_STATE_KEY, state);
  persistBiometricVault(input.session, input.email);
  if (canUseDom()) localStorage.removeItem(BIOMETRIC_PROMPT_DISMISS_KEY);
  markAppUnlocked();
  emitChanged();
  return cap;
}

export async function verifyBiometric(reason: string): Promise<void> {
  const cap = await getBiometricCapability();
  if (!cap.available) throw new BiometricUnavailableError();

  const state = getBiometricState();

  if (cap.source === 'native') {
    await authenticateNative(reason);
    return;
  }

  try {
    await assertWebAuthnCredential(state?.credentialId);
  } catch (err) {
    if (isCancelError(err)) throw new BiometricCancelledError();
    throw err;
  }
}

export async function unlockWithBiometric(reason: string): Promise<BiometricVault> {
  if (!isBiometricEnabled()) {
    throw new BiometricUnavailableError('not-enrolled');
  }
  await verifyBiometric(reason);
  const vault = getBiometricVault();
  if (!vault) throw new BiometricUnavailableError('empty-vault');
  markAppUnlocked();
  return vault;
}

export function disableBiometric() {
  if (!canUseDom()) return;
  localStorage.removeItem(BIOMETRIC_STATE_KEY);
  localStorage.removeItem(BIOMETRIC_VAULT_KEY);
  sessionStorage.removeItem(UNLOCKED_AT_KEY);
  sessionStorage.removeItem(BACKGROUND_AT_KEY);
  emitChanged();
}
