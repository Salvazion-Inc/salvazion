/**
 * Query Supabase public auth settings for which external providers are on.
 */

export type ExternalProviders = Record<string, boolean>;

export async function fetchExternalProviders(): Promise<{
  projectRef: string;
  external: ExternalProviders;
}> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  let projectRef = 'desconocido';
  try {
    projectRef = new URL(base).hostname.replace('.supabase.co', '');
  } catch {
    /* ignore */
  }

  if (!base || !key) {
    return { projectRef, external: {} };
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/auth/v1/settings`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return { projectRef, external: {} };
    const json = (await res.json()) as { external?: Record<string, unknown> };
    const external: ExternalProviders = {};
    for (const [k, v] of Object.entries(json.external || {})) {
      external[k] = v === true || v === 'true';
    }
    return { projectRef, external };
  } catch {
    return { projectRef, external: {} };
  }
}
