/**
 * Amazon Associates tags for book store links.
 * Set in Vercel / .env.local:
 *   NEXT_PUBLIC_AMAZON_TAG=yourtag-20
 */

export function getAmazonTag(): string {
  return (process.env.NEXT_PUBLIC_AMAZON_TAG || 'salvazion-20').trim();
}

/** Amazon product URL with Associates tag */
export function amazonProductUrl(
  asin: string,
  marketplace: 'com' | 'com.mx' | 'es' = 'com'
): string {
  const tag = getAmazonTag();
  const base = `https://www.amazon.${marketplace}/dp/${asin}`;
  return tag ? `${base}?tag=${encodeURIComponent(tag)}` : base;
}

/** Amazon keyword search with Associates tag (fallback) */
export function amazonSearchUrl(
  query: string,
  marketplace: 'com' | 'com.mx' | 'es' = 'com'
): string {
  const tag = getAmazonTag();
  const q = encodeURIComponent(query);
  const base = `https://www.amazon.${marketplace}/s?k=${q}`;
  return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
}
