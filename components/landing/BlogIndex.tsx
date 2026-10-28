import { X_ARTICLES, localizeArticle } from '@/lib/freedom/x-articles';

/**
 * Server-only crawlable index of every @salvazion_ article → X (sr-only).
 * Rendered on the server so the catalog stays out of the client bundle.
 */
export default function BlogIndex({ lang = 'en' }: { lang?: 'en' | 'es' | 'pt' }) {
  return (
    <ul>
      {X_ARTICLES.map((a) => {
        const loc = localizeArticle(a, lang);
        return (
          <li key={`index-${a.id}`}>
            <a href={a.url} rel="noopener noreferrer">
              {loc.title} — {a.pillar}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
