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

### B) Provider X en Supabase

1. [X Developer Portal](https://developer.x.com/) → app con callback:
   ```
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ```
2. Supabase → Authentication → Providers → Twitter → Enable + keys
3. Redirect URLs de la app ya incluyen `/auth/callback`

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
