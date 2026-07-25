/**
 * Quick Capacitor / native health readiness check.
 * Usage: npm run cap:doctor
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { platform as osPlatform } from 'os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function bad(msg) {
  console.log(`  ✖ ${msg}`);
}
function info(msg) {
  console.log(`  · ${msg}`);
}

console.log('\nSalvazion Capacitor doctor\n');

const checks = [];

function check(name, cond, fix) {
  if (cond) {
    ok(name);
    checks.push(true);
  } else {
    bad(`${name}${fix ? ` — ${fix}` : ''}`);
    checks.push(false);
  }
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

check('capacitor.config.ts', existsSync(join(root, 'capacitor.config.ts')));
check('native/www/index.html', existsSync(join(root, 'native/www/index.html')));
check('@capacitor/core', Boolean(deps['@capacitor/core']));
check('@capacitor/cli', Boolean(deps['@capacitor/cli']));
check('@capacitor/android', Boolean(deps['@capacitor/android']));
check('@capacitor/ios', Boolean(deps['@capacitor/ios']));
check(
  '@salvazion/capacitor-health',
  Boolean(deps['@salvazion/capacitor-health']),
  'npm i @salvazion/capacitor-health@file:native/capacitor/plugins/SalvazionHealth'
);
check(
  'plugin dist',
  existsSync(join(root, 'native/capacitor/plugins/SalvazionHealth/dist/esm/index.js')) ||
    existsSync(join(root, 'native/capacitor/plugins/SalvazionHealth/dist/plugin.cjs.js')),
  'npm run cap:init'
);
check('android/', existsSync(join(root, 'android')), 'npm run cap:init');
if (osPlatform() === 'darwin') {
  check('ios/', existsSync(join(root, 'ios')), 'npm run cap:init -- --ios-only');
} else {
  info('ios/ skipped on non-macOS (expected)');
}

const server =
  process.env.CAPACITOR_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || '';
if (server) {
  ok(`server URL: ${server}`);
  checks.push(true);
} else {
  bad('CAPACITOR_SERVER_URL / NEXT_PUBLIC_APP_URL not set — shell will show native/www placeholder');
  checks.push(false);
}

const statusPath = join(root, 'native/capacitor/.init-status.json');
if (existsSync(statusPath)) {
  info(`last init: ${JSON.parse(readFileSync(statusPath, 'utf8')).initializedAt}`);
}

const passed = checks.filter(Boolean).length;
const total = checks.length;
console.log(`\n${passed}/${total} checks passed\n`);
process.exit(passed === total ? 0 : 1);
