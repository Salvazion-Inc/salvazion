import { NextRequest, NextResponse } from 'next/server';

/**
 * Nota: El cálculo real de scores ocurre en el cliente (localStorage)
 * porque aún no hay backend/Supabase.
 * Esta ruta queda preparada para cuando migremos el motor al servidor.
 */
export async function GET() {
  return NextResponse.json({
    message: 'Salvazion Score Engine',
    note: 'Cálculo actual es client-side. Esta API se activará con Supabase + auth.',
    weights: { salvation: 0.40, health: 0.35, freedom: 0.25 },
    streakMultipliers: {
      '3d': 1.15,
      '7d': 1.30,
      '14d': 1.50,
      '30d': 1.80,
      '60d+': 2.00,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Guard against abuse while the endpoint is still a placeholder
    if (JSON.stringify(body).length > 8000) {
      return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 });
    }

    return NextResponse.json({
      success: true,
      received: typeof body === 'object' ? Object.keys(body) : [],
      note: 'Por ahora el logging es client-side vía logAction(). Auth + server validation coming.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}
