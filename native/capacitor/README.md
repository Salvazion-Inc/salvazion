# Salvazion native shell (Capacitor)

Brings **HealthKit (iOS)** and **Health Connect (Android)** into Salvazion Health.

The Next.js app stays the UI. Capacitor wraps your deployed URL (Vercel) and loads the `SalvazionHealth` plugin.

## One command init

From the **repo root**:

```bash
# Optional: point the shell at production
# Windows PowerShell:
$env:NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

npm run cap:init
```

What `cap:init` does:

1. Installs `@capacitor/*` and `@salvazion/capacitor-health`
2. Builds the local Health plugin
3. Ensures `capacitor.config.ts` + `native/www`
4. Runs `cap add android` (and `cap add ios` on macOS)
5. Runs `cap sync`
6. Patches Android Health Connect permissions (+ iOS Health usage strings on Mac)

### Options

```bash
npm run cap:init -- --android-only
npm run cap:init -- --ios-only          # macOS only
npm run cap:init -- --force
```

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run cap:init` | Full automated init |
| `npm run cap:doctor` | Readiness checklist |
| `npm run cap:sync` | Sync web + plugins → native |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:open:ios` | Open Xcode (Mac) |
| `npm run cap:run:android` | Build & run on device/emulator |
| `npm run cap:plugin:build` | Rebuild Health plugin TS |

## Server URL

`capacitor.config.ts` reads (in order):

1. `CAPACITOR_SERVER_URL`
2. `NEXT_PUBLIC_APP_URL`
3. else loads local `native/www` placeholder

Set in `.env.local` or your shell before `cap:sync`.

## After init

### Android

```bash
npm run cap:open:android
```

- Install **Health Connect** on the device/emulator
- Grant health permissions when prompted
- Run the app

### iOS (Mac + Xcode)

```bash
npm run cap:init -- --ios-only
npm run cap:open:ios
```

In Xcode:

1. Target → **Signing & Capabilities** → **+ HealthKit**
2. Confirm `Info.plist` has `NSHealthShareUsageDescription` (auto-patched by init)

## Plugin sources

```
native/capacitor/plugins/SalvazionHealth/
  src/                 # TypeScript registerPlugin
  ios/Sources/...      # HealthKit Swift
  android/src/main/... # Health Connect Kotlin
```

Linked into the app as:

```json
"@salvazion/capacitor-health": "file:native/capacitor/plugins/SalvazionHealth"
```

## Privacy

- Read-only health data for the Health pillar score
- No clinical claims
- App Store / Play listings must declare HealthKit / Health Connect usage

## OAuth

OAuth (Fitbit/Oura/WHOOP/Garmin) runs in the WebView against your Vercel domain. Configure redirect URIs on that domain (see `docs/wearables-phase-d.md`).
