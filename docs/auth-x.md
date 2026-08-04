# Login con X (OAuth 2.0 only)

La app usa **solo** el provider Supabase **`x`** (X / Twitter OAuth 2.0).  
**No** se usa el provider legacy **Twitter** (OAuth 1.0a).

## Flujo

1. App → `signInWithOAuth({ provider: 'x' })`
2. Supabase → `https://x.com/i/oauth2/authorize`  
   scopes: `users.email tweet.read users.read offline.access`
3. Usuario autoriza en X
4. X devuelve el code a Supabase:  
   `https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback`
5. Supabase intercambia el code y llama  
   **`GET https://api.x.com/2/users/me`**  
   ← si esto falla → *Error getting user profile from external provider*
6. Si OK → `https://salvazion.org/auth/callback?code=...`

El código de la app solo inicia el paso 1.  
El error de perfil es **entre Supabase y la API de X** (paso 5).

## Supabase

Proyecto: `kppylfrsclkdmtpobpxd`

1. **Authentication → Providers → X / Twitter (OAuth 2.0)**
2. **Enable = ON**
3. **Client ID** + **Client Secret** (OAuth 2.0 de X — **no** API Key / API Secret V1)
4. **Save**
5. Deja **Twitter (OAuth 1.0a) desactivado** si no lo quieres

### URL Configuration

- Site URL: `https://salvazion.org`
- Redirects:

```
https://salvazion.org/auth/callback
https://salvazion.org/auth/confirm
https://www.salvazion.org/auth/callback
http://localhost:3000/auth/callback
```

## developer.x.com / console.x.com (obligatorio)

Sin esto, el authorize de X puede verse bien y **fallar al volver**.

### 1) Acceso API (causa #1 del error de perfil)

En 2026, Free/DEV suele devolver `403 client-not-enrolled` en  
`GET /2/users/me` (lo que Supabase necesita).

1. Abre [console.x.com](https://console.x.com) / [developer.x.com](https://developer.x.com)
2. App asociada a un **Project**
3. Mueve la app a **Pay-per-use** (o superior)
4. Entorno **Production** (no solo Development)
5. Guarda / espera propagación (a veces minutos)

Staff de X ha indicado que OAuth 2.0 user-context + `/2/users/me`  
**no funciona** en Free + DEV.

### 2) User authentication settings

1. App → **User authentication settings**
2. Permissions: **Read**
3. **Request email from users: ON**
4. Type: **Web App** (confidential client → Client Secret)
5. Callback **exacto**:

```
https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback
```

6. Website: `https://salvazion.org`
7. Terms: `https://salvazion.org/terms`
8. Privacy: `https://salvazion.org/privacy`
9. **Save**

### 3) Credenciales OAuth 2.0

1. **Keys and tokens** → **OAuth 2.0 Client ID and Client Secret**
2. Copia Client ID
3. **Regenerate** Client Secret si no lo tienes (solo se muestra una vez)
4. Pégalos en Supabase → **X / Twitter (OAuth 2.0)** → Save

| Correcto | Incorrecto |
|----------|------------|
| OAuth 2.0 Client ID | API Key (Consumer Key) |
| OAuth 2.0 Client Secret | API Secret (Consumer Secret) |
| Provider **X / Twitter (OAuth 2.0)** | Provider **Twitter** (OAuth 1.0a) |

## Probar

1. Incógnito → `https://salvazion.org/auth/login`
2. Acepta términos → **Continuar con X**
3. Autoriza en x.com
4. Debe entrar a dashboard/onboarding

Comprobar authorize (debe ser 302 a `x.com/i/oauth2/authorize`):

```text
https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/authorize?provider=x&redirect_to=https://salvazion.org/auth/callback
```

## Errores

| Mensaje | Causa | Acción |
|---------|--------|--------|
| `provider is not enabled` | X OAuth 2.0 off | Supabase → Providers → X / Twitter (OAuth 2.0) ON |
| **`client-not-enrolled` / Client Forbidden** (Auth Log 403) | App sin Project / sin nivel de API | Ver sección abajo “Fix client-not-enrolled” |
| **`Error getting user profile from external provider`** | Casi siempre el 403 de arriba | Mismo fix; el mensaje genérico oculta el 403 de X |
| `Error getting user email from external provider` | Sin email | Request email ON; email verificado en la cuenta X |

### Fix `client-not-enrolled` (error real de este proyecto)

Auth Log ejemplo (app `client_id` **28640212**):

```json
{
  "reason": "client-not-enrolled",
  "title": "Client Forbidden",
  "detail": "When authenticating requests to the X API v2 endpoints, you must use keys and tokens from a developer App that is attached to a Project...",
  "required_enrollment": "Appropriate Level of API Access"
}
```

Significa: OAuth en pantalla funciona, pero **`GET /2/users/me` está prohibido** para esa App.

Pasos en [developer.x.com](https://developer.x.com) / [console.x.com](https://console.x.com):

1. Crea un **Project** si no tienes uno (Projects overview).
2. **Adjunta la App** a ese Project (no dejes la app “standalone” sin proyecto).
3. En la app: **Move to package** / suscripción → **Pay-per-use**.
4. Entorno de la app: **Production** (Development suele fallar igual).
5. Espera unos minutos y vuelve a **Continuar con X** en incógnito.
6. No hace falta cambiar el código de Salvazion ni activar Twitter OAuth 1.0a.

Si creas una App nueva dentro del Project:

1. Configura User auth + callback de Supabase.
2. Copia el **nuevo** OAuth 2.0 Client ID/Secret a Supabase → X / Twitter (OAuth 2.0) → Save.

### Ver el error real de X

**Supabase → Authentication → Logs** (o Logs → Auth).  
Busca el 500 del callback: debajo suele estar el 403/401 de X  
(`client-not-enrolled`, invalid client, etc.).

## Código

| Archivo | Rol |
|---------|-----|
| `lib/auth/x-oauth.ts` | `provider: 'x'` únicamente |
| `components/auth/XAuthButton.tsx` | Botón Continuar con X |
| `app/auth/callback/route.ts` | PKCE + stamp de perfil |

**No hay fix en Next.js** si el paso 5 (perfil) falla: hay que arreglar  
acceso API + credentials en X y Supabase.
