# Salvazion native shell (Capacitor)

Brings **HealthKit (iOS)** and **Health Connect (Android)** into Salvazion Health.

The Next.js app stays the UI. Capacitor wraps the production URL (or static export) and injects the `SalvazionHealth` plugin.

## Prerequisites

- Node 20+
- Xcode 15+ (iOS)
- Android Studio (Android 14+ recommended for Health Connect)
- Apple Developer account (HealthKit entitlement)
- Google Play Console for Health Connect data types declaration

## One-time setup

```bash
# From repo root
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

npx cap init Salvazion com.salvazion.app --web-dir out
# Or point server.url to your Vercel deploy for live reload style shell:

# capacitor.config.ts is provided in this folder — copy to project root or merge.
```

Copy / merge `native/capacitor/capacitor.config.ts` into the app root, then:

```bash
npx cap add ios
npx cap add android
```

### Wire the plugin

1. Copy `native/capacitor/plugins/SalvazionHealth` into the Capacitor project (or publish as local package).
2. Register in `MainActivity` / iOS AppDelegate as per Capacitor custom plugin docs.
3. Enable capabilities:
   - **iOS**: HealthKit → Read (steps, distance, heart rate, HRV, sleep, SpO2, energy, weight)
   - **Android**: Health Connect permissions in `AndroidManifest.xml` (see plugin README)

### Build

```bash
# Option A: load remote PWA
# capacitor.config.ts → server.url = https://your-app.vercel.app

# Option B: static export (if you switch next.config output)
npm run build
npx cap sync
npx cap open ios
npx cap open android
```

## Privacy

- Request only read scopes needed for Health pillar.
- Show purpose strings in App Store / Play listing: *“Salvazion reads activity and sleep to score Health.”*
- Do not write medical claims; estimates feed Salvation / Health / Freedom gamification.

## Env

Native shell uses the same API backend. Set OAuth redirect URIs to your production domain for Fitbit / Oura / WHOOP / Garmin.
