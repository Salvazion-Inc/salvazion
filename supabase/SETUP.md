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
   - Site URL: `http://localhost:3000` (dev) o tu dominio de producción
   - Redirect URLs: añade `http://localhost:3000/auth/callback` y la de producción

## 4. Variables de entorno
```bash
cp .env.local.example .env.local
```
Rellena con Project Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 5. Instalar dependencias
```bash
npm install
```

## 6. Arrancar
```bash
npm run dev
```

## Flujo resultante
- Landing → “Ingresar a Hub” → `/auth/login`
- Middleware protege todo `/hub/*`
- Signup crea `auth.users` + trigger crea `profiles` + `user_streaks`
- Onboarding hace upsert del perfil
- Profile page: editar + cerrar sesión + borrar local
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
