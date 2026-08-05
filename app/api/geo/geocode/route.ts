import { NextResponse } from 'next/server';
import { geocodePlace, reverseGeocode } from '@/lib/freedom/churches';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Forward geocode (q) or reverse geocode (lat/lon).
 * Server-side Nominatim with User-Agent.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      q?: string;
      lat?: number;
      lon?: number;
    };

    if (body.q && body.q.trim()) {
      const hit = await geocodePlace(body.q.trim());
      if (!hit) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }
      return NextResponse.json(hit);
    }

    const lat = Number(body.lat);
    const lon = Number(body.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const rev = await reverseGeocode(lat, lon);
    return NextResponse.json(rev);
  } catch (e) {
    console.error('[geo/geocode]', e);
    return NextResponse.json(
      { error: 'geo_failed', message: e instanceof Error ? e.message : 'failed' },
      { status: 502 }
    );
  }
}
