/**
 * Automate Capacitor init for Salvazion.
 *
 * Usage:
 *   npm run cap:init
 *   npm run cap:init -- --android-only
 *   npm run cap:init -- --ios-only
 *   npm run cap:init -- --force
 *
 * Env:
 *   CAPACITOR_SERVER_URL / NEXT_PUBLIC_APP_URL — remote app URL loaded by the shell
 */

import { spawnSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  cpSync,
  readdirSync,
  statSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { platform as osPlatform } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const isWin = osPlatform() === 'win32';
const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const androidOnly = args.has('--android-only');
const iosOnly = args.has('--ios-only');

function log(msg) {
  console.log(`[cap:init] ${msg}`);
}

function warn(msg) {
  console.warn(`[cap:init] ⚠ ${msg}`);
}

function fail(msg) {
  console.error(`[cap:init] ✖ ${msg}`);
  process.exit(1);
}

function quote(s) {
  if (s.includes(' ') && !s.startsWith('"')) return `"${s}"`;
  return s;
}

function run(cmd, cmdArgs, opts = {}) {
  log(`$ ${cmd} ${cmdArgs.join(' ')}`);
  // Paths with spaces (e.g. "Salvazion App") break unquoted shell spawns on Windows.
  // Prefer shell:false with absolute .cmd via node, or quote for shell.
  if (isWin && cmd.endsWith('.cmd')) {
    const line = [quote(cmd), ...cmdArgs.map(quote)].join(' ');
    const r = spawnSync(line, {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: process.env,
      ...opts,
    });
    if (r.status !== 0 && !opts.allowFail) {
      fail(`Command failed (${r.status}): ${cmd} ${cmdArgs.join(' ')}`);
    }
    return r.status ?? 1;
  }
  const r = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: process.env,
    ...opts,
  });
  if (r.status !== 0 && !opts.allowFail) {
    fail(`Command failed (${r.status}): ${cmd} ${cmdArgs.join(' ')}`);
  }
  return r.status ?? 1;
}

