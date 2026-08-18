import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/config';

/**
 * Allow crawlers on marketing / legal / auth entry pages.
 * Block private app shell, APIs and auth callbacks.
 * AI / LLM crawlers are explicitly welcome on the public surface.
 */
const PUBLIC_ALLOW = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/terms',
  '/privacy',
  '/llms.txt',
  '/llms-full.txt',
  '/og.jpg',
  '/og.png',
  '/sitemap.xml',
];

const PRIVATE_DISALLOW = [
  '/hub/',
  '/api/',
  '/auth/callback',
  '/auth/confirm',
  '/auth/update-password',
  '/auth/callback/',
];

const AI_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'GoogleOther',
  'Applebot-Extended',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'meta-externalagent',
  'FacebookBot',
  'Amazonbot',
  'YouBot',
  'Diffbot',
  'ImagesiftBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_DISALLOW,
      },
      {
        userAgent: AI_USER_AGENTS,
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_DISALLOW,
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  };
}
