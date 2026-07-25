# Login con Gmail (Google)

Las keys de Google **no van en Vercel**. Van en **Supabase**.

## 1) Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com/) → crea o elige un proyecto  
2. **APIs & Services → OAuth consent screen**  
   - External (o Internal si es Workspace)  
   - App name: Salvazion  
   - Support email: el tuyo  
   - Save  
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**  
   - Application type: **Web application**  
   - Name: Salvazion App  
   - **Authorized JavaScript origins:**
     ```
     https://app.salvazion.org
     http://localhost:3000
     ```
   - **Authorized redirect URIs:**
     ```
     https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback
     ```
4. Copia **Client ID** y **Client Secret**

## 2) Supabase

1. Proyecto `kppylfrsclkdmtpobpxd`  
2. **Authentication → Providers → Google**  
3. **Enable = ON**  
4. Pega Client ID + Client Secret  
5. **Save**

## 3) Redirect URLs de la app (si aún no están)

**Authentication → URL Configuration**

- Site URL: `https://app.salvazion.org`
- Redirect:
  ```
  https://app.salvazion.org/auth/callback
  https://app.salvazion.org/auth/confirm
  http://localhost:3000/auth/callback
  ```

## 4) Probar

`https://app.salvazion.org/auth/login` → **Continuar con Gmail**

No hace falta ninguna variable nueva en Vercel (solo las de Supabase que ya tienes).

## Error 400: `provider is not enabled`

La app llama al proyecto de `NEXT_PUBLIC_SUPABASE_URL` en Vercel. Si Google está ON en **otro** proyecto, verás este error.

1. Vercel → Environment Variables → copia el valor de `NEXT_PUBLIC_SUPABASE_URL`  
   Debe ser: `https://kppylfrsclkdmtpobpxd.supabase.co`
2. Abre **ese** proyecto en Supabase (no otro).
3. Authentication → Providers → **Google**:
   - Toggle **Enabled** = ON (verde)
   - Client ID y Client Secret rellenados (no vacíos)
   - **Save** otra vez
4. Vercel → Redeploy (por si la URL de Supabase se cambió hace poco)

**No** pongas Client ID/Secret de Google en Vercel.

## Código

- `lib/auth/google-oauth.ts`
- `components/auth/GoogleAuthButton.tsx`
- `components/auth/SocialAuthButtons.tsx` (Gmail + X)
