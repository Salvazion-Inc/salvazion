# SalvazionHealth Capacitor plugin

Reads **HealthKit (iOS)** and **Health Connect (Android)** for the Health pillar.

## Methods

| Method | Description |
|--------|-------------|
| `isAvailable()` | Platform + whether HealthKit / Health Connect exists |
| `requestAuthorization({ read })` | Request read permissions |
| `queryToday()` | Aggregate today's steps, activity, sleep, HR, etc. |

## iOS

1. Enable **HealthKit** capability.
2. Add usage descriptions to `Info.plist`:
   - `NSHealthShareUsageDescription` = "Salvazion lee actividad y sueño para tu score Health."
3. Compile `ios/Plugin.swift` into the app target.

## Android

1. Depend on `androidx.health.connect:connect-client`.
2. Declare Health Connect permissions in `AndroidManifest.xml` (read steps, distance, calories, exercise, heart rate, sleep, SpO2, weight).
3. Add intent filter for `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE` as required by Google.
4. Compile `android/SalvazionHealthPlugin.kt`.

## JS registration

```ts
import { registerPlugin } from '@capacitor/core';
import type { SalvazionHealthPlugin } from './definitions';

export const SalvazionHealth = registerPlugin<SalvazionHealthPlugin>('SalvazionHealth', {
  web: () => import('./web').then(m => new m.SalvazionHealthWeb()),
});
```

The web app bridge (`lib/health/wearables/native/bridge.ts`) discovers the plugin via `window.Capacitor.Plugins.SalvazionHealth`.
