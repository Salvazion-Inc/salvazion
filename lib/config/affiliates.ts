/**
 * Affiliate / referral tags for book store links.
 * Set in Vercel / .env.local:
 *   NEXT_PUBLIC_AMAZON_TAG=yourtag-20
 *   NEXT_PUBLIC_ML_AFFILIATE=optional Mercado Libre affiliate id
 */

export function getAmazonTag(): string {
  return (process.env.NEXT_PUBLIC_AMAZON_TAG || 'salvazion-20').trim();
}

export function getMercadoLibreAffiliate(): string {
  return (process.env.NEXT_PUBLIC_ML_AFFILIATE || '').trim();
}

/** Amazon product URL with Associates tag */
export function amazonProductUrl(asin: string, marketplace: 'com' | 'com.mx' | 'es' = 'com'): string {
  const tag = getAmazonTag();
  const base = `https://www.amazon.${marketplace}/dp/${asin}`;
  return tag ? `${base}?tag=${encodeURIComponent(tag)}` : base;
}

/** Amazon keyword search with Associates tag (fallback) */
export function amazonSearchUrl(query: string, marketplace: 'com' | 'com.mx' | 'es' = 'com'): string {
  const tag = getAmazonTag();
  const q = encodeURIComponent(query);
  const base = `https://www.amazon.${marketplace}/s?k=${q}`;
  return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
}

/** Mercado Libre search (optional affiliate param if configured) */
export function mercadoLibreSearchUrl(query: string, site: 'mlm' | 'mla' | 'mlc' | 'mlu' = 'mlm'): string {
  const host: Record<string, string> = {
    mlm: 'listado.mercadolibre.com.mx',
    mla: 'listado.mercadolibre.com.ar',
    mlc: 'listado.mercadolibre.cl',
    mlu: 'listado.mercadolibre.com.uy',
  };
  const q = encodeURIComponent(query).replace(/%20/g, '-');
  let url = `https://${host[site]}/${q}`;
  const aff = getMercadoLibreAffiliate();
  if (aff) {
    url += (url.includes('?') ? '&' : '?') + `matt_tool=${encodeURIComponent(aff)}`;
  }
  return url;
}
