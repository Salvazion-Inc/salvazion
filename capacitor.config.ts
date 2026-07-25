import type { CapacitorConfig } from '@capacitor/cli';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Salvazion native shell (Capacitor).
 *
 * Loads the live Next.js / Vercel app by default so OAuth cookies and API
 * routes work. Override with CAPACITOR_SERVER_URL or NEXT_PUBLIC_APP_URL.
 *
 * Local offline fallback UI lives in native/www (webDir).
 */
function loadDotEnvLocal(): void {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  try {
    const text = readFileSync(p, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

loadDotEnvLocal();

const serverUrl = (
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  ''
).replace(/\/$/, '');

const config: CapacitorConfig = {
  appId: 'org.salvazion.app',
  appName: 'Salvazion',
  webDir: 'native/www',
  // Bundled assets when server.url is unset; otherwise Capacitor loads remote.
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith('http://'),
          androidScheme: 'https',
          iosScheme: 'https',
        },
      }
    : {
        server: {
          androidScheme: 'https',
          iosScheme: 'https',
        },
      }),
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#040404',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#040404',
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
};

export default config;
