import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bearerToken, checkMetricsAuth, safeTokenEqual } from '../lib/analytics/metrics-auth';

const TOKEN = 'a'.repeat(32) + 'XyZ_-123';

test('not configured when env token is missing or blank', () => {
  assert.equal(checkMetricsAuth(`Bearer ${TOKEN}`, undefined), 'not_configured');
  assert.equal(checkMetricsAuth(`Bearer ${TOKEN}`, '   '), 'not_configured');
  assert.equal(checkMetricsAuth(null, ''), 'not_configured');
});

test('unauthorized without header, wrong scheme or wrong token', () => {
  assert.equal(checkMetricsAuth(null, TOKEN), 'unauthorized');
  assert.equal(checkMetricsAuth('', TOKEN), 'unauthorized');
  assert.equal(checkMetricsAuth(`Basic ${TOKEN}`, TOKEN), 'unauthorized');
  assert.equal(checkMetricsAuth(`Bearer ${TOKEN}x`, TOKEN), 'unauthorized');
  assert.equal(checkMetricsAuth(`Bearer ${TOKEN.slice(0, -1)}`, TOKEN), 'unauthorized');
  assert.equal(checkMetricsAuth('Bearer', TOKEN), 'unauthorized');
});

test('ok with the exact bearer token (case-insensitive scheme)', () => {
  assert.equal(checkMetricsAuth(`Bearer ${TOKEN}`, TOKEN), 'ok');
  assert.equal(checkMetricsAuth(`bearer ${TOKEN}`, TOKEN), 'ok');
  assert.equal(checkMetricsAuth(`Bearer ${TOKEN}`, ` ${TOKEN}\n`), 'ok');
});

test('helpers', () => {
  assert.equal(bearerToken('Bearer abc'), 'abc');
  assert.equal(bearerToken('Bearer a b'), null);
  assert.equal(safeTokenEqual('abc', 'abc'), true);
  assert.equal(safeTokenEqual('abc', 'abd'), false);
  assert.equal(safeTokenEqual('abc', 'abcd'), false);
});
