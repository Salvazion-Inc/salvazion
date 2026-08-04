# Wearables Cloud OAuth — setup (Fitbit · Oura · WHOOP · Garmin)

Las **credenciales de desarrollador** las configura Salvazion en el servidor.  
El **usuario final** solo inicia sesión en su cuenta del wearable y autoriza la app.

> **Fitbit (sep 2026):** la Fitbit Web API legacy se apaga.  
> Salvazion usa **Google Health API** + Google OAuth.  
> Guía dedicada: **[google-health-api-setup.md](./google-health-api-setup.md)**

App pública: `https://salvazion.org`  
Callback base:

```text
https://salvazion.org/api/wearables/oauth/{provider}/callback
```

| Provider | `{provider}` | Variables de entorno |
|----------|--------------|----------------------|
| Fitbit (Google Health) | `fitbit` | `GOOGLE_HEALTH_CLIENT_ID`, `GOOGLE_HEALTH_CLIENT_SECRET` |
| Oura | `oura` | `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET` |
| WHOOP | `whoop` | `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET` |
| Garmin | `garmin` | `GARMIN_CLIENT_ID`, `GARMIN_CLIENT_SECRET` |

También (ya en la app):

- `NEXT_PUBLIC_APP_URL=https://salvazion.org` (sin `/` final)
- `WEARABLES_TOKEN_SECRET` — secreto largo para cifrar tokens en cookies httpOnly

Cloud OAuth está detrás de **Salvazion Premium** (`/api/wearables/oauth/{provider}/start`).

---

## Redirect URIs a registrar en cada portal

Copia **exactamente** (producción):

```text
https://salvazion.org/api/wearables/oauth/fitbit/callback
https://salvazion.org/api/wearables/oauth/oura/callback
https://salvazion.org/api/wearables/oauth/whoop/callback
https://salvazion.org/api/wearables/oauth/garmin/callback
```

Opcional para desarrollo local (`npm run dev`):

```text
http://localhost:3000/api/wearables/oauth/fitbit/callback
http://localhost:3000/api/wearables/oauth/oura/callback
http://localhost:3000/api/wearables/oauth/whoop/callback
http://localhost:3000/api/wearables/oauth/garmin/callback
```

Si usas localhost en local, pon temporalmente:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

y vuelve a `https://salvazion.org` para producción / Vercel.

---

## 1. Fitbit → Google Health API (no uses dev.fitbit.com para apps nuevas)

