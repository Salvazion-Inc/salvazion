import { NextResponse } from 'next/server';
import {
  getAiUsageOverview,
  getRequestUser,
  unsignedUsageOverview,
} from '@/lib/billing/ai-usage';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getRequestUser();
    if (!user) {
      return NextResponse.json(unsignedUsageOverview());
    }
    const overview = await getAiUsageOverview(user.id, user.email);
    return NextResponse.json(overview);
  } catch (e) {
    console.error('[billing/ai-usage]', e);
    return NextResponse.json(unsignedUsageOverview());
  }
}