function runNodeBin(bin, binArgs, opts = {}) {
  // Always invoke via `npx`/`node` to avoid .cmd path-space issues on Windows
  if (bin === 'cap' || bin === 'tsc') {
    return run(
      process.execPath,
      [join(root, 'node_modules', bin === 'cap' ? '@capacitor/cli/bin/capacitor' : 'typescript/bin/tsc'), ...binArgs],
      opts
    );
  }
  const local = join(root, 'node_modules', '.bin', isWin ? `${bin}.cmd` : bin);
  if (existsSync(local)) {
    return run(local, binArgs, opts);
  }
  return run(process.execPath, [join(root, 'node_modules/npm/bin/npx-cli.js'), bin, ...binArgs], opts);
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function readText(p) {
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

function writeIfMissingOrForce(p, content) {
  if (existsSync(p) && !force) {
    log(`keep ${p.replace(root + '\\', '').replace(root + '/', '')}`);
    return false;
  }
  ensureDir(dirname(p));
  writeFileSync(p, content, 'utf8');
  log(`write ${p.replace(root + '\\', '').replace(root + '/', '')}`);
  return true;
}

function patchFile(p, patchFn, label) {
  if (!existsSync(p)) {
    warn(`skip patch (missing): ${label}`);
    return;
  }
  const before = readFileSync(p, 'utf8');
  const after = patchFn(before);
  if (after !== before) {
    writeFileSync(p, after, 'utf8');
    log(`patched ${label}`);
  } else {
    log(`ok ${label}`);
  }
}

// ─── 1) Prerequisites ──────────────────────────────────────────
log('Salvazion Capacitor init');
log(`cwd: ${root}`);
log(`platform: ${osPlatform()}`);

if (!existsSync(join(root, 'package.json'))) {
  fail('package.json not found — run from repo root');
}

// ─── 2) Ensure Capacitor packages ──────────────────────────────
const requiredPkgs = [
  '@capacitor/core',
  '@capacitor/cli',
  '@capacitor/android',
  '@capacitor/ios',
  '@capacitor/app',
  '@capacitor/splash-screen',
  '@capacitor/status-bar',
];

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const have = { ...pkg.dependencies, ...pkg.devDependencies };
const missing = requiredPkgs.filter((p) => !have[p]);
const healthPath = 'file:native/capacitor/plugins/SalvazionHealth';
const needHealth =
  !have['@salvazion/capacitor-health'] ||
  have['@salvazion/capacitor-health'] !== healthPath;

if (missing.length || needHealth) {
  log('Installing Capacitor packages…');
  const installArgs = ['install', ...missing, '@salvazion/capacitor-health@' + healthPath, '-D'];
  // health as dependency for runtime register
  run('npm', [
    'install',
    ...missing,
    '@capacitor/core',
    '@capacitor/app',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
  ]);
  run('npm', ['install', '-D', '@capacitor/cli', '@capacitor/android', '@capacitor/ios']);
  run('npm', ['install', '@salvazion/capacitor-health@file:native/capacitor/plugins/SalvazionHealth']);
} else {
  log('Capacitor packages already present');
}

// ─── 3) Build local health plugin (tsc) ────────────────────────
const pluginRoot = join(root, 'native/capacitor/plugins/SalvazionHealth');
const pluginTsconfig = join(pluginRoot, 'tsconfig.json');
if (existsSync(pluginTsconfig)) {
  log('Building @salvazion/capacitor-health…');
  runNodeBin('tsc', ['-p', pluginTsconfig], { allowFail: true });
  // Minimal dist fallback if tsc failed: copy JS stubs
  const distIndex = join(pluginRoot, 'dist/esm/index.js');
  if (!existsSync(distIndex)) {
    ensureDir(join(pluginRoot, 'dist/esm'));
    writeFileSync(
      join(pluginRoot, 'dist/esm/definitions.js'),
      'export {};\n',
      'utf8'
    );
    writeFileSync(
      join(pluginRoot, 'dist/esm/web.js'),
      `export class SalvazionHealthWeb {
  async isAvailable() { return { platform: 'web', healthKit: false, healthConnect: false }; }
  async requestAuthorization() { return { authorized: false }; }
  async queryToday() { return {}; }
}
`,
      'utf8'
    );
    writeFileSync(
      join(pluginRoot, 'dist/esm/index.js'),
      `import { registerPlugin } from '@capacitor/core';
const SalvazionHealth = registerPlugin('SalvazionHealth', {
  web: () => import('./web.js').then((m) => new m.SalvazionHealthWeb()),
});
export { SalvazionHealth };
export * from './definitions.js';
`,
      'utf8'
    );
    writeFileSync(
      join(pluginRoot, 'dist/plugin.cjs.js'),
      `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@capacitor/core");
const SalvazionHealth = core.registerPlugin("SalvazionHealth");
exports.SalvazionHealth = SalvazionHealth;
`,
      'utf8'
    );
    writeFileSync(
      join(pluginRoot, 'dist/esm/index.d.ts'),
      `export * from './definitions';
export declare const SalvazionHealth: import('./definitions').SalvazionHealthPlugin;
`,
      'utf8'
    );
    writeFileSync(
      join(pluginRoot, 'dist/esm/definitions.d.ts'),
      `export interface SalvazionHealthPlugin {
  isAvailable(): Promise<{ platform: 'ios' | 'android' | 'web'; healthKit: boolean; healthConnect: boolean }>;
  requestAuthorization(options?: { read?: string[] }): Promise<{ authorized: boolean }>;
  queryToday(): Promise<Record<string, number | string | undefined>>;
}
`,
      'utf8'
    );
    log('wrote minimal plugin dist fallback');
  }
}

// ─── 4) Ensure www + config ────────────────────────────────────
ensureDir(join(root, 'native/www'));
if (!existsSync(join(root, 'native/www/index.html'))) {
  fail('native/www/index.html missing');
}
if (!existsSync(join(root, 'capacitor.config.ts'))) {
  fail('capacitor.config.ts missing at repo root');
}

// ─── 5) Add platforms ──────────────────────────────────────────
const wantAndroid = !iosOnly;
const wantIos = !androidOnly;

if (wantAndroid) {
  if (!existsSync(join(root, 'android')) || force) {
    if (existsSync(join(root, 'android')) && force) {
      warn('--force will re-run cap add android only if folder missing; delete android/ to recreate');
    }
    if (!existsSync(join(root, 'android'))) {
      log('Adding Android platform…');
      runNodeBin('cap', ['add', 'android']);
    } else {
      log('android/ already exists');
    }
  } else {
    log('android/ already exists');
  }
}

if (wantIos) {
  if (osPlatform() === 'darwin') {
    if (!existsSync(join(root, 'ios'))) {
      log('Adding iOS platform…');
      runNodeBin('cap', ['add', 'ios']);
    } else {
      log('ios/ already exists');
    }
  } else {
    warn('iOS platform requires macOS + Xcode — skipping `cap add ios` on this machine');
    warn('On a Mac run: npm run cap:init -- --ios-only');
  }
}

// ─── 6) Sync native projects ───────────────────────────────────
log('Running cap sync…');
runNodeBin('cap', ['sync'], { allowFail: true });

// ─── 7) Patch Android Health Connect / permissions ─────────────
const androidManifest = join(root, 'android/app/src/main/AndroidManifest.xml');
if (existsSync(androidManifest)) {
  patchFile(
    androidManifest,
    (src) => {
      let out = src;
      const perms = [
        'android.permission.health.READ_STEPS',
        'android.permission.health.READ_DISTANCE',
        'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
        'android.permission.health.READ_EXERCISE',
        'android.permission.health.READ_HEART_RATE',
        'android.permission.health.READ_RESTING_HEART_RATE',
        'android.permission.health.READ_SLEEP',
        'android.permission.health.READ_WEIGHT',
        'android.permission.ACTIVITY_RECOGNITION',
      ];
      for (const p of perms) {
        const tag = `<uses-permission android:name="${p}" />`;
        if (!out.includes(p)) {
          out = out.replace(
            /<manifest[^>]*>/,
            (m) => `${m}\n    ${tag}`
          );
        }
      }
      if (!out.includes('com.google.android.apps.healthdata')) {
        if (out.includes('</manifest>')) {
          out = out.replace(
            '</manifest>',
            `    <queries>\n        <package android:name="com.google.android.apps.healthdata" />\n    </queries>\n</manifest>`
          );
        }
      }
      return out;
    },
    'AndroidManifest.xml permissions'
  );
}

// ─── 8) Patch iOS Info.plist HealthKit usage ───────────────────
function findInfoPlist() {
  const base = join(root, 'ios/App');
  if (!existsSync(base)) return null;
  const stack = [base];
  while (stack.length) {
    const d = stack.pop();
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) stack.push(p);
      else if (name === 'Info.plist') return p;
    }
  }
  return null;
}

