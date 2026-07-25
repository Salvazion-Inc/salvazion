import type { MetadataRoute } from 'next';

/**
 * Web App Manifest — icon + name shown when the user installs
 * Salvazion on the phone home screen (Android / iOS “Add to Home Screen”).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Salvazion',
    short_name: 'Salvazion',
    description:
      'Make Salvation, Health and Freedom Great Again. Phalanx digital con fe, salud y libertad.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#040404',
    theme_color: '#8FD99A',
    categories: ['lifestyle', 'health', 'education'],
    lang: 'es',
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
