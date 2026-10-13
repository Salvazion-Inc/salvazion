import type { MetadataRoute } from 'next';
import { PURPOSE } from '@/lib/seo/config';

/**
 * Web App Manifest — icon + name shown when the user installs
 * Salvazion on the phone home screen (Android / iOS “Add to Home Screen”).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Salvazion — Salvation · Health · Freedom',
    short_name: 'Salvazion',
    description:
      `${PURPOSE}. Offline Bible, devotionals, health and wearables, Freedom library, Community (Green Lion Kings), Salvazion AI and $SALVAZION on Solana.`,
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#040404',
    theme_color: '#8FD99A',
    categories: ['lifestyle', 'health', 'education', 'productivity'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
