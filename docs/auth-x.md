# Login con X — guía de reparación

## Error: `Error getting user profile from external provider`

Significa: **X te dejó autorizar**, pero **Supabase falló al llamar a la API de perfil de X**.

Supabase OAuth 2.0 (`provider: x`) llama a:

```http
GET https://api.x.com/2/users/me?user.fields=...,confirmed_email,...
```

Eso falla a menudo en apps Free / mal configuradas (email no permitido, Client Secret incorrecto, scopes).

### Solución recomendada (OAuth 1.0a) — suele funcionar ya

Usa el provider legacy **Twitter** con **API Key + API Secret** (no Client ID).

#### A) Portal de X — [developer.x.com](https://developer.x.com)

1. Tu App → **Keys and tokens**
2. Copia:
   - **API Key** (Consumer Key)
   - **API Key Secret** (Consumer Secret)
3. **User authentication settings → Edit**
   - App permissions: **Read**
   - **Request email from users: ON**
   - Type of App: **Web App**
   - Callback URI (igual que siempre):
     ```
     https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback
     ```
   - Website: `https://app.salvazion.org`
   - Terms + Privacy URLs rellenadas
   - **Save**

#### B) Supabase — proyecto `kppylfrsclkdmtpobpxd`

1. **Authentication → Providers**
2. Abre **Twitter** (OAuth 1.0a / el que pide API Key, **no** solo “X OAuth 2.0”)
3. **Enable = ON**
4. Pega **API Key** y **API Secret Key**
5. **Save**

(Puedes dejar OAuth 2.0 también, pero la app priorizará 1.0a.)

#### C) Vercel — Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://app.salvazion.org
NEXT_PUBLIC_SUPABASE_URL=https://kppylfrsclkdmtpobpxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…tu key…
NEXT_PUBLIC_X_AUTH_PROVIDER=twitter
```

**Redeploy** (obligatorio tras cambiar `NEXT_PUBLIC_*`).

#### D) Probar

Incógnito → `https://app.salvazion.org/auth/login` → **Continuar con X**.

---

### Si prefieres OAuth 2.0 (`provider: x`)

1. X → Keys and tokens → **OAuth 2.0 Client ID and Client Secret** (abajo)
2. Supabase → **X / Twitter (OAuth 2.0)** → Client ID + Client Secret → Save  
3. En X: **Request email from users = ON** (Supabase pide `users.email` + `confirmed_email`)
4. Vercel:
   ```env
   NEXT_PUBLIC_X_AUTH_PROVIDER=x
   ```
5. Redeploy

Si el perfil sigue fallando en Free tier, vuelve a **OAuth 1.0a** (`twitter`).

---

### Redirect URLs en Supabase (app, no Canva)

**Site URL:** `https://app.salvazion.org`

```
https://app.salvazion.org/auth/callback
https://app.salvazion.org/auth/confirm
http://localhost:3000/auth/callback
```

### Callback en X (no cambia)

```
https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback
```

---

## Código

- `lib/auth/x-oauth.ts` — elige provider con `NEXT_PUBLIC_X_AUTH_PROVIDER`
- Default actual: **`twitter`** (OAuth 1.0a) por fiabilidad
- Perfil muestra `@usuario` tras login correcto
