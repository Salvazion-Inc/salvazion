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

1. Supabase SQL Editor → ejecuta `supabase/x-auth.sql`
2. [X Developer Portal](https://developer.x.com/) → app con callback:
   ```
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ```
3. Supabase → Authentication → Providers → Twitter → Enable + keys
4. Redirect URLs de la app ya incluyen `/auth/callback`

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
