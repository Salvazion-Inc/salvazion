# Login con X (Twitter)

## Qué hace la app

- Botón **Continuar con X** en login y signup
- OAuth vía Supabase (`provider: twitter`)
- Tras el callback, se guarda en `profiles`:
  - `x_username` — handle sin `@`
  - `x_user_id` — id del proveedor
  - `name` y `avatar_url` si estaban vacíos
- En **Perfil** se muestra `@usuario` con enlace a `https://x.com/usuario`

## Setup (una vez)

### A) SQL (columnas del perfil)

1. Supabase → **SQL Editor** → New query  
2. Pega **todo** el contenido de `supabase/x-auth.sql` → **Run**  
3. Al final debe listar columnas `avatar_url`, `name`, `x_user_id`, `x_username`

**Si falla con `relation "public.profiles" does not exist`:**  
primero ejecuta `supabase/schema.sql` completo, luego otra vez `x-auth.sql`.

**Si solo quieres las 2 columnas** (proyecto ya con `profiles`):  
usa `supabase/x-auth-minimal.sql`:

```sql
alter table public.profiles add column if not exists x_username text;
alter table public.profiles add column if not exists x_user_id text;
```

### B) Provider X en Supabase (OAuth 2.0)

**Importante:** la app usa el provider `x` (OAuth 2.0), no el legacy `twitter` (OAuth 1.0a).

1. [X Developer Portal](https://developer.x.com/) → User authentication settings:
   - Type: **Web App**
   - Callback:
     ```
     https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback
     ```
   - Website: `https://salvazion.org`
   - Copia **Client ID** y **Client Secret** (Keys and tokens → OAuth 2.0)
2. Supabase (proyecto `kppylfrsclkdmtpobpxd`) → Authentication → Providers  
   → **X / Twitter (OAuth 2.0)** → Enable  
   → pega **Client ID** + **Client Secret** (no las API Key de OAuth 1.0a)  
   → **Save**
3. Redirect URLs de la app:
   - `https://salvazion.org/auth/callback`
   - `http://localhost:3000/auth/callback`

Si el error es `provider is not enabled`, casi siempre es porque se activó el provider legacy **Twitter (OAuth 1.0a)** en lugar de **X / Twitter (OAuth 2.0)**, o se pegaron las keys incorrectas.

### Error: `Error getting user profile from external provider`

Significa: X devolvió el token, pero Supabase no pudo llamar a la API de perfil de X.

Checklist en [developer.x.com](https://developer.x.com) → tu App:

1. **User authentication settings → Set up / Edit**
2. **App permissions:** Read  
3. **Request email from users:** **ON** (Supabase lo necesita a menudo)
4. **Type of App:** Web App  
5. **Callback URI:**  
   `https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback`  
6. **Website URL:** `https://app.salvazion.org`  
7. **Terms of service** y **Privacy policy** URLs rellenadas (app o sitio marketing)  
8. **Save**
9. **Keys and tokens** → sección **OAuth 2.0 Client ID and Client Secret**  
   - Copia **Client ID** y regenera/copia **Client Secret**  
10. En Supabase → **X / Twitter (OAuth 2.0)** pega **esas** credenciales (no “API Key / API Secret” de arriba)  
11. Save en Supabase y prueba en incógnito

Si tu app de X está en nivel Free y sigue fallando, confirma en el portal que OAuth 2.0 User authentication está activo para esa app.

## Flujo técnico

```
Usuario → Continuar con X
  → supabase.auth.signInWithOAuth({ provider: 'twitter' })
  → X consent
  → /auth/callback?code=…
  → exchangeCodeForSession
  → upsert profiles.x_username
  → /hub/dashboard o /hub/onboarding
```

Código principal:

- `lib/auth/x-oauth.ts`
- `components/auth/XAuthButton.tsx`
- `app/auth/callback/route.ts`
- `lib/store/profile.ts` (`applyXIdentityToProfile`)
