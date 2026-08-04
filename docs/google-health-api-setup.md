# Fitbit → Google Health API (obligatorio desde sep 2026)

Google **apaga la Fitbit Web API legacy el 30 de septiembre de 2026**.  
Salvazion ya usa la **Google Health API** (`health.googleapis.com/v4`) con **Google OAuth 2.0** para el botón “Fitbit”.

- Migración oficial: [developers.google.com/health/migration](https://developers.google.com/health/migration)  
- Setup Cloud/OAuth: [developers.google.com/health/setup](https://developers.google.com/health/setup)  
- Endpoints: [developers.google.com/health/endpoints](https://developers.google.com/health/endpoints)

## Qué cambia para Salvazion

| Antes (legacy) | Ahora (código actual) |
|----------------|------------------------|
| `fitbit.com/oauth2` | `accounts.google.com/o/oauth2/v2/auth` |
| `api.fitbit.com/1/...` | `health.googleapis.com/v4/...` |
| `FITBIT_CLIENT_ID/SECRET` | **`GOOGLE_HEALTH_CLIENT_ID/SECRET`** (preferido) |
| Scopes `activity sleep…` | Scopes `googlehealth.*.readonly` |

La ruta de la app sigue siendo:

```text
https://salvazion.org/api/wearables/oauth/fitbit/callback
```

(el `provider` id se llama `fitbit` por marca UI; el login es **cuenta Google** vinculada a Fitbit/Pixel Watch).

Los usuarios deben **re-autorizar** (los tokens Fitbit legacy **no** se migran).

---

## Paso a paso en Google Cloud

### 1. Proyecto y API

1. Abre [Google Cloud Console](https://console.cloud.google.com/) con la cuenta de Salvazion.  
2. Crea o elige un proyecto (ej. `salvazion-health`).  
3. Habilita **Google Health API**:  
   [console → APIs → health.googleapis.com](https://console.developers.google.com/apis/library/health.googleapis.com)

### 2. Pantalla de consentimiento OAuth

1. **APIs & Services → OAuth consent screen** (Google Auth Platform).  
2. Tipo de usuario: **External**.  
3. Nombre app: `Salvazion`  
4. Support email / developer: `info@salvazion.org`  
5. Dominios autorizados: `salvazion.org`  
6. Privacy / Terms:  
   - `https://salvazion.org/privacy`  
   - `https://salvazion.org/terms`

### 3. Scopes (Data Access)

Añade solo lectura (menos fricción en verificación):

```text
https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly
https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly
https://www.googleapis.com/auth/googlehealth.sleep.readonly
https://www.googleapis.com/auth/googlehealth.profile.readonly
```

**Importante:** los scopes de Google Health son **restricted**. Para **más de ~100 usuarios** o producción amplia hace falta **App Verification / security review**:  
[App verification](https://developers.google.com/health/app-verification)

En modo **Testing** solo pueden conectar emails listados en **Test users**.

### 4. Cliente OAuth (Web)

1. **Credentials → Create credentials → OAuth client ID**  
2. Application type: **Web application**  
3. Name: `Salvazion Health Web`  
4. **Authorized redirect URIs** (exactas):

```text
https://salvazion.org/api/wearables/oauth/fitbit/callback
```

Opcional local:

```text
http://localhost:3000/api/wearables/oauth/fitbit/callback
```

5. Copia **Client ID** y **Client Secret**.

### 5. Variables de entorno

**Local (`.env.local`) y Vercel Production:**

```env
NEXT_PUBLIC_APP_URL=https://salvazion.org
WEARABLES_TOKEN_SECRET=<ya generado>
GOOGLE_HEALTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_HEALTH_CLIENT_SECRET=GOCSPX-xxxxx
```

Fallback temporal (no recomendado): si solo tienes `FITBIT_CLIENT_ID/SECRET`, el código aún los lee, pero deben ser las credenciales **de Google Cloud**, no las del portal `dev.fitbit.com` antiguo.

Redeploy en Vercel tras guardar.

### 6. Test users (mientras esté en Testing)

Audience → Test users → añade tu Gmail y el de quien pruebe (cuenta Google que use Fitbit).

---

## Probar en la app

1. Cuenta Salvazion **Premium**.  
2. Health → **Wearables** → Cloud OAuth → **Fitbit · Google Health** → **Conectar**.  
3. Login Google → consentimiento de scopes Health.  
4. Vuelta a la app → **Sincronizar hoy**.

Comprobar status:

```bash
curl -s https://salvazion.org/api/wearables/oauth/status
# fitbit.configured debe ser true
```

O local:

```bash
node scripts/verify-wearables-oauth.mjs
```

---

## Qué sincroniza Salvazion hoy

Desde Google Health API (mejor esfuerzo / partial):

- Pasos  
- Distancia  
- Minutos activos  
- Calorías  
- FC en reposo  
- SpO₂  
- Sueño (horas + cama/despertar si vienen en el stream)

Código:

- OAuth: `lib/health/wearables/oauth/providers.ts` (`fitbit` → Google)  
- Métricas: `lib/health/wearables/oauth/fetch-metrics.ts` → `fetchFitbitViaGoogleHealth`  
- Start OAuth: `app/api/wearables/oauth/[provider]/start/route.ts`

---

## Checklist

- [ ] Google Cloud project + Health API enabled  
- [ ] OAuth consent + scopes googlehealth.*  
- [ ] Web client + redirect `…/fitbit/callback`  
- [ ] `GOOGLE_HEALTH_CLIENT_ID` + `SECRET` en Vercel + local  
- [ ] Test users (si Publishing = Testing)  
- [ ] Probar Conectar + Sincronizar con Premium  
- [ ] Planificar **verification** antes de escala / antes de 2026-09-30  
- [ ] No registrar ya apps nuevas en `dev.fitbit.com` para datos cloud  

## Errores frecuentes

| Error | Qué hacer |
|-------|-----------|
| `redirect_uri_mismatch` | URI en Google Cloud ≠ callback exacto |
| `access_denied` / app no verificada | Usuario no está en Test users |
| `403` al leer datos | Scopes mal otorgados o token con scopes fitness.* mezclados (reconectar limpio) |
| Refresh token 7 días | Consent en **Testing**; publicar app o re-consent periódico |
| `configured: false` | Faltan env o no redesplegaste |

## Oura / WHOOP / Garmin

Siguen con sus OAuth propios (no Google Health). Solo **Fitbit/Pixel** pasan por Google Health API.
