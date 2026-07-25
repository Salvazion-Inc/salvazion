import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config for Salvazion native shell.
 * Copy/merge to project root when running `npx cap`.
 *
 * Prefer server.url for the live Next.js deploy so OAuth cookies work
 * on the same domain as Vercel.
 */
const config: CapacitorConfig = {
  appId: 'org.salvazion.app',
  appName: 'Salvazion',
  webDir: 'out',
  server: {
    // Point to production (or local LAN IP for debug)
    // url: 'https://YOUR_VERCEL_DOMAIN',
    // cleartext: true, // only for http:// LAN debug
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SalvazionHealth: {
      // reserved for future options
    },
  },
};

export default config;
