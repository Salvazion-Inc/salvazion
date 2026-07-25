import { createHash, randomBytes } from 'crypto';

export function generateCodeVerifier(): string {
  return base64Url(randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
  return base64Url(createHash('sha256').update(verifier).digest());
}

export function generateState(): string {
  return base64Url(randomBytes(16));
}

function base64Url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
