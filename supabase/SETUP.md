# Salvazion Auth + RLS — Setup

## 1. Crear proyecto Supabase
1. Ve a https://supabase.com → New Project
2. Nombre: `salvazion` (o el que prefieras)
3. Región cercana a tus usuarios (us-east-1 o sa-east-1)
4. Guarda la password de la DB

## 2. Ejecutar el schema
1. En el dashboard → SQL Editor → New query
2. Pega y ejecuta todo el contenido de `schema.sql`
3. Verifica que las 4 tablas aparecen en Table Editor y que RLS está ON

## 3. Configurar Auth
1. Authentication → Providers → Email → Enable
2. (Opcional) desactiva “Confirm email” solo en desarrollo para ir más rápido
3. Authentication → URL Configuration:
   - **Site URL (producción):** `https://app.salvazion.org`  
     (la app; **no** uses `www.salvazion.org` — ese es el sitio Canva antiguo)
   - **Redirect URLs** (añade todas):
     - `https://app.salvazion.org/auth/callback`
     - `https://app.salvazion.org/auth/confirm`
     - `https://www.app.salvazion.org/auth/callback`
     - `https://www.app.salvazion.org/auth/confirm`
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/confirm`
     - (opcional Preview) `https://*-tu-equipo.vercel.app/auth/callback`

Ver `docs/domains.md`.

## 3b. Login con X (Twitter)
1. SQL Editor → ejecuta **`supabase/x-auth.sql`** (columnas `x_username`, `x_user_id`)
2. Crea una app en el [X Developer Portal](https://developer.x.com/):
   - Type: Web App
   - Callback URL de Supabase (la muestra el dashboard):  
     `https://TU-PROJECT-REF.supabase.co/auth/v1/callback`
3. Authentication → Providers → **Twitter** → Enable
4. Pega **API Key** y **API Secret Key** (OAuth 1.0a) o Client ID/Secret según el flujo que use Supabase en tu proyecto
5. Guarda. En la app: Login / Signup → **Continuar con X**
6. El `@usuario` se guarda en el perfil y se muestra en Hub → Perfil

Docs oficiales: https://supabase.com/docs/guides/auth/social-login/auth-twitter

## 4. Variables de entorno

### Local
```bash
cp .env.local.example .env.local
```
Rellena con Project Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Vercel
Project → Settings → Environment Variables → mismas dos keys (Production + Preview).

## 5. Phalanx — invitaciones entre cuentas reales
Ejecuta en SQL Editor el archivo **`supabase/phalanx.sql`** (una vez).

Crea:
- `phalanx_invites` — invitaciones con código
- `phalanx_connections` — vínculo bidireccional entre usuarios
- RPC `accept_phalanx_invite(code)` y `get_phalanx_invite_preview(code)`

Flujo:
1. Usuario A invita desde Perfil → se guarda en `phalanx_invites` + enlace con `?invite=CODIGO`
2. Usuario B se registra o inicia sesión con ese enlace
3. La app llama `accept_phalanx_invite` → ambas cuentas quedan **conectadas**
4. Al abrir Perfil se sincronizan conexiones desde Supabase

## 6. Avatar de perfil (Storage opcional)
La foto funciona **offline** (comprimida en el dispositivo). Para multi-dispositivo:

1. SQL Editor — si el proyecto ya existía sin `avatar_url`:
```sql
alter table public.profiles add column if not exists avatar_url text;
```

2. Storage → New bucket:
   - Name: `avatars`
   - **Public** bucket: ON

3. Storage → Policies (o SQL):
```sql
-- Public read
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users upload/update only their folder: {user_id}/avatar.jpg
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

Sin el bucket, la foto se guarda igual en el dispositivo (localStorage).

## 7. Instalar dependencias
```bash
npm install
```

## 8. Arrancar
```bash
npm run dev
```

## Flujo de autenticación
| Paso | Ruta | Qué hace |
|------|------|----------|
| Landing | `/` | CTA → login |
| Registro | `/auth/signup` | `signUp` + metadata `name` → email confirm o sesión |
| Login | `/auth/login` | Password, magic link o recuperación |
| Callback PKCE | `/auth/callback` | `exchangeCodeForSession` → hub / update-password |
| Confirm token | `/auth/confirm` | `verifyOtp` (plantillas token_hash) |
| Nueva contraseña | `/auth/update-password` | Tras recovery link |
| Hub | `/hub/*` | Middleware exige sesión |
| Onboarding | `/hub/onboarding` | Primera vez si `onboarding_completed = false` |

- Signup crea `auth.users` + trigger crea `profiles` + `user_streaks`
- Si el trigger falla, la app llama `ensureProfileForUser()` como respaldo
- Onboarding hace upsert del perfil
- Profile: editar + cerrar sesión
- RLS: cada usuario solo ve y escribe sus propias filas (`auth.uid() = id/user_id`)

## Scores (sincronizados)
- `logAction` escribe optimista en local + push a `score_actions` y `user_streaks`.
- Al abrir el Dashboard se ejecuta `syncScoresFromServer()` → multi-device consistente.
- `resetScores` limpia local y las acciones de hoy + rachas en el servidor.
- Offline: la app sigue con localStorage; al reconectar sincroniza.

## Próximos pasos opcionales
- Migrar badges al mismo patrón.
- Historial multi-día desde `score_actions`.
- Leaderboard de la Phalanx (query agregada respetando RLS).
- OAuth (Google / Apple) con el mismo `/auth/callback`.
