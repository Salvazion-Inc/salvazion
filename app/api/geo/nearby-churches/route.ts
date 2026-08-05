import { NextResponse } from 'next/server';
import {
  SEARCH_RADIUS_M,
  churchesFromOverpassElements,
  fetchOverpassChurches,
  reverseGeocode,
} from '@/lib/freedom/churches';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Nearby Christian assemblies / evangelical churches.
 * Proxies Overpass + Nominatim with a proper User-Agent (browser cannot set it).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      lat?: number;
      lon?: number;
      radiusM?: number;
      lang?: 'en' | 'es';
      reverse?: boolean;
    };

    const lat = Number(body.lat);
    const lon = Number(body.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'invalid_coords' }, { status: 400 });
    }
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return NextResponse.json({ error: 'invalid_coords' }, { status: 400 });
    }

    const radiusM = Math.max(
      1000,
      Math.min(Number(body.radiusM) || SEARCH_RADIUS_M, 25_000)
    );
    const es = body.lang !== 'en';

    const [elements, reverse] = await Promise.all([
      fetchOverpassChurches(lat, lon, radiusM),
      body.reverse === false
        ? Promise.resolve(null)
        : reverseGeocode(lat, lon).catch(() => null),
    ]);

    const churches = churchesFromOverpassElements(elements, lat, lon, es);

    return NextResponse.json({
      churches,
      count: churches.length,
      radiusM,
      lat,
      lon,
      label: reverse?.label || null,
      city: reverse?.city || null,
      country: reverse?.country || null,
    });
  } catch (e) {
    console.error('[geo/nearby-churches]', e);
    return NextResponse.json(
      { error: 'geo_failed', message: e instanceof Error ? e.message : 'failed' },
      { status: 502 }
    );
  }
}
