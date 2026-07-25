# Wearables Phase D — OAuth + HealthKit / Health Connect

## OAuth (web + native webview)

| Provider | Env vars | Redirect URI |
|----------|----------|--------------|
| Fitbit | `FITBIT_CLIENT_ID`, `FITBIT_CLIENT_SECRET` | `{APP}/api/wearables/oauth/fitbit/callback` |
| Oura | `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET` | `{APP}/api/wearables/oauth/oura/callback` |
| WHOOP | `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET` | `{APP}/api/wearables/oauth/whoop/callback` |
| Garmin | `GARMIN_CLIENT_ID`, `GARMIN_CLIENT_SECRET` | `{APP}/api/wearables/oauth/garmin/callback` |

Also set:

- `NEXT_PUBLIC_APP_URL` — public site URL (no trailing slash)
- `WEARABLES_TOKEN_SECRET` — long random string to seal tokens in cookies

See `.env.wearables.example`.

### Flow

1. User taps **Conectar** → `GET /api/wearables/oauth/{provider}/start`
2. PKCE + state cookie → provider consent
3. Callback exchanges code → sealed httpOnly cookie
4. **Sincronizar hoy** → provider API → metrics → Health indicators + auto-score

### Developer portals

- Fitbit: https://dev.fitbit.com/
- Oura: https://cloud.ouraring.com/oauth/applications
- WHOOP: https://developer.whoop.com/
- Garmin: https://developerportal.garmin.com/ (approval may be required)

## HealthKit / Health Connect (native shell)

Web browsers cannot access system health stores. Use Capacitor:

1. Follow `native/capacitor/README.md`
2. Install plugin sources under `native/capacitor/plugins/SalvazionHealth`
3. iOS: HealthKit capability + `Plugin.swift`
4. Android: Health Connect client + `SalvazionHealthPlugin.kt`
5. In the app, Health → **Sincronizar desde el sistema de salud**

The JS bridge is `lib/health/wearables/native/bridge.ts`.