Portal: [Google Cloud Console](https://console.cloud.google.com/) + [Health API setup](https://developers.google.com/health/setup)

Pasos completos: **[google-health-api-setup.md](./google-health-api-setup.md)**

Resumen:

1. Habilita **Google Health API** en un proyecto GCP.  
2. OAuth consent (External) + scopes `googlehealth.*.readonly`.  
3. Cliente **Web** con redirect:  
   `https://salvazion.org/api/wearables/oauth/fitbit/callback`  
4. Env:

```env
GOOGLE_HEALTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_HEALTH_CLIENT_SECRET=GOCSPX-xxxxx
```

El usuario inicia sesión con **Google** (cuenta vinculada a Fitbit / Pixel Watch), no con el OAuth Fitbit legacy.

---

## 2. Oura

Portal: [https://cloud.ouraring.com/oauth/applications](https://cloud.ouraring.com/oauth/applications)

1. **Create a new application** (o edita).
2. Rellena nombre, website, privacy/terms (`https://salvazion.org`, `/privacy`, `/terms`).
3. **Redirect URI(s):**  
   `https://salvazion.org/api/wearables/oauth/oura/callback`
4. Copia **Client ID** y **Client Secret**.
5. Env:

```env
OURA_CLIENT_ID=...
OURA_CLIENT_SECRET=...
```

Scopes en código:  
`email personal daily heartrate workout session spo2`

---

## 3. WHOOP

Portal: [https://developer.whoop.com/](https://developer.whoop.com/)

1. Crea una app / OAuth client en el Developer Dashboard.
2. **Redirect URI:**  
   `https://salvazion.org/api/wearables/oauth/whoop/callback`
3. Activa scopes de lectura: recovery, cycles, sleep, workout, profile, body measurement (alineados con el código).
4. Copia Client ID y Client Secret.
5. Env:

```env
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
```

---

## 4. Garmin

Portal: [https://developerportal.garmin.com/](https://developerportal.garmin.com/)

Garmin suele requerir **registro y a veces aprobación** del Garmin Connect Developer Program.

1. Solicita / crea aplicación OAuth 2.0 (PKCE).
2. **Redirect URI:**  
   `https://salvazion.org/api/wearables/oauth/garmin/callback`
3. Scopes orientativos (código actual):  
   `ACTIVITY_EXPORT`, `HEALTH_EXPORT`, `WORKOUT_IMPORT`  
   (ajusta en el portal si Garmin te asigna nombres distintos; en ese caso actualiza `lib/health/wearables/oauth/providers.ts`).
4. Copia Client ID y Client Secret.
5. Env:

```env
GARMIN_CLIENT_ID=...
GARMIN_CLIENT_SECRET=...
```

---

## Dónde pegar las variables

### Local (`.env.local`)

Ya hay placeholders. Tras crear cada app:

```env
NEXT_PUBLIC_APP_URL=https://salvazion.org
WEARABLES_TOKEN_SECRET=<ya generado — no lo subas a git>
GOOGLE_HEALTH_CLIENT_ID=...
GOOGLE_HEALTH_CLIENT_SECRET=...
OURA_CLIENT_ID=...
OURA_CLIENT_SECRET=...
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
GARMIN_CLIENT_ID=...
GARMIN_CLIENT_SECRET=...
```

Reinicia `npm run dev` después de editar.

### Producción (Vercel)

1. Vercel → proyecto **salvazion-app** (o el nombre actual) → **Settings** → **Environment Variables**
2. Añade las mismas claves para **Production** (y Preview si quieres probar PRs).
3. **Redeploy** (las env solo aplican en deploys nuevos).

No subas secretos a git. `.env.local` está en `.gitignore`.

---

## Comprobar que está bien

### 1. Status API

Con el servidor en marcha:

```bash
curl -s https://salvazion.org/api/wearables/oauth/status
# o local:
curl -s http://localhost:3000/api/wearables/oauth/status
```

Respuesta esperada (por proveedor):

```json
{
  "providers": [
    { "id": "fitbit", "name": "Fitbit", "configured": true, "connected": false },
    ...
  ]
}
```

- `configured: true` → hay CLIENT_ID + SECRET en el servidor.
- `connected: true` → el usuario actual ya autorizó (cookie de sesión OAuth).

### 2. En la app

1. Inicia sesión con una cuenta **Premium**.
2. **Health Hub → Wearables → Cloud OAuth**.
3. El proveedor debe decir **Listo** / **Ready**, no “No disponible aún…”.
4. **Conectar** → consent del proveedor → vuelta a Wearables con mensaje de éxito.
5. **Sincronizar hoy** → importan métricas.

### 3. Script local (opcional)

```bash
node scripts/verify-wearables-oauth.mjs
```

---

## Flujo técnico (resumen)

1. Usuario → `GET /api/wearables/oauth/{provider}/start`
2. Premium check + PKCE + cookie de flujo
3. Redirect al login del proveedor
4. Callback → intercambio de code → tokens en cookie sellada (`WEARABLES_TOKEN_SECRET`)
5. `POST /api/wearables/oauth/{provider}/sync` → métricas del día → Health score / auto-log

Código:

- Providers: `lib/health/wearables/oauth/providers.ts`
- Start / callback / sync / disconnect: `app/api/wearables/oauth/`
- UI: `components/health/CloudNativeSyncPanel.tsx`

---

## Checklist rápido

- [ ] `NEXT_PUBLIC_APP_URL=https://salvazion.org`
- [ ] `WEARABLES_TOKEN_SECRET` definido (local + Vercel)
- [ ] Fitbit app + redirect + env
- [ ] Oura app + redirect + env
- [ ] WHOOP app + redirect + env
- [ ] Garmin app + redirect + env (+ aprobación si aplica)
- [ ] Variables en Vercel Production + redeploy
- [ ] `/api/wearables/oauth/status` → `configured: true`
- [ ] Prueba Conectar + Sincronizar con usuario Premium

---

## Problemas frecuentes

| Síntoma | Causa probable |
|---------|----------------|
| “No disponible aún…” | Faltan CLIENT_ID/SECRET o no se redesplegó Vercel |
| `premium_required` / 402 | Usuario no Premium |
| `redirect_uri_mismatch` | URI en el portal ≠ la de `getRedirectUri` (revisa trailing slash y dominio) |
| Callback error `invalid_state` | Cookie de flujo bloqueada / dominios distintos |
| Sync vacío | Scopes insuficientes o sin datos del día en el proveedor |
| Localhost no vuelve a la app | Falta URI localhost en el portal o `NEXT_PUBLIC_APP_URL` apunta a producción |

---

## Orden recomendado

1. **Fitbit / Google Health** (obligatorio antes de 2026-09-30; verificación OAuth restringida).  
2. **Oura**.  
3. **WHOOP**.  
4. **Garmin** (más lento por programa de desarrolladores).  

Sin un proveedor aún, la app sigue usable con **sensores del teléfono**, **BLE** y **registro manual**.
