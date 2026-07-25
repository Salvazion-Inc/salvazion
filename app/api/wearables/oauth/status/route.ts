import { NextResponse } from 'next/server';
import { listProviderStatus } from '@/lib/health/wearables/oauth/providers';
import { listConnectedProviders } from '@/lib/health/wearables/oauth/tokens';

export async function GET() {
  const providers = listProviderStatus();
  const connected = await listConnectedProviders();
  return NextResponse.json({
    providers: providers.map((p) => ({
      ...p,
      connected: connected.includes(p.id),
    })),
    native: {
      note: 'HealthKit / Health Connect available in Capacitor native shell',
      bridge: '/lib/health/wearables/native/bridge.ts',
    },
  });
}
