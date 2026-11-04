import { test } from 'node:test';
import assert from 'node:assert/strict';
import { googleGisClientId, makeNonce } from '../lib/auth/google-gis';

test('GIS is off unless flag and a valid client id are set', () => {
  delete process.env.NEXT_PUBLIC_GOOGLE_GIS;
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'x.apps.googleusercontent.com';
  assert.equal(googleGisClientId(), null);
  process.env.NEXT_PUBLIC_GOOGLE_GIS = '1';
  assert.equal(googleGisClientId(), 'x.apps.googleusercontent.com');
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'bogus';
  assert.equal(googleGisClientId(), null);
  delete process.env.NEXT_PUBLIC_GOOGLE_GIS;
  delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
});

test('nonce hash is sha256 hex of raw nonce', async () => {
  const { raw, hashed } = await makeNonce();
  assert.ok(raw.length >= 20);
  assert.match(hashed, /^[0-9a-f]{64}$/);
});
