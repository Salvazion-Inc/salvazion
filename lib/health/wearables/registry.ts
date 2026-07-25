import type { WearableCatalogItem } from './types';

/** Supported brands / device classes users can link */
export const WEARABLE_CATALOG: WearableCatalogItem[] = [
  {
    brandId: 'generic_ble_hr',
    name: 'Bluetooth heart-rate monitor',
    nameEs: 'Monitor cardíaco Bluetooth',
    category: 'chest_strap',
    connectModes: ['web_bluetooth_hr'],
    metrics: ['heart_rate', 'active_minutes'],
    icon: '❤️',
    note: 'Works now via Web Bluetooth (chest straps, some watches/bands).',
    noteEs: 'Funciona ahora con Web Bluetooth (cintas, algunos relojes/bandas).',
  },
  {
    brandId: 'polar',
    name: 'Polar (H10 / watches)',
    nameEs: 'Polar (H10 / relojes)',
    category: 'chest_strap',
    connectModes: ['web_bluetooth_hr', 'manual'],
    metrics: ['heart_rate', 'steps', 'active_minutes', 'calories'],
    icon: '📡',
  },
  {
    brandId: 'apple_watch',
    name: 'Apple Watch',
    nameEs: 'Apple Watch',
    category: 'watch',
    connectModes: ['healthkit', 'manual'],
    metrics: ['heart_rate', 'resting_hr', 'hrv', 'steps', 'active_minutes', 'sleep_hours', 'calories'],
    icon: '⌚',
    note: 'HealthKit in Salvazion native shell (iOS). Manual fallback on web.',
    noteEs: 'HealthKit en el shell nativo Salvazion (iOS). Manual en web.',
  },
  {
    brandId: 'garmin',
    name: 'Garmin',
    nameEs: 'Garmin',
    category: 'watch',
    connectModes: ['oauth', 'manual'],
    metrics: ['heart_rate', 'steps', 'active_minutes', 'sleep_hours', 'distance_km', 'calories', 'stress'],
    icon: '⌚',
    note: 'OAuth 2.0 via Garmin Connect Developer Program.',
    noteEs: 'OAuth 2.0 con Garmin Connect Developer Program.',
  },
  {
    brandId: 'fitbit',
    name: 'Fitbit',
    nameEs: 'Fitbit',
    category: 'band',
    connectModes: ['oauth', 'manual'],
    metrics: ['heart_rate', 'steps', 'active_minutes', 'sleep_hours', 'calories', 'spo2'],
    icon: '⌚',
    note: 'OAuth 2.0 + PKCE. Requires FITBIT_CLIENT_ID/SECRET.',
    noteEs: 'OAuth 2.0 + PKCE. Requiere FITBIT_CLIENT_ID/SECRET.',
  },
  {
    brandId: 'samsung',
    name: 'Samsung Galaxy Watch / Ring',
    nameEs: 'Samsung Galaxy Watch / Ring',
    category: 'watch',
    connectModes: ['health_connect', 'manual'],
    metrics: ['heart_rate', 'steps', 'sleep_hours', 'spo2', 'stress'],
    icon: '⌚',
    note: 'Health Connect in Salvazion native shell (Android).',
    noteEs: 'Health Connect en el shell nativo Salvazion (Android).',
  },
  {
    brandId: 'oura',
    name: 'Oura Ring',
    nameEs: 'Anillo Oura',
    category: 'ring',
    connectModes: ['oauth', 'manual'],
    metrics: ['resting_hr', 'hrv', 'sleep_hours', 'readiness', 'steps', 'calories'],
    icon: '💍',
    note: 'OAuth 2.0 via Oura Cloud API.',
    noteEs: 'OAuth 2.0 con Oura Cloud API.',
  },
  {
    brandId: 'whoop',
    name: 'WHOOP',
    nameEs: 'WHOOP',
    category: 'band',
    connectModes: ['oauth', 'manual'],
    metrics: ['resting_hr', 'hrv', 'sleep_hours', 'readiness', 'calories'],
    icon: '💪',
    note: 'OAuth 2.0 via WHOOP Developer API.',
    noteEs: 'OAuth 2.0 con WHOOP Developer API.',
  },
  {
    brandId: 'ultrahuman',
    name: 'Ultrahuman Ring',
    nameEs: 'Anillo Ultrahuman',
    category: 'ring',
    connectModes: ['manual', 'health_connect', 'healthkit'],
    metrics: ['resting_hr', 'hrv', 'sleep_hours', 'readiness', 'spo2'],
    icon: '💍',
  },
  {
    brandId: 'amazfit',
    name: 'Amazfit / Zepp',
    nameEs: 'Amazfit / Zepp',
    category: 'watch',
    connectModes: ['manual', 'web_bluetooth_hr'],
    metrics: ['heart_rate', 'steps', 'sleep_hours', 'active_minutes'],
    icon: '⌚',
  },
  {
    brandId: 'withings',
    name: 'Withings (scale / watch)',
    nameEs: 'Withings (báscula / reloj)',
    category: 'scale',
    connectModes: ['manual', 'oauth_planned'],
    metrics: ['weight_kg', 'body_fat', 'heart_rate', 'sleep_hours'],
    icon: '⚖️',
  },
  {
    brandId: 'xiaomi',
    name: 'Xiaomi / Mi Band',
    nameEs: 'Xiaomi / Mi Band',
    category: 'band',
    connectModes: ['manual', 'web_bluetooth_hr'],
    metrics: ['heart_rate', 'steps', 'sleep_hours', 'active_minutes'],
    icon: '⌚',
  },
  {
    brandId: 'generic_other',
    name: 'Other wearable / monitor',
    nameEs: 'Otro wearable / monitor',
    category: 'other',
    connectModes: ['manual'],
    metrics: ['heart_rate', 'steps', 'sleep_hours', 'active_minutes', 'weight_kg'],
    icon: '📟',
  },
];

// Fix whoop icon - I accidentally used invalid types. Let me fix in a rewrite of whoop entry via search_replace after.
export function getCatalogItem(brandId: string) {
  return WEARABLE_CATALOG.find((c) => c.brandId === brandId);
}

export function catalogByCategory() {
  const map = new Map<string, WearableCatalogItem[]>();
  for (const item of WEARABLE_CATALOG) {
    const list = map.get(item.category) || [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}