const infoPlist = findInfoPlist();
if (infoPlist) {
  patchFile(
    infoPlist,
    (src) => {
      if (src.includes('NSHealthShareUsageDescription')) return src;
      // Insert keys before </dict>\n</plist>
      const block = `
	<key>NSHealthShareUsageDescription</key>
	<string>Salvazion lee actividad, sueño y frecuencia cardíaca para tu score Health (Salvation, Health, Freedom).</string>
	<key>NSHealthUpdateUsageDescription</key>
	<string>Salvazion no escribe datos médicos; solo lectura para indicadores de Health.</string>
`;
      if (src.includes('</dict>')) {
        return src.replace('</dict>', `${block}</dict>`);
      }
      return src;
    },
    'iOS Info.plist HealthKit strings'
  );
}

// ─── 9) Write status marker ────────────────────────────────────
const status = {
  initializedAt: new Date().toISOString(),
  platform: osPlatform(),
  android: existsSync(join(root, 'android')),
  ios: existsSync(join(root, 'ios')),
  serverUrl:
    process.env.CAPACITOR_SERVER_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    null,
  plugin: '@salvazion/capacitor-health',
};
writeFileSync(join(root, 'native/capacitor/.init-status.json'), JSON.stringify(status, null, 2));
log('wrote native/capacitor/.init-status.json');

// ─── 10) Summary ───────────────────────────────────────────────
console.log(`
[cap:init] Done.

Next steps:
  1. Set CAPACITOR_SERVER_URL or NEXT_PUBLIC_APP_URL to your Vercel URL
  2. npm run cap:sync
  3. Android:  npm run cap:open:android
  4. iOS (Mac): npm run cap:open:ios  → enable HealthKit capability in Xcode
  5. Build & run on a device with Health Connect / Health app data

Doctor:  npm run cap:doctor
`);
