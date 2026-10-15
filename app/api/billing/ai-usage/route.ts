import { NextResponse } from 'next/server';
import { getAiUsageOverview, getRequestUser } from '@/lib/billing/ai-usage';
import { authRequiredResponse, unverifiedEmailResponse } from '@/lib/auth/api-guard';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getRequestUser();
    if (!user) return authRequiredResponse();
    if (!user.emailConfirmedAt) return unverifiedEmailResponse();
    const overview = await getAiUsageOverview(user.id, user.email);
    return NextResponse.json(overview);
  } catch (e) {
    console.error('[billing/ai-usage]', e);
    return authRequiredResponse();
  }
}
