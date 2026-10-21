import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedPreviewOrigin } from '../lib/billing/request-guard';

const u = (s: string) => new URL(s);

test('preview origins allowed only when VERCEL_ENV=preview', () => {
  const o = u('https://salvazion-o51f5odmt-salvazion.vercel.app');
  assert.equal(isAllowedPreviewOrigin(o, 'preview'), true);
  assert.equal(isAllowedPreviewOrigin(o, 'production'), false);
  assert.equal(isAllowedPreviewOrigin(o, undefined), false);
});

test('rejects non-team or non-https hosts in preview', () => {
  for (const s of [
    'http://salvazion-o51f5odmt-salvazion.vercel.app',
    'https://evil-salvazion.vercel.app.evil.com',
    'https://evil-other.vercel.app',
    'https://salvazion.vercel.app',
    'https://x-salvazion.vercel.app:8443',
  ]) {
    assert.equal(isAllowedPreviewOrigin(u(s), 'preview'), false, s);
  }
});
