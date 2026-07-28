import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/config';

/**
 * Allow crawlers on marketing / legal / auth entry pages.
 * Block private app shell, APIs and auth callbacks.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth/login', '/auth/signup', '/terms', '/privacy'],
        disallow: [
          '/hub/',
          '/api/',
          '/auth/callback',
          '/auth/confirm',
          '/auth/update-password',
          '/auth/callback/',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  };
}
