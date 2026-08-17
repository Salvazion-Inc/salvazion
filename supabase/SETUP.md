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
4. Ejecuta también `subscriptions.sql` (Stripe Premium) y `ai-usage.sql` (cupos Free de IA + `profiles.solana_wallet` para el bonus de $SALVAZION)

## 3. Configurar Auth
1. Authentication → Providers → Email → Enable
2. (Opcional) desactiva “Confirm email” solo en desarrollo para ir más rápido
3. **Custom SMTP (producción obligatorio)** — From: **`info@salvazion.org`**  
   Authentication → Emails → SMTP Settings → Enable Custom SMTP  
   Guía completa: [`docs/email.md`](../docs/email.md)
4. Authentication → URL Configuration:
   - **Site URL (producción):** `https://salvazion.org`
   - **Redirect URLs** (añade todas):
     - `https://salvazion.org/auth/callback`
     - `https://salvazion.org/auth/confirm`
     - `https://www.salvazion.org/auth/callback`
     - `https://www.salvazion.org/auth/confirm`
     - `https://app.salvazion.org/auth/callback` (legacy)
     - `https://app.salvazion.org/auth/confirm` (legacy)
     - `https://www.app.salvazion.org/auth/callback` (legacy)
     - `https://www.app.salvazion.org/auth/confirm` (legacy)
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/confirm`
     - (opcional Preview) `https://*-tu-equipo.vercel.app/auth/callback`

Ver `docs/domains.md`.

## 3b. Login con Gmail (Google)
1. Google Cloud → OAuth Client (Web) con redirect:  
   `https://TU-PROJECT-REF.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → **Google** → Enable + Client ID/Secret
3. Guía: `docs/auth-google.md`

## 3c. Login con X (OAuth 2.0 — no usar Twitter V1 deprecado)
1. SQL Editor → ejecuta **`supabase/x-auth.sql`** si aún no lo hiciste
2. [X Developer Portal](https://developer.x.com/): Web App, Request email ON, callback:  
   `https://TU-PROJECT-REF.supabase.co/auth/v1/callback`
3. Authentication → Providers → **X / Twitter (OAuth 2.0)** → Enable  
   → **Client ID + Client Secret** (OAuth 2.0), no API Key de V1
4. En la app: **Continuar con X** → el `@` se guarda en el perfil

Guía: `docs/auth-x.md`  
Docs: https://supabase.com/docs/guides/auth/social-login/auth-twitter

## 4. Variables de entorno

### Local
```bash
cp .env.example .env.local
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

## 6. Avatar de perfil (multi-dispositivo web ↔ mobile)

La foto puede guardarse **solo en el dispositivo** (localStorage) si no hay Storage.
Para **sincronizar web ↔ mobile**, ejecuta el SQL listo:

**Archivo:** [`avatars-storage.sql`](./avatars-storage.sql)

1. Abre **Supabase → SQL Editor**
2. Pega **todo** el contenido de `avatars-storage.sql`
3. **Run**
4. En Results deberías ver `ok = true` para columna y bucket, y `policy_count = 4`

Eso crea/actualiza:
- columna `profiles.avatar_url`
- bucket público `avatars`
- policies de lectura pública + write solo en carpeta `{user_id}/…`

Verificación rápida en el dashboard:
- **Storage → Buckets → `avatars`** debe existir y estar **Public**
- Cambia la foto en web y confirma que aparece un archivo bajo `avatars/{user_id}/`

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

## Badges (sincronizados)
- `evaluateBadges` otorga local + push a `user_badges` (upsert).
- Dashboard / página Insignias llaman `syncBadgesFromServer()` para multi-device.
- Offline: localStorage; al reconectar se fusiona con el servidor.

## Próximos pasos opcionales
- Historial multi-día extendido desde `score_actions` (más de 7–30 días).
- Leaderboard de la Phalanx (query agregada respetando RLS).
- OAuth (Google / Apple) con el mismo `/auth/callback`.
